const a = {
  name: "abhishek",
  age: 29,
};
a.chain = a;

const f = () => {};
const map = new Map([
  ["a", "b"],
  ["c", "d"],
]);

const set = new Set(["a", "b"]);

const f_obj = {
  a: f,
  b: "Hello world",
};

const date = new Date();

// let's build the evolved JSON stringify method

/**
 * One possible follow-up is to make it faster. The current implementation involves frequent runtime type checks due to JavaScript's dynamic typing. One way to make this implementation of JSON.stringify faster is to have the user provide a schema of the object (e.g. using JSON Schema) so the object structure is known before serialization. This can avoid a lot of runtime guesswork. In fact, many JSON.stringify-alternative libraries are implemented this way to make serialization faster.
 */

/**
 * @param {unknown} value
 * @return {string | undefined}
 */
export default function jsonStringify(value) {
  const wsCache = new WeakSet();
  return serializeValue(value, wsCache);
}

function serializeValue(value, wsCache) {
  if (value === null) {
    return "null";
  }

  const type = typeof value;

  if (type === "bigint") {
    throw new TypeError("Do not know how to serialize a BigInt");
  }

  if (type === "function" || value === undefined || type === "symbol") {
    return undefined;
  }

  if (type === "boolean") {
    return String(value);
  }

  if (type === "string") {
    return `"${value}"`;
  }

  if (type === "number") {
    if (Number.isNaN(value) || !Number.isFinite(value)) {
      return "null";
    }

    return String(value);
  }

  // console.log(date.toJSON()); -> stringified date
  // console.log(JSON.stringify(date)); -> same stringified date
  if (type === "object" && typeof value.toJSON === "function") {
    return serializeValue(value.toJSON(), wsCache);
  }

  /**
   * - Primitives vs. Wrapper Objects:
  - `42`, `"hello"`, `true` are primitive values.
  - `new Number(42)`, `new String("hello")`, `new Boolean(true)` are objects (`typeof` returns `"object"`).
- Problem: If a custom serializer treats wrapper objects as regular objects, it may produce incorrect results, such as `{}` instead of `42`.
- Solution: Use `instanceof` to detect wrapper objects and `.valueOf()` to extract their primitive values.
   */
  if (
    value instanceof Number ||
    value instanceof String ||
    value instanceof Boolean
  ) {
    return serializeValue(value.valueOf(), wsCache);
  }

  if (wsCache.has(value)) {
    throw new TypeError("Converting circular structure to JSON");
  }

  wsCache.add(value);

  if (Array.isArray(value)) {
    const arrayValues = value.map(
      (item) => serializeValue(item, wsCache) ?? "null",
    );
    return `[${arrayValues.join(",")}]`;
  }

  // Objects omit keys whose value serializes to undefined
  const objectValues = Object.entries(value)
    .map(([key, entryValue]) => {
      const serilizedValue = serializeValue(entryValue, wsCache);

      if (serilizedValue === undefined) {
        return undefined;
      }

      return `"${key}":${serilizedValue}`;
    })
    .filter((item) => item !== undefined);

  return `{${objectValues.join(",")}}`;
}

try {
  // console.log(JSON.stringify(a));
  console.log(JSON.stringify(Symbol("foo"))); // undefined
  console.log(JSON.stringify(f)); // undefined
  console.log(JSON.stringify(undefined)); // undefined
  console.log(JSON.stringify(map)); // {}
  console.log(JSON.stringify(set)); // {}
  console.log(JSON.stringify(NaN)); // null
  console.log(JSON.stringify(Infinity)); // null
  console.log(JSON.stringify(f_obj));

  // Handling date object
  console.log(date.toJSON());
  console.log(JSON.stringify(date));

  // testing my serialized method
  // console.log(jsonStringify({ foo: "bar" }));
  console.log(jsonStringify({ foo: "bar", bar: [1, 2, 3] }));
} catch (e) {
  console.error(e);
}
