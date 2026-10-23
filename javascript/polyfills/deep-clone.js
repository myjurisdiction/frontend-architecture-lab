/**
 * @template T
 * @param {T} value
 * @return {T}
 */

/**
 *
 * Implement deepClone(value) so it returns a deep copy of a JSON-serializable value. The input may be null, booleans, numbers, strings, arrays, or plain objects. Handle circular dependecy as well
 */
export default function deepClone(value) {
  const wmCache = new WeakMap();
  return doDeepClone(value, wmCache);
}

function doDeepClone(value, wmCache) {
  const type = typeof value;

  if (type === "object" && value === null) {
    return null;
  }

  if (type === "number" || type === "string" || type === "boolean") {
    return value;
  }

  if (wmCache.has(value)) {
    return wmCache.get(value);
  }

  const clone = Array.isArray(value) ? [] : {};
  wmCache.set(value, clone);

  if (Array.isArray(value)) {
    for (const item of value) {
      clone.push(doDeepClone(item, wmCache));
    }
  } else {
    for (const [key, entryValue] of Object.entries(value)) {
      clone[key] = doDeepClone(entryValue, wmCache);
    }
  }

  return clone;
}

// what deep clone mean is that the cloned value does not contain any shared references to nested objects or arrays to the original

// In production we generaly use `structuredClone` for this

const a = {
  b: "c",
  d: {
    e: "f",
  },
  g: {
    h: {
      i: {
        j: {
          k: "I am the best !!",
        },
      },
    },
  },
};

a.x = a; // adding circular dependency

const _a = deepClone(a); // -> does deep copy
// const _a = { ...a }; // -> does shallow copy (1 surface level)

_a.d.e = "I have been mutated";
_a.g.h.i.j.k = "I am the second best !!";

console.dir(a, { depth: 5 });
console.dir(_a, { depth: 5 });
