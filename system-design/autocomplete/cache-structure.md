## Cache Structures in Autocomplete — Summary

There are three main approaches to designing an autocomplete cache, each with different tradeoffs in lookup performance, memory usage, and implementation complexity.

### 1. Hash Map (Query → Results)

Store each search query as a key and its API response as the value.

```
const cache = {
  fa: ["Facebook", "FasTrak", "face"],
  fac: ["Facebook", "face", "facebook messenger"],
};
```

- Lookup: O(1) average time.
- Advantage: Simple implementation, fast lookup, and preserves server ranking.
- Disadvantage: Duplicate results across queries increase memory consumption.
- Best for: Small-to-medium caches where simplicity is preferred.

### 2. Flat List of Results

Store all unique suggestions in a single array and filter them based on the search query.

```
const results = [
  "Facebook",
  "FasTrak",
  "face",
  "facebook messenger",
];

const suggestions = results.filter(item =>
  item.toLowerCase().startsWith("fac")
);
```

- Lookup: O(N × M) worst case, where N is the number of results and M is the query length.
- Advantage: Reduces duplicate storage.
- Disadvantages:
  - Requires client-side filtering for every search.
  - Can affect UI performance for large datasets.
  - May lose server-defined ranking and query-specific relevance.
  - Cannot return suggestions that were never cached.
- Best for: Small, complete, relatively static datasets.

### 3. Normalized Map of Results

This combines the advantages of both approaches by separating query-to-result mappings from actual result data.

```
const cache = {
  queries: {
    fa: ["1", "2", "3"],
    fac: ["1", "3", "4"],
  },

  entities: {
    "1": { id: "1", text: "Facebook" },
    "2": { id: "2", text: "FasTrak" },
    "3": { id: "3", text: "face" },
    "4": { id: "4", text: "facebook messenger" },
  },
};
```

Notice how `"Facebook"` is stored only once, even though it appears in multiple search queries.

When searching for `fac`:

```
const suggestions = cache.queries.fac.map(
  id => cache.entities[id]
);
```

- Lookup: O(1) average to find the query, plus O(K) to retrieve K suggestions.
- Advantage: Reduces duplicate storage, provides fast query lookup, and preserves server ranking through ordered IDs.
- Disadvantage: More complex implementation, requiring stable IDs and potentially cache eviction/reference management.
- Best for: Larger caches where many queries share the same suggestion entities.

## Comparison

| Criteria                 | Hash Map              | Flat List         | Normalized Map              |
| ------------------------ | --------------------- | ----------------- | --------------------------- |
| Query lookup             | O(1) avg.             | O(N × M)          | O(1) + O(K) avg.            |
| Memory efficiency        | Lower with duplicates | Higher            | Higher with shared entities |
| Preserves server ranking | Yes                   | Not automatically | Yes                         |
| Client-side filtering    | No                    | Yes               | No                          |
| Implementation           | Simple                | Simple            | Moderate                    |

## Interview takeaway

The normalized map is a strong option when autocomplete results overlap heavily across queries. It combines fast query lookup with reduced duplication while preserving the backend's ranking.

However, for most autocomplete implementations, I would start with a simple query-keyed Map, adding an LRU eviction policy and a maximum cache size to control memory usage. Introduce normalization only when duplicate-result storage becomes a meaningful problem.

Also, don't confuse these two concepts:

- Query normalization: Converts `" React "` into `"react"` to create consistent cache keys.
- Cache data normalization: Stores each result entity once and references it by ID from multiple query entries.

Both improve caching, but they solve different problems.

```
The query-to-results hash map is the simplest default and is fine for short-lived surfaces like a Google results page that resets on navigation. Reach for a normalized store keyed by entity ID only for long-lived single-page apps where repeated queries would otherwise duplicate the same entities across many cache entries and pressure memory.
```

### Caching strategy

Caching is a space/time tradeoff where we trade memory space to save on processing time. Having cached results stay around for too long is a bad idea because it consumes memory, and if too much time has passed since the cache entry was written, the results are likely irrelevant/outdated. There's little value in using memory to store irrelevant/outdated results.

When to evict the cache depends on the type of application:

General search: A longer cache duration can be reasonable when results change slowly.
Personalized search: Use a shorter duration when results change frequently or depend on the signed-in user.
Stock/currency exchanges: Exchanges with an autocomplete for stock ticker symbols/currency that show the current price in the results might not want to cache at all because the prices change every minute when the markets are open.
We can add the data source/caching strategy and cache duration as configuration options on the component.

Data source: Whether to read the results from the "network only", "network and cache", "cache only".

Cache duration/Time-to-live: How long to retain each cache entry. This will involve adding timestamps to each entry and evicting stale cache entries every now and then.

Within one component and data-source context, normalize equivalent query strings before using them as keys, expire entries with a TTL, and enforce a small maximum size by evicting the least recently used queries.
