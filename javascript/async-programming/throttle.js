/**
 * @param {(this: any, ...args: Array<unknown>) => unknown} func
 * @param {number} wait
 * @returns {(this: any, ...args: Array<unknown>) => unknown}
 */
export default function throttle(func, wait) {
  let isFuncCurrentlyProcessing = false;

  return function (...args) {
    if (isFuncCurrentlyProcessing) {
      return;
    }

    isFuncCurrentlyProcessing = true;

    setTimeout(() => {
      isFuncCurrentlyProcessing = false;
    }, wait);

    func.apply(this, args);
  };
}

let i = 0;
function increment() {
  i++;
}
const throttledIncrement = throttle(increment, 100);

// t = 0: Call throttledIncrement(). i is now 1.
console.log(throttledIncrement()); // i = 1

// t = 50: Call throttledIncrement() again.
//  i is still 1 because 100ms have not passed.
console.log(throttledIncrement()); // i = 1

// t = 101: Call throttledIncrement() again. i is now 2.
//  i is incremented because it has been more than 100ms
//  since the last throttledIncrement() call at t = 0.
console.log(throttledIncrement()); // i = 2
