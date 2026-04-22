## 2026-04-11 - [HIGH] Timing attack in HMAC verification

**Vulnerability:** HMAC signature verification was implemented using a manual loop, which is susceptible to timing attacks.
**Learning:** Manual comparisons of cryptographic hashes/signatures can leak information about the correct value because they often exit early upon finding the first mismatching byte.
**Prevention:** Always use constant-time comparison functions or native cryptographic verification APIs (like `crypto.subtle.verify`) for comparing sensitive values like signatures, tokens, or hashes.
