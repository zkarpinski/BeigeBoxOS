## 2026-04-11 - [HIGH] Timing attack in HMAC verification

**Vulnerability:** HMAC signature verification was implemented using a manual loop, which is susceptible to timing attacks.
**Learning:** Manual comparisons of cryptographic hashes/signatures can leak information about the correct value because they often exit early upon finding the first mismatching byte.
**Prevention:** Always use constant-time comparison functions or native cryptographic verification APIs (like `crypto.subtle.verify`) for comparing sensitive values like signatures, tokens, or hashes.

## 2026-05-15 - [MEDIUM] Unhandled exception in Base64 decoding

**Vulnerability:** The `atob()` function throws a `DOMException` on malformed input, which was causing unhandled 500 errors in Cloudflare Pages functions.
**Learning:** Defensive coding in API handlers must account for common functions that throw (like `atob` or `JSON.parse`) when processing user-controlled input, even if the input is expected to be a valid token.
**Prevention:** Wrap Base64 decoding logic in `try...catch` blocks and return a safe default (like an empty `Uint8Array`) to allow subsequent validation to fail gracefully.

## 2026-06-12 - [HIGH] Fail-Open vulnerability in Leaderboard API

**Vulnerability:** The leaderboard submission logic would bypass token verification if `LEADERBOARD_SIGNING_SECRET` was not configured on the server, allowing unvalidated score submissions.
**Learning:** Security controls should "fail closed" by default. If a required dependency for verification (like a secret key) is missing, the application should reject the request rather than assuming it's safe to proceed without verification.
**Prevention:** Always treat the absence of security configuration or secrets as a terminal error for sensitive operations. Implement mandatory checks for required secrets at the beginning of API handlers and return a `503 Service Unavailable` or similar error if they are missing.
