## 2026-04-11 - [HIGH] Timing attack in HMAC verification

**Vulnerability:** HMAC signature verification was implemented using a manual loop, which is susceptible to timing attacks.
**Learning:** Manual comparisons of cryptographic hashes/signatures can leak information about the correct value because they often exit early upon finding the first mismatching byte.
**Prevention:** Always use constant-time comparison functions or native cryptographic verification APIs (like `crypto.subtle.verify`) for comparing sensitive values like signatures, tokens, or hashes.

## 2026-05-15 - [MEDIUM] Unhandled exception in Base64 decoding
**Vulnerability:** The `atob()` function throws a `DOMException` on malformed input, which was causing unhandled 500 errors in Cloudflare Pages functions.
**Learning:** Defensive coding in API handlers must account for common functions that throw (like `atob` or `JSON.parse`) when processing user-controlled input, even if the input is expected to be a valid token.
**Prevention:** Wrap Base64 decoding logic in `try...catch` blocks and return a safe default (like an empty `Uint8Array`) to allow subsequent validation to fail gracefully.

## 2026-06-20 - [HIGH] Fail-open in Minesweeper Leaderboard API
**Vulnerability:** The Minesweeper Leaderboard API would skip token verification if the `LEADERBOARD_SIGNING_SECRET` environment variable was missing, allowing unverified scores to be submitted.
**Learning:** Security-critical features must fail-closed. Treating a missing environment variable as a feature toggle to skip validation creates a bypass if configuration is lost or accidentally omitted.
**Prevention:** Enforce mandatory configuration for security features. If a required secret is missing, return a hard error (e.g., 503 Service Unavailable) instead of proceeding with reduced security.
