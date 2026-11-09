For Senior Frontend / Full-Stack System Design, these are the core architectural concepts you should study. They're reusable across Data Tables, Rich Text Editors, Google Docs, News Feeds, and other complex applications.

## 1. State Management & Consistency

1. Optimistic UI Updates
2. Optimistic Concurrency Control (OCC)
3. Pessimistic Concurrency Control
4. Client State vs Server State vs Derived State
5. State Reconciliation
6. Conflict Detection & Resolution
7. Last-Write-Wins vs Version-Based Updates

## 2. Asynchronous Operations & Race Conditions

8. Race Conditions in Asynchronous Operations
9. Mutation Serialization Queues (Promise Queues)
10. Mutation Coalescing & Deduplication
11. Request Cancellation with `AbortController`
12. Stale Response Handling (Generation Counters)
13. Out-of-Order Responses & Request Ordering
14. Idempotency Keys & Safe Retries

## 3. Undo/Redo & History Management

15. Command Pattern
16. Undo/Redo Stack Design
17. Inverse Operations vs State Snapshots
18. Undo/Redo with Asynchronous Persistence
19. Bounded History & Memory Management
20. Event Sourcing vs Command History

## 4. Bulk Operations & Reliability

21. Batch Processing & Bulk APIs
22. Atomic Transactions vs Partial Success
23. Error Recovery & Rollback Strategies
24. Exponential Backoff & Retry Policies
25. Partial Failure Handling
26. Write-Ahead Logs / Pending Mutation Logs

## 5. Real-Time Collaboration

27. WebSockets vs Server-Sent Events (SSE)
28. Operational Transformation (OT)
29. Conflict-Free Replicated Data Types (CRDTs)
30. Real-Time State Synchronization
31. Offline-First Architecture & Reconnection
32. Presence & Cursor Synchronization

## 6. Performance Engineering

33. Virtualization & Windowing
34. Incremental Rendering
35. Main Thread Optimization & Web Workers
36. Debouncing, Throttling & Batching
37. Caching & Cache Invalidation
38. Referential Equality & Structural Sharing
39. Performance Profiling (React Profiler / Chrome DevTools)
40. Backpressure & Flow Control

## What I'd prioritize for your interviews

Not all 40 concepts deserve equal time.

| Priority | Concepts                                                  | Relevant systems                            |
| -------- | --------------------------------------------------------- | ------------------------------------------- |
| P0       | Optimistic updates, OCC, state reconciliation             | Data Table, Google Docs                     |
| P0       | Race conditions, mutation queues, coalescing, idempotency | Data Table, News Feed                       |
| P0       | Command Pattern, undo/redo, inverse operations            | Rich Text Editor, Google Docs               |
| P0       | Batch processing, transactions, partial failures          | Data Table, Spreadsheet                     |
| P1       | WebSockets, OT, CRDTs, real-time sync                     | Google Docs                                 |
| P1       | Offline-first, reconnection, conflict resolution          | Collaborative applications                  |
| P1       | Web Workers, backpressure, profiling                      | Performance-intensive frontend applications |

My recommendation: Start with the first four sections. They form the foundation of reliable asynchronous frontend applications. Then move into real-time collaboration, where those same ideas become more complex.

You already know virtualization, caching, and AG Grid change detection, so there's no need to revisit those immediately.
