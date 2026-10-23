/**
 * @param {unknown} value
 * @returns {string}
 */
export default function jsonStringify(value) {
  if (Array.isArray(value)) {
    const arrayValues = value.map((item) => jsonStringify(item));
    return `[${arrayValues.join(",")}]`;
  }

  if (typeof value === "object" && value !== null) {
    // handling of object -> { "foo" : "baar"} -> '{"foo" : "baar"}'
    const objectValues = Object.entries(value).map(
      ([key, value]) => `"${key}":${jsonStringify(value)}`,
    );

    return `{${objectValues.join(",")}}`;
  }

  if (typeof value === "string") {
    return `"${value}"`;
  }

  return String(value);
}

console.log(
  jsonStringify({
    foo: "baar",
    name: "Abhishek Raj",
    address: {
      name: "Yelahanka",
    },
  }),
);

console.log(jsonStringify(["apple", 1, "orange"]));
console.log(jsonStringify({ name: "John", age: 30 }));
