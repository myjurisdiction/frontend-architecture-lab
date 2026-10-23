The main idea here is understanding how autocomplete can efficiently find suggestions using a Trie, and why a Trie is not always a replacement for an API response cache.

There are three important concepts:

1. How a Trie performs prefix-based searches.
2. When to use a Trie instead of filtering an array.
3. Why caching API responses for `fa` doesn't guarantee that we can generate correct suggestions for `fac`.

## 1. What is a Trie?

A Trie (Prefix Tree) is a tree-like data structure used to store strings in such a way that words with common prefixes share the same path.

Imagine our autocomplete application has these words:

```
const words = [
  "face",
  "facebook",
  "factory",
  "fantasy",
  "fan",
  "google"
];
```

A Trie organizes these words by their common prefixes.

Trie structure

Conceptual illustration; terminal words such as "face" and "facebook" are shown as labels instead of expanding every character.

Suppose a user types `fac`.

The search algorithm:

- Starts at the root.
- Follows `f`, then `a`, then `c`.
- Once it reaches the `c` node, it explores the words below that node.
- It finds `face`, `facebook`, and `factory`.

The advantage: You don't have to scan every word in the collection to locate the prefix.

Finding the prefix node takes \\(O(m)\\), where \\(m\\) is the length of the search query. Collecting matching words takes additional time.

## 2. Why not simply filter an array?

You could implement autocomplete like this:

```
const words = ["face", "facebook", "factory", "fan"];

function search(query) {
  return words.filter(word =>
    word.startsWith(query)
  );
}
```

This works perfectly for small datasets.

But consider a collection of 1 million words.

Every time the user types another character, we potentially examine all 1 million words.

| Approach        | Prefix search cost               | Best suited for                     |
| --------------- | -------------------------------- | ----------------------------------- |
| Array filtering | \\(O(N \cdot m)\\) worst case    | Small datasets                      |
| Trie            | \\(O(m)\\) to locate prefix node | Large, local prefix-search datasets |

Here, \\(N\\) is the number of words and \\(m\\) is the query length. Both approaches have additional costs to collect matching suggestions; ranking them can also require extra work.

The tradeoff is that a Trie takes additional memory and time to construct.

## 3. The important part: Why can't we always filter cached API results?

This is the most interesting part of your paragraph from a frontend system design perspective.

Suppose your autocomplete component calls a backend API.

```
GET /api/suggestions?q=fa&limit=3
```

The server has thousands of matching suggestions, but returns only the top three ranked results.

Search query: "fa"

Backend response — top 3 results

1\. Facebook

2\. Fashion

3\. Family

Cache entry: `"fa"`

`["Facebook", "Fashion", "Family"]`

Now the user types `fac`.

You might think:

"Why send another API request? I already have results for `fa`. I'll just filter those results."

```
const cached = cache.get("fa");

const suggestions = cached.filter(item =>
  item.toLowerCase().startsWith("fac")
);
```

This returns only:

```
["Facebook"]
```

But that's potentially incorrect.

The server may have these actual top results for `fac`:

```
[
  "Factory",
  "Facebook",
  "FaceTime"
]
```

Why didn't we find `Factory` or `FaceTime`?

Because the response for `fa` only contained the top three suggestions for `fa`, not every possible matching word.

The cache does not contain the complete dataset.

This is the crucial distinction:

A cached response for a shorter prefix is not necessarily sufficient to answer a longer-prefix query.

Even if you construct a Trie from the cached results, it cannot find words that were never included in the cache.

## 4. So when should we use a Trie on the frontend?

Consider two scenarios.

Scenario A: Country selection dropdown

Your frontend already has a complete list of around 200 countries.

You can create a Trie locally and provide suggestions without calling the server.

This works because your Trie indexes the entire relevant dataset.

Scenario B: Google-like search autocomplete

Your backend indexes millions of search terms, ranks them, and returns the top 10 suggestions.

The frontend should generally cache results using the full normalized query, such as `fa` or `fac`, rather than building a Trie from partial API responses.

For a small local dataset, even a simple `Array.filter()` may be enough. You don't need to introduce a Trie unless it provides a meaningful performance advantage.

## 5. Summary for your frontend system design notes

Prefix Lookup Using Trie

- A Trie is a tree-based data structure that stores strings by sharing common prefixes.
- Searching for a prefix of length \\(m\\) takes \\(O(m)\\) to locate the prefix node, excluding result collection and ranking.
- A client-side Trie is useful when the frontend has a complete or sufficiently comprehensive and relatively stable collection.
- A query cache is different from a Trie: it stores responses for previously requested queries.
- Cached API results may be incomplete because the backend often returns only the top K ranked suggestions.
- Therefore, filtering cached results for `fa` to answer `fac` can miss valid suggestions.
- Building a Trie from incomplete cached API responses does not solve that problem.

Interview takeaway: For large-scale autocomplete, let the backend handle prefix searching and ranking, and let the frontend handle debouncing, full-query caching, race conditions, and rendering. Use a client-side Trie when the local dataset is sufficient to answer the query correctly.

One additional point: real autocomplete systems may use more sophisticated search indexes than a basic Trie, particularly when supporting typo tolerance, fuzzy matches, personalization, and relevance ranking.
