## 2026-04-11 - [HIGH] Timing attack in HMAC verification

**Vulnerability:** HMAC signature verification was implemented using a manual loop, which is susceptible to timing attacks.
**Learning:** Manual comparisons of cryptographic hashes/signatures can leak information about the correct value because they often exit early upon finding the first mismatching byte.
**Prevention:** Always use constant-time comparison functions or native cryptographic verification APIs (like `crypto.subtle.verify`) for comparing sensitive values like signatures, tokens, or hashes.

## 2026-05-15 - [MEDIUM] Unhandled exception in Base64 decoding

**Vulnerability:** The `atob()` function throws a `DOMException` on malformed input, which was causing unhandled 500 errors in Cloudflare Pages functions.
**Learning:** Defensive coding in API handlers must account for common functions that throw (like `atob` or `JSON.parse`) when processing user-controlled input, even if the input is expected to be a valid token.
**Prevention:** Wrap Base64 decoding logic in `try...catch` blocks and return a safe default (like an empty `Uint8Array`) to allow subsequent validation to fail gracefully.

## 2026-06-20 - [HIGH] Fail-open vulnerability due to missing secret

**Vulnerability:** The Minesweeper Leaderboard submission API treated the absence of the `LEADERBOARD_SIGNING_SECRET` environment variable as a toggle to skip token verification, allowing unverified scores.
**Learning:** Security-critical features must not treat the absence of mandatory configuration as a feature toggle to skip validation. This "fail-open" pattern leads to insecure defaults if the environment is misconfigured.
**Prevention:** Enforce mandatory configuration for security features; if a required secret or config is missing, the application should "fail-closed" (e.g., return a 503 Service Unavailable error) rather than bypassing security checks.
