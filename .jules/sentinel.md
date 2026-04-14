## 2026-04-11 - [HIGH] Timing attack in HMAC verification
**Vulnerability:** HMAC signature verification was implemented using a manual loop, which is susceptible to timing attacks.
**Learning:** Manual comparisons of cryptographic hashes/signatures can leak information about the correct value because they often exit early upon finding the first mismatching byte.
**Prevention:** Always use constant-time comparison functions or native cryptographic verification APIs (like `crypto.subtle.verify`) for comparing sensitive values like signatures, tokens, or hashes.

## 2026-04-12 - [HIGH] XSS via dangerouslySetInnerHTML and manual string concatenation
**Vulnerability:** User-controllable strings (like buddy names and chat messages in AIM) were being injected into the DOM via `dangerouslySetInnerHTML` or manual string concatenation without proper escaping.
**Learning:** Even in retro-themed apps where "raw" HTML rendering is used for stylistic reasons (like emulating font tags or marquee), all dynamic content MUST be escaped before being wrapped in HTML tags.
**Prevention:** Use a centralized, tested `escapeHtml` utility for any content passed to `dangerouslySetInnerHTML`. Standard JSX text nodes are automatically escaped by React, so only use the utility when bypassing React's default protection.
