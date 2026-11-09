I read the [Lexical Editor State documentation](https://lexical.dev/docs/concepts/editor-state?utm_source=chatgpt.com). For your senior frontend system design interviews, you don't need to memorize every API. Focus on how Lexical manages document state, updates it, and synchronizes it with the DOM.

## 1. Important concepts to learn

Must know

1\. EditorState is the source of truth, not the DOM

- The DOM is primarily the editing/rendering surface.
- Lexical maintains a structured node tree independently of the DOM.
- This makes editing behavior more predictable.

Why important? This answers why Lexical needs an EditorState even though it uses `contentEditable`.

Must know

2\. EditorState contains two things

- Node tree: Paragraphs, text, headings and custom nodes.
- Selection: Cursor position or selected text, which can also be `null`.

Unlike HTML's deeply nested formatting elements, Lexical represents formatting as properties on text nodes.

For example, consider the text Hello World:

Simplified Lexical node tree

Formatting is stored as node properties, rather than requiring nested HTML tags.

Must know

3\. EditorState is immutable after an update

- Lexical creates a pending state while processing changes.
- That state can be modified during an update.
- Once committed, the state becomes an immutable snapshot.

Why important? Immutable snapshots support predictable reads and provide a foundation for features such as history and undo/redo.

Must know

4\. Reading and updating EditorState

- `editor.update()` — Modifies the editor's state.
- `editorState.read()` — Reads an immutable snapshot.
- `$getRoot()` — Accesses the root node.
- `$getSelection()` — Accesses the current selection.

The `$` functions must execute inside an appropriate synchronous read/update context.

```
editor.update(() => {
  const root = $getRoot();
  const paragraph = $createParagraphNode();

  paragraph.append($createTextNode("Hello"));
  root.append(paragraph);
});
```

Must know

5\. Batched updates and DOM reconciliation

- Lexical works on a pending EditorState.
- Multiple updates can be batched together.
- Node transforms run before the state is committed.
- Lexical then reconciles the changes with the DOM.
- Update listeners run after reconciliation.

Why important? It explains how Lexical avoids manually rebuilding the entire DOM after every keystroke.

Understand

6\. Commands, Transforms and Listeners

- Commands: Trigger editor actions, such as applying bold.
- Transforms: Automatically modify or normalize nodes when necessary.
- Listeners: React to completed editor updates or mutations.

You only need to understand when each executes. Their detailed implementations are covered in separate documentation.

Understand

7\. Serialization and persistence

- `editor.getEditorState()` obtains the latest committed snapshot.
- `toJSON()` serializes the document tree, not selection.
- `editor.parseEditorState()` parses saved content.
- `editor.setEditorState()` replaces the current state.

Why important? This is how you save and restore rich-text documents.

Skim

8\. Discrete updates and cloning

- `{ discrete: true }` forces an immediate state commit.
- `editorState.clone()` creates a snapshot, optionally with a different selection.

Useful for advanced scenarios, but lower priority for your interviews.

## 2. Understand the EditorState lifecycle

This is the most valuable architectural concept from the article.

User performs an action

Example: Types text or applies bold

editor.update()

Work with a mutable pending state

Node transforms

Normalize or transform changed nodes

Commit + DOM reconciliation

Apply changes to the editing surface

Immutable EditorState snapshot

Update listeners can observe the committed state

[image](https://www.google.com/s2/favicons?domain=https://lexical.dev&sz=32)

Lexical

## 3. Final takeaway for your interview

Remember these four statements:

1. Separation of concerns: Lexical separates document state from the DOM, so browser-generated HTML is not the source of truth.
2. Structured representation: The EditorState stores a node tree and selection, with formatting represented through node properties.
3. Predictable updates: Changes happen inside controlled update transactions, and committed EditorStates are immutable.
4. Efficient rendering: Lexical batches updates and reconciles the document state with the DOM rather than requiring application code to manipulate HTML directly.

A senior frontend interview follow-up might be:

"Why does Lexical use immutable EditorState instead of directly manipulating the DOM?"

Your answer:

> Because DOM-based editing can produce inconsistent document structures and makes complex editing operations difficult to reason about. Lexical maintains its own structured document model, processes changes through controlled updates, and produces immutable snapshots. This separates editing logic from rendering, helps maintain consistency, and enables features such as custom nodes, undo/redo and document persistence.

What to read next: [Lexical — Updates](https://lexical.dev/docs/concepts/updates?utm_source=chatgpt.com) and [Lexical — Nodes](https://lexical.dev/docs/concepts/nodes?utm_source=chatgpt.com). These will deepen your understanding of the two most important topics introduced here: how state changes are processed and how the document is represented.
