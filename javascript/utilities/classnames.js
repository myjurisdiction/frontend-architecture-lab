/**
 * @param {...(any|Object|Array<any|Object|Array>)} args
 * @return {string}
 */
export default function classNames(...args) {
  const len = args.length;

  // if not valid argument then just return empty tring
  if (!len) {
    return "";
  }

  const classes = [];

  for (let token of args) {
    if (!token) {
      continue;
    }

    const tokenType = typeof token;

    if (Array.isArray(token)) {
      classes.push(classNames(...token));
    } else if (tokenType === "object" && token !== null) {
      Object.entries(token).forEach(([entryKey, entryValue]) => {
        const serializedEntryValue = classNames(
          Array.isArray(entryValue) ? [...entryValue] : entryValue,
        );

        if (!serializedEntryValue) {
          return;
        }

        classes.push(entryKey);
      });
    } else {
      classes.push(token);
    }
  }

  return classes.join(" ");
}

console.log(classNames("foo", "bar")); // 'foo bar'
console.log(classNames("foo", { bar: true })); // 'foo bar'
console.log(classNames({ "foo-bar": true })); // 'foo-bar'
console.log(classNames({ "foo-bar": false })); // ''
console.log(classNames({ foo: true }, { bar: true })); // 'foo bar'
console.log(classNames({ foo: true, bar: true })); // 'foo bar'
// 'foo qux'
