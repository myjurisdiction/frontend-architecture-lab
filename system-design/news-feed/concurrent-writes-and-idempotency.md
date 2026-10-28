## Final summary — Frontend system design notes

- HTTP caching: Use `Cache-Control: private` for cacheable personalized responses; use `no-store` when storage is inappropriate.
- Account isolation: Scope TanStack Query keys and persistent client data by authenticated account; clear or quarantine sensitive caches and pending writes on logout or account switch.
- In-flight coalescing: Multiple identical concurrent GET requests share a single in-flight Promise and response.
- Coalescing vs caching: Coalescing reuses pending requests; caching reuses previously fetched results.
- AbortController: Cancels obsolete reads, such as earlier autocomplete requests. Cancellation doesn't guarantee a server-side write was undone.
- Concurrent mutations: Rapid reactions can produce responses out of order. Use per-post serialization, sequence numbers, or server-side version checks.
- Stale responses: Don't let older mutation responses overwrite the latest client state.
- Idempotency: Repeating the same logical write should not create duplicate side effects.
- Idempotency-Key: Generate once per logical submission and reuse the identical key across retries.
- Server responsibility: The backend must enforce idempotency atomically; a client-generated UUID alone provides no protection.
- Offline retry: Service workers or persistent outboxes should retain the original idempotency key and payload.
- React Query: Provides query caching, in-flight query deduplication, cancellation integration, and retry mechanisms, but doesn't automatically enforce mutation idempotency or ordering.

Interview-ready explanation:

> "In the data-access layer, I'd prevent duplicate reads using query deduplication and cancel obsolete requests using AbortController. For concurrent mutations, I'd protect against stale responses through per-entity sequencing or server-side versioning. For writes that may be retried, I'd attach an idempotency key generated once per user action and rely on the backend to enforce it. Finally, I'd isolate personalized caches and offline data by authenticated account to avoid cross-user data leakage."

You're correct on both points. In fact, these are exactly the kinds of issues a senior frontend engineer should identify during a system design interview.

There are two fundamental principles:

1. Client-side sequencing protects the UI from stale responses, but it cannot guarantee the order in which the server commits mutations.
2. An idempotency key must belong to a logical operation, not to an individual network attempt or button click.

Let's examine both using React, Axios, Node.js, and PostgreSQL.

# 1. Concurrent mutations: Like → Love

Suppose a user clicks Like and immediately changes their reaction to Love.

The frontend sends:

```
PUT /posts/P101/reaction
{ "reaction": "like" }
```

And immediately afterward:

```
PUT /posts/P101/reaction
{ "reaction": "love" }
```

You expect the final reaction to be `love`.

But HTTP requests can reach and complete on the backend in a different order.

## The problem

Requests sent in order

Request A: Like

First

Request B: Love

Second

Server processes them out of order

Love commits first

Like commits afterward

Final database state: Like

Even though Love was the user's latest action.

Now consider the earlier client-side generation approach:

```
if (sequence !== latestSequence) {
  return;
}
```

That prevents the old Like response from overwriting the Love state in the React Query cache.

But the database may still contain `like`.

So you're absolutely right: client-side response sequencing alone is insufficient.

## How can we solve this?

There are three common strategies, each with different guarantees.

### Approach A — Serialize mutations per entity on the client

This is often the simplest practical solution for a reaction control.

```
User clicks Like
    ↓
Send Like request
    ↓
User clicks Love while Like is in flight
    ↓
Queue latest desired value: Love
    ↓
Like request finishes
    ↓
Send Love request
    ↓
Server stores Love
```

You don't necessarily need to queue every intermediate action.

For example, if the user changes:

`Like → Haha → Love`

while the first request is still in flight, you can coalesce the intermediate changes and send only the latest desired state, `Love`, afterward.

The UI can optimistically show Love immediately.

Important nuance: Client-side serialization ensures ordered submission from that client, provided you wait for completion before advancing. It does not guarantee global ordering when the same user has multiple browser tabs, devices, or concurrent writers.

Also, a timed-out request is ambiguous: the server may still be processing it. Simply sending the next request after a timeout can reintroduce concurrency.

### Approach B — Server-side conditional updates using versions

This is a stronger concurrency-control mechanism.

Suppose the server stores:

```
{
  postId: "P101",
  userId: "U1",
  reaction: null,
  version: 7
}
```

The backend assigns and increments `version` on every successful update.

The client first reads version 7.

Then it sends:

```
PUT /posts/P101/reaction
If-Match: "7"

{ "reaction": "like" }
```

The server only updates the record if its current version is still 7.

Conceptually:

```
UPDATE user_reactions
SET reaction = 'like',
    version = version + 1
WHERE post_id = 'P101'
  AND user_id = 'U1'
  AND version = 7;
```

If exactly one row updates, the operation succeeds.

If zero rows update, the version did not match (or the record no longer exists), and the server returns a conflict/precondition error such as HTTP `412 Precondition Failed` for an `If-Match` contract.

This is called optimistic concurrency control (OCC).

But there's an important subtlety: OCC prevents lost updates; it doesn't automatically implement "the last click wins."

If both Like and Love are submitted using version 7, whichever commits first wins, and the other is rejected.

The client then needs to reconcile its latest desired value and retry against the new version.

### Approach C — Server-enforced monotonic action sequences

If your product specifically requires the latest user action to win, even when requests arrive out of order, you can use an ordering token that the server understands.

For example, a client session generates:

```
Like → sequence 41
Love → sequence 42
```

The server stores the highest accepted sequence for that client session and reaction target.

```
UPDATE user_reactions
SET reaction = :reaction,
    last_sequence = :sequence
WHERE post_id = :post_id
  AND user_id = :user_id
  AND client_session_id = :session_id
  AND last_sequence < :sequence;
```

If Love (42) commits first, Like (41) cannot overwrite it afterward.

Server-enforced sequence example

Love, sequence 42

Accepted

Like, sequence 41

Rejected as old

Final DB reaction: Love

The database must perform the comparison and update atomically.

This example is simplified. In a production system, you must define how client sessions are identified, how sequences behave after reconnects, and how concurrent updates from multiple devices are resolved. A session-local sequence cannot, by itself, establish ordering across different devices.

## Which approach should you mention in an interview?

| Approach                                 | What it guarantees               | Limitation                                          |
| ---------------------------------------- | -------------------------------- | --------------------------------------------------- |
| Client-side serialization                | Ordered writes from one client   | Multiple devices, timeouts                          |
| Client sequence check on responses       | Old responses don't overwrite UI | Does not protect DB                                 |
| Server optimistic concurrency (versions) | Detects conflicting writes       | Client must resolve conflicts                       |
| Server-enforced ordering tokens          | Rejects older ordered actions    | Requires a defined global/session ordering contract |

For a social-media reaction control, my preferred starting design would be:

Use a set-state API (`PUT` with the desired reaction), serialize or coalesce rapid changes per post on the client, and use server-side uniqueness and concurrency rules to maintain correctness.

If the interviewer requires strict behavior across multiple tabs/devices, I'd introduce optimistic concurrency with retries or a clearly defined server-side ordering policy.

One other backend requirement is essential: enforce uniqueness on `(user_id, post_id)` so one user can't accidentally create multiple active reaction records for the same post.

# 2. Idempotency: You're right about the UUID problem

You pointed out:

> If clicking Publish invokes the handler again, and that handler generates a new UUID, aren't we facing the same duplicate-post problem?

Exactly. The earlier code was incomplete because it didn't show how the original submission survives retries.

Let's fix it.

## Step 1 — Separate a new submission from a retry

Consider these two actions:

- New submission: User decides to publish a new post. Generate a new UUID.
- Retry: User wants to complete the same submission after a timeout. Reuse the existing UUID.

The client must remember which operation is pending.

### Correct React implementation

We can use `useRef` to preserve the in-progress operation across renders and button clicks.

```
type Submission = {
  idempotencyKey: string;
  body: PostBody;
  mediaIds: string[];
};

function PostComposer() {
  const [draft, setDraft] = useState<ComposerDraft>(initialDraft);
  const [status, setStatus] = useState<
    "idle" | "submitting" | "failed" | "submitted"
  >("idle");

  const pendingSubmission = useRef<Submission | null>(null);
  const inFlight = useRef(false);

  async function handlePublish() {
    // Prevent duplicate concurrent requests.
    if (inFlight.current || status === "submitted") return;

    // Reuse the old submission on retry.
    if (!pendingSubmission.current) {
      pendingSubmission.current = {
        idempotencyKey: crypto.randomUUID(),
        body: structuredClone(draft.body),
        mediaIds: [...draft.mediaIds],
      };
    }

    inFlight.current = true;
    setStatus("submitting");

    try {
      const submission = pendingSubmission.current;

      await axios.post(
        "/posts",
        {
          body: submission.body,
          mediaIds: submission.mediaIds,
        },
        {
          headers: {
            "Idempotency-Key": submission.idempotencyKey,
          },
        }
      );

      setStatus("submitted");
      pendingSubmission.current = null;

    } catch (error) {
      setStatus("failed");
      // Do NOT discard pendingSubmission.
    } finally {
      inFlight.current = false;
    }
  }

  return (
    <button
      onClick={handlePublish}
      disabled={status === "submitting" || status === "submitted"}
    >
      {status === "failed" ? "Retry Publish" : "Publish"}
    </button>
  );
}
```

Notice the critical portion:

```
if (!pendingSubmission.current) {
  pendingSubmission.current = {
    idempotencyKey: crypto.randomUUID(),
    body: structuredClone(draft.body),
    mediaIds: [...draft.mediaIds],
  };
}
```

On the first click, a new submission is created.

On the second click after a failure, the existing submission is reused.

The request payload also remains unchanged, which matters because idempotency systems should reject the same key with a different payload.

### Interactive example

Publishing simulation

idle

Idempotency key

Not created

Network attempts

0

Simulated server post

—

Publish post (simulate response loss)Reset simulationConceptual simulation using a fixed example key, without a real backend.

One limitation of `useRef`: it only survives React renders while the component remains mounted. For refresh-safe retries or offline submission, persist the submission record to an account-scoped outbox, such as IndexedDB.

Also, after an ambiguous failure, the draft should remain tied to its original payload. If the user edits the content and intentionally submits a different post, that must be treated as a new operation with a new key.

## Step 2 — How does the backend enforce idempotency?

Here's where it becomes interesting.

Imagine two identical requests reach two different Node.js server instances.

```
POST /posts (key K123) → Server A
POST /posts (key K123) → Server B
```

An in-memory JavaScript `Map` on each server cannot provide reliable deduplication, because those Maps are independent.

Instead, we can use PostgreSQL.

### Database schema

```
CREATE TABLE idempotency_records (
  user_id UUID NOT NULL,
  operation TEXT NOT NULL,
  key UUID NOT NULL,
  request_hash TEXT NOT NULL,
  response_status INTEGER,
  response_body JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (user_id, operation, key)
);
```

The primary key prevents two records with the same user, operation, and idempotency key.

`request_hash` represents a fingerprint of the relevant request payload, allowing the server to detect attempts to reuse a key with different content.

In a real system, you'd also define expiry and retention rules for these records.

### Backend transaction flow

The safest approach for database-only post creation is to coordinate the idempotency record and post creation within a single PostgreSQL transaction.

Request arrives: K123

Begin database transaction

Claim idempotency key atomically

Unique constraint prevents competing claims

First request

Create post and save response in same transaction

Repeated key

Read saved result, validate payload hash

Return the original logical result

Only one post is created

A simplified Node.js/PostgreSQL implementation looks like this:

```
async function createPost(req, res) {
  const userId = req.auth.userId;
  const key = req.header("Idempotency-Key");

  // Assume authentication, input validation and key validation.
  const payload = {
    body: req.body.body,
    mediaIds: req.body.mediaIds,
  };

  const hash = hashCanonicalPayload(payload);
  const db = await pool.connect();

  try {
    await db.query("BEGIN");

    // Only one transaction can successfully claim this key.
    const claim = await db.query(
      `INSERT INTO idempotency_records
        (user_id, operation, key, request_hash)
       VALUES ($1, 'create_post', $2, $3)
       ON CONFLICT DO NOTHING
       RETURNING key`,
      [userId, key, hash]
    );

    if (claim.rowCount === 0) {
      const existing = await db.query(
        `SELECT request_hash, response_status, response_body
         FROM idempotency_records
         WHERE user_id = $1
           AND operation = 'create_post'
           AND key = $2`,
        [userId, key]
      );

      const record = existing.rows[0];

      if (record.request_hash !== hash) {
        await db.query("ROLLBACK");
        return res.status(409).json({
          error: "Idempotency key reused with different payload",
        });
      }

      await db.query("COMMIT");
      return res
        .status(record.response_status)
        .json(record.response_body);
    }

    const created = await db.query(
      `INSERT INTO posts (author_id, body)
       VALUES ($1, $2)
       RETURNING id, author_id, body`,
      [userId, payload.body]
    );

    const post = created.rows[0];

    await db.query(
      `UPDATE idempotency_records
       SET response_status = 201,
           response_body = $3
       WHERE user_id = $1
         AND operation = 'create_post'
         AND key = $2`,
      [userId, key, JSON.stringify(post)]
    );

    await db.query("COMMIT");

    return res.status(201).json(post);

  } catch (error) {
    await db.query("ROLLBACK");
    throw error;
  } finally {
    db.release();
  }
}
```

This is a simplified illustration. It omits complete media handling, error middleware, response-timeout policies, and cleanup of expired idempotency records.

### Why does this work with concurrent requests?

Suppose Server A and Server B both try to claim the same key.

PostgreSQL's unique constraint makes conflicting inserts coordinate. The second transaction can wait for the first to commit or roll back.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.postgresql.org&sz=32)

PostgreSQL

+1

Two outcomes are possible:

Server A commits:

- Server A creates P101 and stores the result.
- Server B discovers that it did not claim the key.
- Server B reads the committed result and returns P101.

Server A rolls back:

- Server A's post creation and key claim are both undone.
- Server B can claim the key and perform the operation itself.

The crucial guarantee is that the idempotency claim and the database write share one atomic transaction.

If post creation also triggers external effects, such as emails or message publishing, those effects need additional coordination, commonly a transactional outbox. A database transaction alone cannot roll back an already sent email.

For more background, Stripe documents how repeated keys can return saved results and how differing request parameters are rejected.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://docs.stripe.com&sz=32)

Stripe API Reference

## 3. Idempotency vs concurrency control

These concepts are related but solve fundamentally different problems.

| Scenario                                   | Correctness mechanism                             |
| ------------------------------------------ | ------------------------------------------------- |
| Like request retried twice                 | Idempotency or naturally idempotent set-state API |
| Like followed by Love                      | Mutation ordering / concurrency control           |
| Create Post retried after timeout          | Idempotency key                                   |
| Two devices modify same reaction           | Server versioning or conflict policy              |
| Old API response arrives late              | Client sequence check                             |
| Two servers receive same post-creation key | Shared atomic uniqueness and transaction          |

Idempotency doesn't guarantee ordering, and ordering doesn't guarantee idempotency. A reliable system often needs both.

## Final summary — Interview notes

- Client-side sequence checking only prevents stale responses from overwriting newer UI state; it doesn't guarantee server mutation order.
- Client-side serialization queues or coalesces mutations per entity to preserve request order from one client.
- Server-side optimistic concurrency control uses record versions or conditional updates to detect conflicting writes.
- Server-side sequencing can reject outdated actions if the system has a well-defined, trusted ordering scheme.
- Like → Love: A good starting design is a set-state `PUT`, client-side serialization/coalescing, and a server-enforced unique reaction record per user and post.
- Idempotency key lifecycle: Generate a UUID once per logical submission, not on every network attempt.
- Manual retries: Reuse the same submission object, key, and payload after an ambiguous failure.
- React implementation: `useRef` can preserve a pending submission across renders; IndexedDB or a persistent outbox is needed when the submission must survive refreshes.
- Backend enforcement: Use a shared database unique constraint to prevent different server instances from processing the same key independently.
- Atomic transactions: Store the idempotency record, create the post, and save the response as one transaction.
- Duplicate requests: Return the existing result instead of creating a new resource; reject key reuse with a different payload.
- External side effects: Use additional mechanisms such as a transactional outbox when writes also trigger messages, notifications, or emails.

### How I'd phrase this in a senior frontend interview

> "For concurrent mutations, I distinguish between UI consistency and server consistency. Client-side generation counters only protect the UI from stale responses. To preserve write ordering, I can serialize mutations per entity, while the backend can use optimistic concurrency control or an explicit ordering contract.
>
> For idempotency, I'd create one submission object with a UUID and immutable payload, then reuse that object across all automatic and manual retries. The backend would enforce uniqueness using a database constraint and atomically persist the operation and its result. This ensures a network timeout or duplicate request doesn't accidentally create multiple posts."

That distinction between response ordering, server write ordering, and retry idempotency is the key concept to carry into system design interviews.
