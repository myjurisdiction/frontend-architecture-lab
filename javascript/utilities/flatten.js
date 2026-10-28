/**
 * @param {Array<*|Array>} value
 * @return {Array}
 */
export default function flatten(value) {
  const resultArray = [];

  function recursiveFlatten(value) {
    for (let item of value) {
      if (Array.isArray(item)) {
        recursiveFlatten(item);
      } else {
        resultArray.push(item);
      }
    }
  }

  recursiveFlatten(value);

  return resultArray;
}

// Single-level arrays are unaffected.
console.log(flatten([1, 2, 3])); // [1, 2, 3]

// Inner arrays are flattened into a single level.
console.log(flatten([1, [2, 3]])); // [1, 2, 3]
console.log(
  flatten([
    [1, 2],
    [3, 4],
  ]),
); // [1, 2, 3, 4]

// Flattens recursively.
console.log(flatten([1, [2, [3, [4, [5]]]]])); // [1, 2, 3, 4, 5]
