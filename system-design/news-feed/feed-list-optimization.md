## News Feed System Design — Infinite Scrolling, Caching & Freshness

\- Infinite scrolling: Fetch the next batch of posts using cursor-based pagination as the user approaches the end of the currently loaded feed.

\- Prefetching: Load upcoming posts before the user reaches the bottom to minimize loading delays.

- A trigger distance of approximately one viewport height is a reasonable starting point.
- Dynamically adjust the distance based on network speed and scrolling velocity.
- Balance responsiveness against unnecessary requests and bandwidth usage.

\- Detecting when to fetch more posts:

- Scroll event: Use a throttled scroll listener and `getBoundingClientRect()` to detect proximity to the bottom.
- Intersection Observer API (preferred): Observe a sentinel element near the bottom and trigger pagination when it approaches the viewport.
- Use `rootMargin` to initiate fetching before the sentinel becomes visible.

\- Loading indicators:

- Show placeholders when users scroll faster than the next page can load.
- Prefer post-shaped skeleton loaders over a generic spinner.
- Optionally add a lightweight shimmer effect.
- Reserve layout space to minimize visual jumps (CLS).

\- Preserving scroll position:

- Cache loaded feed data in the client-side store so returning from a post-detail page doesn't require rebuilding the feed.
- Save the scroll position and restore it when the user returns.
- For dynamic feeds, prefer storing anchor post ID + within-post offset + feed generation rather than relying only on pixel position.
- Restore the position after the necessary items have rendered and their dimensions are available.
- Keep the raw pixel offset as a fallback.

\- Handling stale feeds:

- Track `lastFetchedAt` to determine when feed data may be stale.
- Refetch or prompt the user to refresh when the feed exceeds a defined freshness threshold.
- A new feed generation may require replacing the old ordering rather than blindly merging posts.
- Cached data can be evicted when no longer needed, considering memory usage and user experience.

\- Background refresh for newer posts:

- Periodically fetch newer posts or check when the browser tab regains focus.
- Avoid automatically prepending posts while the user is reading, as this may disrupt scroll position.
- Prefer a "New posts available" banner, allowing users to refresh or merge content when ready.

\- Server-driven invalidation:

- Use WebSockets or Server-Sent Events (SSE) to notify the client about updates.
- The server may send an entity version, feed generation, or high-water mark to indicate that cached data is outdated.
- The client can invalidate/refetch affected entities or apply authorized, versioned updates.
- Useful for rapidly changing reaction counts, deleted posts, and feed changes.

\- Cross-tab synchronization:

- Each browser tab has its own JavaScript runtime and in-memory React Query cache.
- Use `BroadcastChannel` to notify other tabs when entities change.
- Broadcast either a versioned entity patch or an entity ID/version that triggers refetching.
- Use backend-assigned versions to reject stale updates.
- IndexedDB can provide shared persistent storage, but it doesn't automatically synchronize in-memory caches.

\- Optimistic updates + cross-tab invalidation:

- Immediately update the initiating tab's UI for actions such as reactions.
- After server confirmation, broadcast the updated entity/version or trigger invalidation in other tabs.
- Other tabs reconcile their caches with the latest authoritative server state.

### Interview takeaway

A production-ready news feed combines cursor-based infinite scrolling, proactive prefetching, skeleton loading, scroll restoration, stale-feed detection, background updates, and cross-tab synchronization to deliver a continuous and responsive experience without sacrificing data consistency.
