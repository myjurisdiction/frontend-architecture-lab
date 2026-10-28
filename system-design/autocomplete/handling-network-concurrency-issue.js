/**
 * This technique is commonly called a generation counter, request versioning, or latest-request-wins strategy.
 * 
 * Final summary — Notes for frontend system design
- Problem: Concurrent asynchronous requests may complete out of order, causing stale results to overwrite newer data.
- cache Map: Stores API results by query string.
- generations Map: Tracks the latest request number for each query.
- Generation counter: Incremented whenever a new request starts for the same query.
- Request-local ID: Every request remembers the generation assigned when it started.
- Stale-response check: generations.get(query) !== id discards an outdated response before it updates the cache.
- Current-query check: currentQuery === query ensures only results matching the current search input are displayed.
- Different queries: Can update their own cache entries independently without replacing the active UI.
- AbortController: Attempts to cancel obsolete requests and save resources; generation checking adds a correctness guard.
- React Query: Provides query-key isolation, request deduplication, and cancellation support, reducing the need for manual coordination in many cases.
Interview takeaway: I use AbortController to cancel obsolete work and request generation counters to prevent late responses from overwriting newer results. The generation check protects cached data for each query, while the current-input check protects what the user actually sees.
 */

let currentQuery = ""; // shared query

const cache = new Map();
const generations = new Map();

async function search(query) {
  const id = (generations.get(query) ?? 0) + 1;
  generations.set(query, id);

  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);

  const results = await response.json();

  // Only the newest request for this query
  // is allowed to update the cache.
  // Prevents ->  An older request overwriting newer cached data for the same query
  if (generations.get(query) !== id) {
    return;
  }

  cache.set(query, results);

  // Only display results for the current input.
  // Prevents ->  A response for a different query overwriting the current search UI
  if (currentQuery === query) {
    displayResults(results);
  }
}
