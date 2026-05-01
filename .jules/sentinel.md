## 2026-04-11 - [HIGH] Timing attack in HMAC verification

**Vulnerability:** HMAC signature verification was implemented using a manual loop, which is susceptible to timing attacks.
**Learning:** Manual comparisons of cryptographic hashes/signatures can leak information about the correct value because they often exit early upon finding the first mismatching byte.
**Prevention:** Always use constant-time comparison functions or native cryptographic verification APIs (like `crypto.subtle.verify`) for comparing sensitive values like signatures, tokens, or hashes.

## 2026-04-12 - [HIGH] Sandbox bypass via allow-same-origin

**Vulnerability:** Simulated browsers (IE, Netscape) used `allow-scripts` and `allow-same-origin` together in their iframe `sandbox` attribute.
**Learning:** This combination is dangerous because a script inside the iframe can programmatically remove the `sandbox` attribute from its own parent element since they share the same origin, effectively bypassing all restrictions.
**Prevention:** Never use `allow-scripts` and `allow-same-origin` together if the iframe content could be untrusted or contains sensitive user data. When `allow-same-origin` is removed, the iframe content is treated as a unique origin, providing robust isolation even if scripts are executed.
