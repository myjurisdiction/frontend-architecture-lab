## Typos in search

It is easy to make typographical errors, especially on mobile devices. A fuzzy search is a searching technique where results that match the search query closely instead of exactly are also considered. Fuzzy searches help you find relevant results even when the search terms are misspelled.

Fuzzy searches can be used if the filtering is done purely on the client side by computing the edit distance (e.g. Levenshtein distance) between the search query and the results and selecting the ones with the smallest edit distance. For searches done on the server side, we can send the query as-is and have the fuzzy matching be done on the server.
