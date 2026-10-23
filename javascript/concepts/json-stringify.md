### Why handle `Number`, `String`, and `Boolean` wrappers in custom `JSON.stringify()`?

- Primitives vs. Wrapper Objects:
  - `42`, `"hello"`, `true` are primitive values.
  - `new Number(42)`, `new String("hello")`, `new Boolean(true)` are objects (`typeof` returns `"object"`).
- Problem: If a custom serializer treats wrapper objects as regular objects, it may produce incorrect results, such as `{}` instead of `42`.
- Solution: Use `instanceof` to detect wrapper objects and `.valueOf()` to extract their primitive values.

```
const num = new Number(42);

typeof num;          // "object"
num.valueOf();       // 42
JSON.stringify(num); // "42"
```

\- Implementation:

```
if (
  value instanceof Number ||
  value instanceof String ||
  value instanceof Boolean
) {
  return stringifyValue(value.valueOf(), stack);
}
```

\- Difference between `toJSON()` and `valueOf()`:

- `toJSON()` allows objects to customize their JSON representation.
- `valueOf()` extracts the underlying primitive from wrapper objects.
- Process `toJSON()` before wrapper conversion to match native behavior.

Key takeaway: Wrapper objects must be converted into primitive values before serialization so that your custom `JSON.stringify()` behaves like the native implementation.
