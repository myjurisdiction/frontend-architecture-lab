## Pagination Error Handling & Cursor Expiration — Summary

\- Cursor expiration: Pagination cursors may become invalid when backend feed snapshots expire, sessions change, or feed generations are replaced.

\- Transient network failures:

- Preserve previously fetched pages in the client cache.
- Retry only the failed page using the same cursor.
- Use bounded exponential backoff (e.g., 1s, 2s, 4s).
- Show an inline Retry button if automatic retries fail.

\- Expired cursor handling:

- Backend returns an explicit error such as `CURSOR_EXPIRED` (possibly HTTP 410).
- Do not retry the same expired cursor.
- If supported, resume pagination using a stable post anchor.
- Otherwise, fetch a new feed generation while preserving existing content until the new feed is ready.

\- Feed generation consistency:

- Different generations may have different post rankings.
- Avoid blindly merging pages from G1 and G2, as this can cause missing or duplicated posts.

\- Deduplication: Use unique `postId` values to eliminate duplicate posts during pagination merges and retries.

\- Scroll preservation: Keep previously rendered posts visible and maintain the user's scroll position during failures and recovery.

\- Concurrency handling: Prevent multiple simultaneous next-page requests using `isFetchingNextPage` or `isFetching`. Ignore obsolete responses after feed generation changes.

\- React Query (`useInfiniteQuery`):

- Maintains successfully fetched pages in the cache.
- Provides `fetchNextPage()`, `hasNextPage`, and pagination error states.
- Supports configurable retry behavior based on error type.

\- Error-specific retry policy:

| Error                      | Handling                              |
| -------------------------- | ------------------------------------- |
| Network failure / HTTP 5xx | Retry with exponential backoff        |
| HTTP 429                   | Respect `Retry-After`                 |
| `CURSOR_EXPIRED`           | Stop retrying; recover pagination     |
| HTTP 401                   | Reauthenticate or refresh credentials |
| HTTP 403                   | Surface authorization error           |

Interview takeaway: A reliable infinite-scrolling feed should preserve cached pages, retry transient failures, recover from expired cursors, deduplicate results, and maintain consistent feed ordering without disrupting the user's scrolling experience.
