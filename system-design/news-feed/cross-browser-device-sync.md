This paragraph explains cross-tab state synchronization—a common challenge in frontend system design.

It also connects to your second question about how ChatGPT synchronizes conversations between your laptop and mobile phone.

However, there is an important difference:

- Two browser tabs: Can communicate locally using browser APIs such as `BroadcastChannel`.
- Laptop and mobile: Require backend synchronization because they're separate devices and don't share browser memory.

Let's understand both.

## 1. The problem: Two tabs have independent JavaScript memory

Imagine you open Instagram in two browser tabs.

Tab A

React Query cache A

Love

Updated

Tab B

React Query cache B

Like

Stale

Both tabs display the same post but hold independent in-memory caches.

Suppose the user changes their reaction from Like to Love in Tab A.

What happens?

1. Tab A optimistically updates its React Query cache.
2. Tab A sends an API mutation to the backend.
3. Backend stores the new reaction.
4. Tab A receives the response and displays Love.
5. Tab B still displays Like, because its JavaScript runtime and React Query cache are independent.

Even though these tabs belong to the same origin, they don't automatically share JavaScript objects or React state.

## 2. Solution: BroadcastChannel

`BroadcastChannel` is a browser API that enables communication between same-origin tabs and other eligible browsing contexts in the same storage partition.

It acts like a local messaging channel.

Tab A — Reaction updated

Server confirms Love, version 12

BroadcastChannel: feed-sync

Message: Post P101 changed, version 12

Tab B receives message

Invalidates its cached post and refetches from the server

### Implementation

Both tabs subscribe to the same channel:

```
const channel = new BroadcastChannel("feed-sync");
```

After Tab A's mutation succeeds:

```
channel.postMessage({
  type: "POST_UPDATED",
  postId: "P101",
  version: 12
});
```

Tab B listens:

```
channel.onmessage = (event) => {
  const message = event.data;

  if (message.type === "POST_UPDATED") {
    queryClient.invalidateQueries({
      queryKey: ["post", message.postId]
    });
  }
};
```

When Tab B receives this message, React Query marks the matching query as stale and typically refetches it if active.

The user can then see the updated reaction without manually refreshing.

This is illustrative: if you're using a normalized store, you would also update or invalidate the corresponding normalized post entity. And because a post may appear in multiple feed queries, the cache invalidation strategy must cover those representations too.

## 3. What does "versioned entity patch" mean?

Instead of just broadcasting a post ID, Tab A can broadcast the updated fields:

```
channel.postMessage({
  type: "POST_UPDATED",
  postId: "P101",
  version: 12,
  patch: {
    viewerReaction: "love"
  }
});
```

Tab B can update its cache directly without an additional GET request.

But why include `version: 12`?

Consider this situation:

- Tab B currently has Post P101 at version 11.
- It receives an update for version 12.
- Later, due to delayed messaging or another synchronization path, it encounters an older update for version 10.

Without version checking, an old update could overwrite newer state.

```
if (incoming.version <= cached.version) {
  return; // Ignore older or duplicate update
}
```

Important: The version should ideally come from the backend, not independent per-tab counters, so versions are comparable.

Also, a patch that contains only changed fields may require a known base version. If Tab B missed version 11 and receives a patch intended for version 11, applying it directly to version 9 could produce incorrect state.

A robust strategy is:

- Apply a patch only if its base version matches the local entity version.
- Otherwise, refetch the authoritative entity.

For your interview, broadcasting an ID and invalidating the relevant query is usually the simpler design.

## 4. Why does the paragraph mention IndexedDB?

The paragraph says:

> "It does not make per-tab memory shared; re-reading locally requires a shared backing store such as IndexedDB."

This means `BroadcastChannel` transfers messages; it does not turn two independent React Query caches into one shared cache.

Suppose Tab A stores a value in a local JavaScript Map:

```
const postsById = new Map();
postsById.set("P101", updatedPost);
```

Tab B cannot directly read Tab A's Map.

Even after receiving a BroadcastChannel message, Tab B must obtain the updated post through one of three approaches:

- Receive the new data directly in the broadcast message.
- Fetch the latest data from the server.
- Read it from shared persistent browser storage, such as IndexedDB, if Tab A wrote it there.

With IndexedDB:

```
Tab A
   ↓ writes P101
IndexedDB (shared origin storage)
   ↑ reads P101
Tab B
```

Each tab still has independent memory. IndexedDB provides a shared storage location.

The BroadcastChannel message can simply notify Tab B that the stored data has changed.

You don't need IndexedDB just to synchronize tabs. It's an option when you want persisted, locally shared data. Broadcasting updates or invalidating queries may be sufficient.

## 5. How does ChatGPT synchronize your laptop and mobile conversations?

This is a different architectural problem: cross-device synchronization.

Your laptop and mobile phone cannot communicate through `BroadcastChannel`, because they're separate devices with independent operating systems, browser storage, and JavaScript runtimes.

Instead, ChatGPT saves regular conversations to your account and synchronizes chat history across devices where you're signed into the same account.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://help.openai.com&sz=32)

OpenAI Help Center

+1

Conceptually, the architecture looks like this:

Laptop

ChatGPT Web

Mobile

ChatGPT App

Backend APIs

Authentication, conversation retrieval, messages and synchronization

Persistent conversation storage

Account-associated conversations and messages

Here's a simplified explanation of what happens.

Step 1 — You send a message from your laptop.

The application communicates with OpenAI's backend, and the conversation is associated with your account.

Step 2 — You open ChatGPT on your mobile.

Your mobile app authenticates your account and can retrieve the same conversation from the backend.

Conceptually, that might resemble:

```
GET /conversations/123/messages
Authorization: Bearer <access-token>
```

This is an illustrative API, not an assertion about ChatGPT's actual internal endpoints.

Step 3 — You see your previous messages.

The mobile app displays the stored conversation history, even though the messages were originally sent using your laptop.

For near-real-time updates across devices, an application could use polling, server push, or refetching on application focus. I can't confirm the exact internal synchronization mechanisms ChatGPT uses.

### Compare the two architectures

| Feature                   | Two browser tabs                      | Laptop and mobile                   |
| ------------------------- | ------------------------------------- | ----------------------------------- |
| JavaScript runtime        | Independent                           | Independent                         |
| BroadcastChannel          | Yes, when eligible                    | No, across devices                  |
| Shared IndexedDB          | Usually possible for same-origin tabs | No                                  |
| Backend synchronization   | Optional for local tab messaging      | Necessary for shared account data   |
| Persistent server storage | Depends on application                | Used for ChatGPT history            |
| WebSocket / polling       | Optional                              | Possible synchronization strategies |

## Final summary — Frontend system design notes

- Cross-tab problem: Two browser tabs have separate JavaScript runtimes and independent in-memory React Query caches.
- BroadcastChannel: Allows eligible same-origin tabs to exchange messages without contacting the backend for the message transfer.
- Entity patches: One tab can broadcast changed fields to another tab.
- Versioning: Backend-assigned versions help prevent stale updates from overwriting newer cached entities.
- Refetch strategy: Instead of sending an entire updated object, broadcast the entity ID and invalidate/refetch the relevant query.
- IndexedDB: Can act as shared persistent browser storage, but doesn't automatically synchronize in-memory React state.
- Cross-device synchronization: Separate devices require a shared backend to exchange and retrieve application data.
- ChatGPT example: Conversations are saved to your account, allowing your laptop and mobile app to access the same history.
- Consistency: Both cross-tab and cross-device designs must consider stale data, concurrent writes, authentication, and conflict resolution.

Interview takeaway: BroadcastChannel solves local communication between browser contexts, while backend synchronization solves data consistency across devices. Neither automatically guarantees that every client has the latest state; versioning, refetching, and conflict handling are still necessary.
