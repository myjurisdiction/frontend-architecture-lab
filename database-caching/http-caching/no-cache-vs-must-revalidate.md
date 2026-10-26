The key difference is:

- `no-cache`: The browser can store the response, but must validate it with the server before every reuse.
- `must-revalidate`: The browser can reuse the response while it's fresh, but once it becomes stale, it must validate it before reuse.

## Practical example: Product API in Parspec

Suppose you're fetching product information from an API.

### 1. `no-cache`

```
Cache-Control: no-cache
ETag: "product-v1"
```

- Browser stores the API response.
- When the same resource is requested again, the browser must contact the server to validate it.
- Browser sends `If-None-Match: "product-v1"`.
- If unchanged, server returns `304 Not Modified`, allowing the cached response to be reused.
- Otherwise, server returns `200 OK` with updated data.

Use case: Data that should always be validated before reuse.

### 2. `must-revalidate`

```
Cache-Control: max-age=300, must-revalidate
ETag: "product-v1"
```

- Browser caches the response for 5 minutes.
- During those 5 minutes, it can reuse the cached response without contacting the server.
- After 5 minutes, the response becomes stale.
- The browser must revalidate before using it again, even if the server is unreachable.
- A `304 Not Modified` allows reuse; a `200 OK` supplies new data.

Use case: Product information that can remain unchanged for 5 minutes but must not be served stale afterward.

## Quick comparison

| Directive                      | Can store?             | Revalidate when?                                  |
| ------------------------------ | ---------------------- | ------------------------------------------------- |
| `no-cache`                     | Yes                    | Before every reuse                                |
| `max-age=300`                  | Yes                    | Normally after 5 minutes                          |
| `max-age=300, must-revalidate` | Yes                    | When stale; cannot serve stale without validation |
| `no-store`                     | No                     | No stored response to reuse                       |
| `private`                      | Yes, in private caches | Depends on other directives                       |

### Interview takeaway

- `no-cache` = Store, but always validate before reuse.
- `must-revalidate` = Don't reuse stale data without server validation.
- `no-store` = Don't store the response in HTTP caches.

Important: `must-revalidate` alone doesn't specify a freshness duration. It's typically combined with `max-age` or `Expires`.
