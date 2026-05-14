## 2026-04-11 - [HIGH] Timing attack in HMAC verification

**Vulnerability:** HMAC signature verification was implemented using a manual loop, which is susceptible to timing attacks.
**Learning:** Manual comparisons of cryptographic hashes/signatures can leak information about the correct value because they often exit early upon finding the first mismatching byte.
**Prevention:** Always use constant-time comparison functions or native cryptographic verification APIs (like `crypto.subtle.verify`) for comparing sensitive values like signatures, tokens, or hashes.

## 2026-05-15 - [MEDIUM] Unhandled exception in Base64 decoding
**Vulnerability:** The `atob()` function throws a `DOMException` on malformed input, which was causing unhandled 500 errors in Cloudflare Pages functions.
**Learning:** Defensive coding in API handlers must account for common functions that throw (like `atob` or `JSON.parse`) when processing user-controlled input, even if the input is expected to be a valid token.
**Prevention:** Wrap Base64 decoding logic in `try...catch` blocks and return a safe default (like an empty `Uint8Array`) to allow subsequent validation to fail gracefully.

## 2026-05-20 - [MEDIUM] Fail-open security logic in API handlers
**Vulnerability:** The Minesweeper Leaderboard API bypassed token verification entirely if the `LEADERBOARD_SIGNING_SECRET` environment variable was missing, allowing unverified scores to be submitted if the environment was misconfigured.
**Learning:** Security-critical environment variables must be treated as mandatory. If a secret required for verification is missing, the system should "fail-closed" by returning an error (e.g., 503 Service Unavailable) rather than skipping the check.
**Prevention:** Always validate that required cryptographic secrets are present before processing sensitive requests. Use a mandatory check at the beginning of the handler to ensure the security context is fully initialized.
