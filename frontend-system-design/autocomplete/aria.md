## Accessibility in Autocomplete — Key Concepts

Autocomplete should follow the WAI-ARIA Combobox Pattern to support screen readers and keyboard-only users.

ARIA -> Accessible Rich Internet Applications

### 1. ARIA Roles and Attributes

| Attribute                  | Purpose                                                                           |
| -------------------------- | --------------------------------------------------------------------------------- |
| `role="combobox"`          | Identifies the input as an autocomplete component.                                |
| `aria-autocomplete="list"` | Indicates that suggestions appear in a list.                                      |
| `aria-expanded`            | Indicates whether the suggestions popup is open.                                  |
| `aria-controls`            | Links the input to the suggestions list.                                          |
| `aria-activedescendant`    | Identifies the currently highlighted suggestion while focus remains on the input. |
| `role="listbox"`           | Identifies the suggestions container.                                             |
| `role="option"`            | Identifies each suggestion.                                                       |
| `aria-selected`            | Indicates the active or selected option, according to the interaction pattern.    |
| `aria-live`                | Announces loading, result counts, empty states, and errors to screen readers.     |

Important: Keep DOM focus on the input while users navigate suggestions. Use `aria-activedescendant` to communicate which suggestion is active.

### 2. Keyboard Interactions

| Key             | Behavior                                                            |
| --------------- | ------------------------------------------------------------------- |
| Arrow Down / Up | Navigate suggestions.                                               |
| Enter           | Select the active suggestion, or submit the form if none is active. |
| Escape          | Close the suggestions popup.                                        |
| Tab             | Follow normal focus navigation; typically close the popup.          |

Also support IME composition (used for languages such as Japanese and Chinese). Avoid processing Enter or navigation keys during active text composition.

### 3. Popup Lifecycle and Focus Management

The autocomplete popup generally follows this lifecycle:

`Closed → Open → Loading → Results / Empty / Error → Closed`

- Open on focus or typing, depending on the design.
- Close on selection, Escape, or when interaction leaves the component.
- Avoid closing immediately on input `blur`, because clicking a suggestion may blur the input before the selection event is processed.

### 4. Example Structure

```
<input
  role="combobox"
  aria-label="Search"
  aria-autocomplete="list"
  aria-expanded={isOpen}
  aria-controls="suggestions"
  aria-activedescendant={activeId || undefined}
/>

<ul id="suggestions" role="listbox">
  {suggestions.map(item => (
    <li
      key={item.id}
      id={`option-${item.id}`}
      role="option"
      aria-selected={activeId === `option-${item.id}`}
    >
      {item.text}
    </li>
  ))}
</ul>

<div role="status" aria-live="polite">
  {statusMessage}
</div>
```

The example assumes `activeId` holds the full DOM option ID, such as `option-123`. In a real implementation, the listbox should be rendered when the popup is open, and keyboard/pointer handlers must also be implemented.

### Interview Takeaway

For accessible autocomplete, focus on four key areas:

1. ARIA semantics: Use the WAI-ARIA combobox pattern with appropriate roles and attributes.
2. Keyboard navigation: Support Arrow Up/Down, Enter, Escape, and standard Tab behavior.
3. Focus management: Keep focus on the input and track the highlighted option using `aria-activedescendant`.
4. Screen reader announcements: Use a separate live region for loading, results, and error states.

Most important concept: Visually highlighting a suggestion is not enough. The autocomplete must also communicate the active suggestion to assistive technologies without moving focus away from the input.
