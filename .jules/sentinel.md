## 2026-04-11 - [HIGH] Timing attack in HMAC verification

**Vulnerability:** HMAC signature verification was implemented using a manual loop, which is susceptible to timing attacks.
**Learning:** Manual comparisons of cryptographic hashes/signatures can leak information about the correct value because they often exit early upon finding the first mismatching byte.
**Prevention:** Always use constant-time comparison functions or native cryptographic verification APIs (like `crypto.subtle.verify`) for comparing sensitive values like signatures, tokens, or hashes.

## 2026-04-27 - [ENHANCEMENT] Robust HTML Sanitization with DOMParser
**Vulnerability:** The Word application's HTML sanitizer was using a weak blacklist, allowing many tags (like svg, math, form) and dangerous style attributes that could be used for XSS.
**Learning:** When full-featured sanitization libraries like DOMPurify are unavailable, a manual sanitizer using DOMParser must be aggressive in blocking not just scripts but also tags that can carry executable content or bypass filters (SVG, MathML) and attributes that allow expressions or javascript URLs.
**Prevention:** Use a more comprehensive blacklist for tags and specifically sanitize 'style' and other URL-bearing attributes. A better long-term approach would be a strict allowlist.
