## 2026-04-11 - [HIGH] Timing attack in HMAC verification

**Vulnerability:** HMAC signature verification was implemented using a manual loop, which is susceptible to timing attacks.
**Learning:** Manual comparisons of cryptographic hashes/signatures can leak information about the correct value because they often exit early upon finding the first mismatching byte.
**Prevention:** Always use constant-time comparison functions or native cryptographic verification APIs (like `crypto.subtle.verify`) for comparing sensitive values like signatures, tokens, or hashes.

## 2026-04-16 - [HIGH] XSS in dynamic HTML rendering
**Vulnerability:** Buddy names in AIM were rendered using `dangerouslySetInnerHTML` without sanitization, allowing XSS via names set via `window.prompt`.
**Learning:** React's `dangerouslySetInnerHTML` is a common escape hatch for legacy-style HTML rendering but requires strict escaping of any embedded dynamic variables.
**Prevention:** Use a centralized `escapeHtml` utility for all dynamic content within `dangerouslySetInnerHTML` blocks. Prefer React text nodes or JSX whenever possible to leverage automatic escaping.
