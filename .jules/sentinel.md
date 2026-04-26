## 2026-04-11 - [HIGH] Timing attack in HMAC verification

**Vulnerability:** HMAC signature verification was implemented using a manual loop, which is susceptible to timing attacks.
**Learning:** Manual comparisons of cryptographic hashes/signatures can leak information about the correct value because they often exit early upon finding the first mismatching byte.
**Prevention:** Always use constant-time comparison functions or native cryptographic verification APIs (like `crypto.subtle.verify`) for comparing sensitive values like signatures, tokens, or hashes.

## 2026-04-12 - [HIGH] Fail Open and Unhandled Exception in Leaderboard API

**Vulnerability:** The Minesweeper Leaderboard API allowed score submissions without token verification if a signing secret was missing ("fail open"). Additionally, malformed tokens could trigger unhandled exceptions in the cryptographic verification logic, leading to 500 errors.
**Learning:** Security controls should fail closed by default. If a required security configuration (like a signing secret) is missing, the system should reject the operation rather than proceeding unprotected. Cryptographic operations on untrusted input must be wrapped in error handling to prevent application crashes or information leakage via generic error responses.
**Prevention:** Explicitly check for the presence of required security secrets and abort with an appropriate error if they are missing. Use try-catch blocks around cryptographic parsing and verification logic to ensure graceful failures.
