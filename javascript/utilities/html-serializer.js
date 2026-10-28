/**
 * @typedef {object} HTMLElementNode
 * @property {string} tag
 * @property {HTMLNode[]} children
 */

/** @typedef {string | HTMLElementNode} HTMLNode */

/**
 * @param {HTMLElementNode} root
 * @return {string}
 */
export default function serializeHTML(root) {
  function traverse(node, depth = 0) {
    let indentation = `\t`.repeat(depth);

    // base case
    if (typeof node === "string") {
      return `${indentation}${node}`;
    }

    return [
      `${indentation}<${node.tag.toLowerCase()}>`,
      ...node.children.map((child) => traverse(child, depth + 1)),
      `${indentation}</${node.tag.toLowerCase()}>`,
    ].join("\n");
  }

  return traverse(root);
}

const tree = {
  tag: "body",
  children: [
    { tag: "div", children: [{ tag: "span", children: ["foo", "bar"] }] },
    { tag: "div", children: ["baz"] },
  ],
};

console.log(serializeHTML(tree));
