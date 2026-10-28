/**
 * @template T, U
 * @param {(previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U} callbackFn
 * @param {U} [initialValue]
 * @return {U}
 */
Array.prototype.myReduce = function (callbackFn, initialValue) {
  const array = this;
  const len = array.length;

  let startIndex = 0;

  // if fallback (Thec second argument of reduce function) is not provided
  if (arguments.length < 2) {
    while (startIndex < len && !(startIndex in array)) {
      startIndex++;
    }

    if (startIndex === len) {
      throw Error("Invalid arguments !!");
    }

    initialValue = array[startIndex++];
  }

  let returnValue = initialValue;

  while (startIndex < len) {
    if (!(startIndex in array)) {
      // do nothing
    } else {
      returnValue = callbackFn(
        returnValue,
        array[startIndex],
        startIndex,
        array,
      );
    }

    startIndex++;
  }

  return returnValue;
};

console.log([1, 2, 3].myReduce((prev, curr) => prev + curr, 0)); // 6
console.log([1, 2, 3].myReduce((prev, curr) => prev + curr, 4)); // 10
console.log(
  [, , , , , 1, 2, , , , , , 3].myReduce((prev, curr) => prev + curr, 4),
);
