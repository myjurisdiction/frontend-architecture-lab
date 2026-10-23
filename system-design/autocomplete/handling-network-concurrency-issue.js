const cache = new Map();
const generations = new Map();

async function search(query) {
  const id = (generations.get(query) ?? 0) + 1;
  generations.set(query, id);

  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);

  const results = await response.json();

  // Only the newest request for this query
  // is allowed to update the cache.
  if (generations.get(query) !== id) {
    return;
  }

  cache.set(query, results);

  // Only display results for the current input.
  if (currentQuery === query) {
    displayResults(results);
  }
}
