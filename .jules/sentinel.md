## 2026-04-11 - [HIGH] Timing attack in HMAC verification

**Vulnerability:** HMAC signature verification was implemented using a manual loop, which is susceptible to timing attacks.
**Learning:** Manual comparisons of cryptographic hashes/signatures can leak information about the correct value because they often exit early upon finding the first mismatching byte.
**Prevention:** Always use constant-time comparison functions or native cryptographic verification APIs (like `crypto.subtle.verify`) for comparing sensitive values like signatures, tokens, or hashes.

## 2026-05-12 - [HIGH] Iframe Sandbox Hardening (Internet Explorer)

**Vulnerability:** Iframe sandboxes in Internet Explorer components (Win98 and WinXP) included the `allow-same-origin` attribute alongside `allow-scripts`.
**Learning:** Combining `allow-scripts` and `allow-same-origin` in an iframe sandbox is dangerous. It allows the iframe content to programmatically access the parent window's DOM and potentially remove its own sandbox restrictions, effectively bypassing the security isolation.
**Prevention:** When sandboxing untrusted content that requires scripts, always omit `allow-same-origin` to ensure the content is treated as a unique origin, isolating it from the host's storage, cookies, and DOM.
