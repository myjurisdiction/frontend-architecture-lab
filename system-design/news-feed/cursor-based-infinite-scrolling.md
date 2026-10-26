# How Instagram-style infinite scrolling and background feed updates work

When you scroll through Instagram, two different operations are typically happening:

1. Infinite scrolling: Fetching older posts as you move down the feed.
2. Background freshness checks: Checking whether newer posts are available while you're viewing existing posts.

These processes solve different problems, and they map directly to the `Feed` entity we've been discussing.

Instagram's engineering team has publicly described its web feed as loading an initial batch of posts, then prefetching additional batches before users reach the end. It has also described prioritizing requests based on how close users are to the end of their currently loaded feed.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://medium.com&sz=32)

Medium

The exact modern Instagram implementation isn't fully public, so I'll explain the established engineering pattern using React, TanStack Query, Axios, and your normalized store.

## 1. How infinite scrolling actually works

Suppose Instagram initially loads 10 posts.

Your feed state might look like this:

```
const feed = {
  id: "home",
  generation: "G1",
  postIds: ["P100", "P99", "...", "P91"],
  olderCursor: "cursor_P91",
  newerCursor: "cursor_P100",
  hasOlder: true,
  hasNewer: false,
  lastFetchedAt: Date.now()
};
```

The frontend displays those 10 posts.

As the user scrolls, the application needs to know when to request the next batch.

### Step 1 — Detect when the user approaches the bottom

Modern web applications commonly use the browser's `IntersectionObserver` API.

Instead of continuously listening to every scroll event and calculating scroll positions manually, we place an invisible element near the bottom of the list.

This is called a sentinel.

Viewport

Loaded posts

Post 7

Post 8

Post 9

Post 10

Invisible sentinel

Observer triggers a fetch when this gets close

Fetch next page before the user reaches the end

Use olderCursor to request more posts

Example React implementation:

```
const sentinelRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (
        entry.isIntersecting &&
        hasOlder &&
        !isFetching
      ) {
        fetchNextPage();
      }
    },
    {
      rootMargin: "600px"
    }
  );

  const sentinel = sentinelRef.current;

  if (sentinel) observer.observe(sentinel);

  return () => observer.disconnect();
}, [hasOlder, isFetching, fetchNextPage]);
```

### Why `rootMargin: "600px"`?

This is the interesting part.

Without a margin, the sentinel usually triggers when it enters the viewport.

With `rootMargin: "600px"`, the observer can trigger when the sentinel is still roughly 600 pixels below the viewport.

That means the application fetches more content before the user reaches the actual bottom.

The 600px value is illustrative, not a confirmed Instagram setting.

### Step 2 — Fetch older posts using the cursor

```
GET /feed?generation=G1&olderCursor=cursor_P91
```

Example response:

```
{
  "postIds": ["P90", "P89", "P88"],
  "olderCursor": "cursor_P88",
  "hasOlder": true,
  "generation": "G1"
}
```

The client merges the new IDs into the existing feed:

```
feed.postIds = [
  ...feed.postIds,
  ...newPostIds
];
```

In production, you'd also deduplicate IDs, handle concurrent requests, and update the normalized `postsById`, `usersById`, and `mediaById` stores.

The resulting feed becomes:

```
P100
P99
...
P91
P90  ← newly loaded
P89  ← newly loaded
P88  ← newly loaded
```

No full-page reload happens. The React application simply renders additional posts.

## 2. How Instagram makes this feel seamless

Just fetching the next batch is not enough.

Imagine the user scrolls rapidly, but the API takes one second to respond. They may still reach the end of the loaded posts.

Instagram has publicly described additional optimizations:

- Prefetching next-page data during browser idle time.
- Increasing request priority when the user nears the end.
- Prefetching images sequentially in display order so nearer images get priority.

In its published web performance work, Instagram reported a 56% reduction in the time users spent waiting at the end of the feed from its prefetching approach.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://medium.com&sz=32)

Medium

The principle is:

Don't wait until the user needs the next page. Fetch it when there's a reasonable likelihood they'll need it soon.

A production implementation also balances bandwidth usage, device performance, and scrolling speed. Loading too aggressively wastes resources.

## 3. Interactive example — How infinite scrolling and newer-post checks work together

## Home feed simulation

Generation G1 · Cursor-based pagination

&#x20;Reset

Older cursor

After P96

Newer cursor

After P102

&#x20;Simulate new posts Check for new posts

P102

Feed item 1

P101

Feed item 2

P100

Feed item 3

P99

Feed item 4

P98

Feed item 5

P97

Feed item 6

P96

Feed item 7

IntersectionObserver sentinel

&#x20;Simulate reaching prefetch threshold

Latest operation

New posts prepended; user chose to refresh

Loaded: 7 · New posts awaiting insertion: 0

This is a local simulation. The controls represent network events and scrolling thresholds without performing real API requests.

Notice two important behaviors:

- When you fetch older posts, they're appended at the bottom.
- When newer posts become available, they're not automatically inserted into the visible list. The user can choose when to display them.

That second decision matters because automatically adding posts above the user's current position may create unexpected scroll jumps.

## 4. How does the application check for new posts in the background?

Now suppose you're reading Post P85, somewhere down the feed.

Meanwhile, your friends publish P101, P102, and P103.

How does the frontend discover these posts?

There are several possible mechanisms.

### Approach A — Periodic polling

The frontend periodically asks the backend if new content is available.

For example:

```
GET /feed/newer?cursor=cursor_P100
```

The server might respond:

```
{
  "postIds": ["P103", "P102", "P101"],
  "newerCursor": "cursor_P103",
  "hasNewer": false
}
```

Here `hasNewer: false` could mean there are no additional pages of newer results after this response, not that no new posts were returned. The precise semantics must be defined by the API.

With React Query, a simple polling mechanism might look like:

```
const newerPostsQuery = useQuery({
  queryKey: ["feed-newer", feed.id, feed.newerCursor],

  queryFn: () =>
    axios.get("/feed/newer", {
      params: {
        cursor: feed.newerCursor
      }
    }).then(res => res.data),

  refetchInterval: 60_000,

  refetchIntervalInBackground: false
});
```

This is illustrative, not Instagram's confirmed polling interval or implementation.

A separate query key makes it possible to check for new posts without automatically replacing the loaded feed pages.

### Approach B — Refresh on window focus

Suppose you switch from Instagram to another browser tab for several minutes.

When you return, the application can check whether its feed data is stale.

React Query supports stale-data refetching when the window regains focus, along with configurable freshness and polling policies.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://github.com&sz=32)

GitHub

+1

A typical strategy is:

- User leaves the tab.
- Existing feed stays cached.
- User returns after the freshness interval.
- Frontend performs a background request.
- New posts are stored or exposed through a notification.

### Approach C — Server push

Applications can also use WebSockets or Server-Sent Events.

For example, the server may notify the frontend:

```
{
  "type": "NEW_POSTS_AVAILABLE",
  "feedId": "home",
  "generation": "G2"
}
```

The frontend then fetches the latest posts or updated ranking.

The notification might only indicate that the feed changed, rather than transmitting every Post object.

This can reduce unnecessary polling, but server push introduces its own connection-management and scaling costs.

Important: These are common implementation options. Instagram's precise current new-post detection mechanism is not established by the public engineering material cited here.

## 5. Why not automatically insert new posts?

Imagine you've scrolled through 40 posts and are reading an interesting article.

Suddenly five new posts are inserted at the beginning.

Depending on the list implementation, this can disrupt your reading experience, move content, or cause a scroll-position jump.

A safer approach is to maintain two separate collections:

```
const feed = {
  postIds: [
    "P100",
    "P99",
    "P98"
    // ...
  ]
};

const pendingNewPostIds = [
  "P103",
  "P102",
  "P101"
];
```

The UI can show:

3 new posts available

New posts can be merged when the user refreshes or returns to the top.

When the user requests the new content:

```
feed.postIds = [
  ...pendingNewPostIds,
  ...feed.postIds
];
```

In practice, deduplication is required.

There is another consideration related to our earlier discussion of feed generations: If these posts belong to G2, but your currently loaded feed belongs to G1, blindly merging them may break the ordering of a ranked feed.

For a purely chronological feed, prepending is often reasonable. For a heavily ranked feed, switching to a new generation or reconciling the ordering with the server may be more appropriate.

## 6. How the implementation maps to your Feed data model

| Property        | Infinite scrolling                       | Background refresh                           |
| --------------- | ---------------------------------------- | -------------------------------------------- |
| `postIds`       | Append older IDs                         | Prepend or reconcile newer IDs               |
| `olderCursor`   | Fetch next older page                    | Usually unchanged                            |
| `newerCursor`   | Usually unchanged                        | Anchor for newer posts                       |
| `hasOlder`      | Determines whether to continue downwards | Not usually involved                         |
| `hasNewer`      | Not usually involved                     | Depends on newer-pagination semantics        |
| `generation`    | Keep continuation consistent             | Detect or reconcile a new ranking generation |
| `lastFetchedAt` | Track freshness of existing data         | Help decide when to check for updates        |

You may also need additional fields not included in your original `Feed` type:

```
type FeedUIState = {
  isFetchingOlder: boolean;
  isCheckingNewer: boolean;
  pendingNewPostIds: string[];
  olderFetchError: string | null;
};
```

These needn't all be manually stored. When using React Query, many request-status fields are available from the query itself.

## 7. Where does `useInfiniteQuery` fit?

For a React application similar to Parspec, I'd use `useInfiniteQuery` to manage older-post pagination.

```
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetching,
  isFetchingNextPage
} = useInfiniteQuery({
  queryKey: ["feed", feedId, generation],

  initialPageParam: null as string | null,

  queryFn: ({ pageParam }) =>
    fetchFeed({
      feedId,
      generation,
      olderCursor: pageParam
    }),

  getNextPageParam: (lastPage) =>
    lastPage.hasOlder
      ? lastPage.olderCursor ?? undefined
      : undefined
});
```

This assumes the API returns a usable cursor whenever `hasOlder` is true.

`useInfiniteQuery` manages fetched pages, page parameters, and pagination status. It also provides `fetchNextPage` and `hasNextPage`, which can be connected to an `IntersectionObserver`.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://tanstack.com&sz=32)

TanStack Query React Docs

In our normalized architecture, you'd transform incoming responses into `postsById`, `usersById`, and `mediaById`, while maintaining the ordered IDs in the feed. That normalization is something you implement explicitly; TanStack Query doesn't do it automatically.

One important production detail: guard against overlapping pagination and background refetch operations, because an infinite query shares a cache entry across its pages.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://github.com&sz=32)

GitHub

## Final summary — Notes for frontend system design

- Infinite scrolling: Loads additional posts as the user moves toward the bottom without a full-page navigation.
- IntersectionObserver: Detects when a sentinel element approaches the viewport and triggers pagination.
- `rootMargin`: Allows the frontend to fetch posts before users reach the end of the loaded content.
- Cursor pagination: `olderCursor` identifies where to continue fetching older posts.
- Background prefetching: Fetches next-page data ahead of time to reduce perceived loading delays.
- Media prefetching: Can preload upcoming images or videos selectively to improve perceived performance.
- Background freshness checks: Polling, window-focus refetching, or server push can notify the frontend when newer content is available.
- `newerCursor`: Can identify the latest known feed position for requesting newer posts.
- Non-disruptive refresh: Newly discovered posts can be buffered and displayed through a "New posts" notification rather than immediately changing the visible feed.
- Feed generation: Helps maintain consistent ranking and ordering during pagination; newer generations require deliberate reconciliation.
- React Query: `useInfiniteQuery` manages older-page pagination, while a separate query or notification mechanism can handle newer-post checks.
- Normalized store: New post data updates the entity maps, and the feed's `postIds` determines display order.
- Performance: Use pagination, selective prefetching, request deduplication, efficient media loading, and list virtualization when necessary to control memory and rendering costs.

The most important architectural distinction: Infinite scrolling is about loading more of the existing feed, while background refresh is about discovering changes to the feed. They can run independently, but both must coordinate with the feed's cursors, generation, and normalized entity store.
