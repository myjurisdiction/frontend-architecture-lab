## How React JSX Prevents XSS Attacks

- Automatic escaping: React automatically escapes values rendered through JSX expressions (`{value}`), treating strings as plain text rather than executable HTML.
- Example — Safe rendering:

  ```
  const userInput = '<img src=x onerror="alert(1)">';

  function Post() {
    return <div>{userInput}</div>;
  }
  ```

  React displays the string as text instead of creating an `<img>` element and executing its `onerror` handler.

- DOM manipulation: React uses DOM APIs to insert text safely rather than interpreting interpolated strings as HTML markup.
- `dangerouslySetInnerHTML` (XSS risk):
  - Bypasses React's default protection by inserting raw HTML.
  - Avoid it for untrusted content.
  - If necessary, sanitize HTML using DOMPurify with an explicit allowlist.
- URL attributes: JSX escaping does not automatically make every URL safe. Validate user-controlled `href` and `src` values against appropriate allowed schemes and destinations.
- Event handlers: React event handlers normally receive JavaScript functions rather than executable HTML attribute strings, reducing traditional inline-event-handler injection risks.
- Other risks: Direct DOM manipulation, third-party libraries, and unsafe HTML injection can bypass React's built-in protections.

Interview takeaway: React mitigates XSS by escaping dynamic text inserted through JSX, preventing user input from being interpreted as executable HTML. However, developers must still sanitize raw HTML, validate URLs, and avoid unsafe DOM operations.
