Exponential backoff is a retry strategy where the waiting time between consecutive retry attempts increases exponentially, typically doubling after each failure.

The idea is simple: If a server request fails repeatedly, don't keep retrying immediately. Give the server more time to recover.

## 1. Example in Autocomplete

Suppose a user searches for `"facebook"`, but the autocomplete API fails because the server is temporarily unavailable.

Instead of retrying every second, we progressively increase the delay.

| Attempt         | Wait before request | Result  |
| --------------- | ------------------- | ------- |
| Initial request | 0 seconds           | Failed  |
| Retry 1         | 1 second            | Failed  |
| Retry 2         | 2 seconds           | Failed  |
| Retry 3         | 4 seconds           | Failed  |
| Retry 4         | 8 seconds           | Success |

How retry delays increase

0 sec5 sec10 sec15 sec20 secRetry 1Retry 2Retry 3Retry 4Retry 5

Each failed attempt doubles the delay before the next retry.

This prevents your application from continuously bombarding a server that's already struggling.

## 2. Formula

A common formula is:

\\[ \text{Delay} = \min(\text{baseDelay} \times 2^{n}, \text{maxDelay}) \\]

Where:

- `baseDelay` = Initial waiting time (e.g. 1000 ms).
- `n` = Retry number, starting from 0.
- `maxDelay` = Maximum allowed waiting time (e.g. 8000 ms).

The maximum delay is important because we don't want retries to increase indefinitely.

## 3. JavaScript implementation

```
const sleep = (ms) =>
  new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url, maxRetries = 3) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }

      const delay = Math.min(
        1000 * 2 ** attempt,
        8000
      );

      await sleep(delay);
    }
  }
}
```

In this simplified implementation, failed HTTP responses and network errors are retried up to three times.

In production, you should also:

- Use jitter: Add a small random variation to delays so thousands of clients don't retry simultaneously.
- Retry only appropriate failures: Usually network errors, HTTP `429`, and transient `5xx` errors. Don't blindly retry every `4xx` response.
- Respect `Retry-After`: Honor the server's recommended waiting period when provided.
- Support cancellation: In autocomplete, stop retries if the user changes the query. Otherwise, you might waste requests on outdated searches.

## 4. Exponential backoff vs. debouncing

These two concepts are important in autocomplete, but they solve different problems.

| Concept             | Purpose                                           | When used                |
| ------------------- | ------------------------------------------------- | ------------------------ |
| Debouncing          | Reduce unnecessary API calls while the user types | Before sending a request |
| Exponential backoff | Avoid overwhelming a struggling server            | After a request fails    |

## Summary for your frontend system design notes

Exponential Backoff Strategy

- A retry mechanism where the delay between consecutive retries increases exponentially (1s → 2s → 4s → 8s).
- Used to handle temporary network/server failures without overwhelming the backend.
- Typically implemented with a maximum retry count, maximum delay, and random jitter.
- Retry only transient errors, and cancel pending retries when the autocomplete query becomes irrelevant.
- Unlike debouncing, which controls request frequency while typing, exponential backoff controls retry frequency after failures.

Interview takeaway: For autocomplete, combine debouncing, cancellation, stale-response protection, and bounded exponential backoff to create a responsive and resilient search experience.
