I reviewed the [Lexical — Selection](https://lexical.dev/docs/concepts/selection?utm_source=chatgpt.com) documentation.

For your senior frontend interviews, focus on understanding how Lexical represents selections, how they interact with the EditorState, and how Lexical synchronizes them with the browser's DOM selection.

You can cover this article relatively quickly.

## 1. Important concepts to learn

| Concept                          | Priority   | What to understand                                      |
| -------------------------------- | ---------- | ------------------------------------------------------- |
| Selection as part of EditorState | Must know  | Why Lexical maintains selection alongside its node tree |
| `RangeSelection`                 | Must know  | Anchor, focus, offsets and text formatting              |
| `NodeSelection`                  | Must know  | Selecting entire custom nodes, images or embeds         |
| `TableSelection`                 | Understand | Selecting multiple cells in a table                     |
| Reading and updating selection   | Must know  | `$getSelection()`, `$setSelection()`                    |
| Selection and browser focus      | Important  | Why editor updates can unexpectedly steal focus         |
| Shadow DOM selection             | Skim       | Special handling when the editor is inside Shadow DOM   |

## 2. Key concepts explained

### A. Selection is part of EditorState

Lexical's EditorState contains two things:

- Node tree: The document's actual content and structure.
- Selection: The current cursor position or selected content.

This ensures that selection remains consistent with the document during updates.

For example, when a user deletes a paragraph, Lexical must also ensure the selection doesn't point to a node that no longer exists.

Interview takeaway: Lexical manages selection in its document model rather than relying exclusively on the browser's DOM Selection API.

### B. RangeSelection — Most important

`RangeSelection` is the standard text selection model.

It has three main properties:

- `anchor`: Where the selection starts.
- `focus`: Where the selection ends.
- `format`: Bitwise flags representing active text formatting.

Technically, anchor and focus represent the two endpoints of the selection, not necessarily its left and right boundaries.

Each endpoint has:

| Property | Purpose                                        |
| -------- | ---------------------------------------------- |
| `key`    | Identifies the Lexical node                    |
| `offset` | Position within that node                      |
| `type`   | Whether the point refers to text or an element |

Example: Selecting "World" in "Hello World"

This assumes the entire phrase is stored in one TextNode and the selection is made from left to right. A backward selection reverses anchor and focus.

If the user simply places their cursor somewhere without highlighting text, anchor and focus can refer to the same position. This is called a collapsed selection.

### C. NodeSelection — Important for your custom nodes

`NodeSelection` selects entire Lexical nodes rather than a range of characters.

For example, suppose your editor supports an image embedded between paragraphs.

This is the introduction paragraph.

Selected image node

This is the next paragraph.

Lexical can select the complete image node without treating it as ordinary text.

Why this matters: If an interviewer asks how you implemented custom nodes in Lexical, you should understand how users can select, delete or interact with those nodes.

`NodeSelection` also supports selecting multiple arbitrary nodes.

### D. TableSelection — Understand at a high level

`TableSelection` represents a grid-like selection of table cells.

It stores:

- `tableKey` — Identifies the table.
- `anchor` — One endpoint of the cell selection.
- `focus` — The other endpoint.

This is useful for spreadsheet-like operations such as copying or formatting multiple cells.

## 3. Reading and modifying selection

The two APIs worth remembering are `$getSelection()` and `$setSelection()`.

```
import {
  $getSelection,
  $isRangeSelection
} from 'lexical';

editor.update(() => {
  const selection = $getSelection();

  if ($isRangeSelection(selection)) {
    console.log(selection.getTextContent());
  }
});
```

You should know that:

- `$getSelection()` accesses the current selection.
- `$setSelection()` explicitly changes it.
- `SELECTION_CHANGE_COMMAND` lets plugins react to selection changes.
- Selection can be `null`, for example when the editor loses focus.
- Selection changes must happen within an editor update or command context.

## 4. Selection and focus — Important interview follow-up

The documentation highlights a subtle problem.

Updating Lexical's selection can cause the editor to steal browser focus.

Why?

1. Lexical maintains its own selection in EditorState.
2. During reconciliation, it synchronizes that selection with the browser's DOM selection.
3. Updating the DOM selection can cause the browser to focus the editor.

For example, imagine a formatting toolbar where clicking a control should not unexpectedly return focus to the editor.

Lexical provides `SKIP_DOM_SELECTION_TAG` to prevent an update from synchronizing the Lexical selection back to the DOM.

```
editor.update(() => {
  $addUpdateTag(SKIP_DOM_SELECTION_TAG);

  // Perform an update without
  // reconciling the DOM selection
});
```

You don't need to memorize this API, but understanding the focus problem is valuable when designing toolbars, floating menus and custom editor interactions.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://lexical.dev&sz=32)

Lexical

## 5. Final interview takeaway

The most important principle from this article is:

Lexical maintains selection as part of its EditorState and synchronizes it with the browser's native selection when appropriate.

Remember these four things:

1. `RangeSelection` handles text selections and cursor positions using anchor, focus and offsets.
2. `NodeSelection` handles selections of complete nodes such as images and custom embedded components.
3. `TableSelection` handles grid-like selections of cells.
4. Selection changes are managed through Lexical's update system, keeping selection consistent with the document.

### A senior-level question to prepare

Why doesn't Lexical simply use the browser's native Selection API?

A good answer:

> Browser selection refers to DOM nodes and offsets. But Lexical maintains a separate structured document model, and its DOM can change during reconciliation. Therefore, Lexical represents selections using its own node keys and offsets, keeping selection consistent with EditorState. It can then synchronize the logical selection with the browser's native selection.

What to read next: I recommend Nodes → Commands → Node Transforms.

Given your experience implementing custom nodes and plugins, these are more valuable to your upcoming interviews than spending additional time on the advanced selection APIs.
