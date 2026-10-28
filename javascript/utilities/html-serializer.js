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
    const indentation = "\t".repeat(depth);

    if (typeof node === "string") {
      return `${indentation}${node}`;
    }

    // Each element contributes an opening tag, its serialized children, and a closing tag.
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

console.log(serializeHTML(tree), { depth: 5 });
