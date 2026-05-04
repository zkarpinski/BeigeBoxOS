## 2026-04-11 - [HIGH] Timing attack in HMAC verification

**Vulnerability:** HMAC signature verification was implemented using a manual loop, which is susceptible to timing attacks.
**Learning:** Manual comparisons of cryptographic hashes/signatures can leak information about the correct value because they often exit early upon finding the first mismatching byte.
**Prevention:** Always use constant-time comparison functions or native cryptographic verification APIs (like `crypto.subtle.verify`) for comparing sensitive values like signatures, tokens, or hashes.

## 2026-05-04 - [HIGH] Iframe Sandbox Escape via allow-same-origin

**Vulnerability:** Browser replica components (Netscape/IE) used `allow-scripts` and `allow-same-origin` together in `<iframe>` sandboxes.
**Learning:** Combining these two attributes allows a sandboxed iframe to access the parent document's DOM and potentially modify its own sandbox or steal sensitive data, effectively negating the sandbox's protection if untrusted content is loaded.
**Prevention:** Avoid `allow-same-origin` in sandboxed iframes that also allow scripts unless strictly necessary. If communication is needed, use a secure `postMessage` bridge with strict `e.source` and `e.origin` validation (checking for `e.origin === 'null'` for unique-origin sandboxes).
