# ContentEditable — The Good, the Bad and the Ugly

The article by CKEditor explains why `contentEditable` is useful for basic text editing but becomes difficult to manage when building a full-fledged rich text editor like Google Docs, CKEditor or Lexical.

## 1. The Good — Advantages of `contentEditable`

- Built into browsers: Add `contentEditable="true"` to an HTML element, and users can immediately start editing its content.
- Native text editing: Browsers already support typing, deleting, selecting text, moving the cursor and basic formatting.
- Keyboard support: Arrow keys, Home, End, Backspace, Delete and common keyboard shortcuts work without implementing everything manually.
- Clipboard support: Users can copy, cut and paste text using native browser functionality.
- IME support: Users can enter complex languages like Chinese, Japanese and Hindi through native composition.
- Selection and caret: Browsers handle text highlighting and the blinking cursor.
- Accessibility: Native browser editing provides important foundations for assistive technologies, although a complete editor still needs accessibility work.

Takeaway: `contentEditable` saves developers from rebuilding basic text input and editing behavior.

## 2. The Bad — Limitations of `contentEditable`

- Inconsistent HTML: Different browsers may generate different HTML for the same editing operation.
- Limited control over formatting: Pressing Enter, Backspace or applying bold can modify the DOM in ways your application doesn't expect.
- Messy copy-paste: Pasting from Word or websites can introduce unwanted HTML, CSS and formatting.
- Selection issues: When JavaScript modifies the DOM, the cursor or selected text can unexpectedly move or disappear.
- Undo/redo limitations: Native browser history doesn't necessarily integrate with custom editor operations.
- No structured document model: `contentEditable` works directly with the DOM. It doesn't provide an independent, predictable representation of paragraphs, headings, tables or custom nodes.
- Difficult custom behavior: Implementing mentions, tables, embedded components and custom formatting requires substantial additional logic.

Takeaway: `contentEditable` provides editing capabilities but doesn't provide the architecture needed to manage complex documents reliably.

## 3. The Ugly — Why building everything yourself is worse

The author explains what happens when developers try to avoid `contentEditable` completely.

- Internationalization becomes difficult: Different languages have different typing rules. IME, accented characters and composition must work correctly.
- Keyboard navigation becomes complex: Ctrl+Arrow should move between words, but not every language separates words using spaces.
- Mobile keyboards: Opening the virtual keyboard and maintaining focus can become difficult.
- Spell checking: You lose native browser spell checking unless you recreate or integrate it.
- Accessibility: Screen readers may not understand your custom editing surface.
- OS integration: Native shortcuts, text selection and platform-specific editing features require additional implementation.

Takeaway: Reimplementing a text editor from scratch means rebuilding years of browser and operating-system functionality.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://ckeditor.com&sz=32)

CKEditor

## 4. The Solution — The best of both worlds

The author's recommendation is to keep `contentEditable` for useful native capabilities, but implement complex editing logic in an editor framework.

- Let the browser handle text input, IME and native selection interactions.
- Implement custom commands for formatting, lists, tables and other advanced operations.
- Maintain a structured document model rather than relying exclusively on the DOM.
- Handle undo/redo, pasting and document transformations through the editor framework.
- Synchronize the document model with the DOM.

This is broadly the approach taken by modern editors such as Lexical, although their internal implementations differ.

## Interview summary

| `contentEditable` alone                 | `contentEditable` + Lexical            |
| --------------------------------------- | -------------------------------------- |
| Browser controls much editing behavior  | Framework controls document operations |
| DOM acts as the document representation | Structured EditorState                 |
| Browser-generated HTML                  | Custom node schema                     |
| Native undo/redo                        | Editor-managed history                 |
| Basic editing capabilities              | Extensible rich text features          |
| Difficult to ensure consistent behavior | More predictable editing behavior      |

One sentence to remember:

`contentEditable` is a useful editing surface, but it is not a complete rich text editing engine.

The article dates from 2015, so some specific browser bugs have since changed. Its central architectural lesson remains valuable for your Lexical interview preparation.
