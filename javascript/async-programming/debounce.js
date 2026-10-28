/**
 * @param {(...args: Array<unknown>) => unknown} func
 * @param {number} wait
 * @returns {(...args: Array<unknown>) => void}
 * 
 * Common pitfalls
Not canceling the previous timeout: Without clearTimeout(), every invocation eventually runs. Debounce needs the latest invocation to replace any earlier scheduled work.
Losing the latest arguments or receiver: The callback should run with the latest invocation's arguments and this value. Store them for the current scheduled attempt, and call the original function with apply() or call().
Returning an arrow function wrapper: The wrapper returned by debounce() should be a normal function. An arrow wrapper would not get a dynamic this, so calls like obj.debouncedMethod() would not preserve obj for the delayed callback.

 */

export default function debounce(func, wait) {
  let timerId = null;

  return function (...args) {
    const context = this; // saving tyhe right context to be passed to the callback function
    if (timerId) clearTimeout(timerId);
    timerId = setTimeout(() => {
      func.apply(context, args);
      timerId = null;
    }, wait);
  };
}
