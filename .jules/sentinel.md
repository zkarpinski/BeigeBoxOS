## 2026-04-11 - [HIGH] Timing attack in HMAC verification

**Vulnerability:** HMAC signature verification was implemented using a manual loop, which is susceptible to timing attacks.
**Learning:** Manual comparisons of cryptographic hashes/signatures can leak information about the correct value because they often exit early upon finding the first mismatching byte.
**Prevention:** Always use constant-time comparison functions or native cryptographic verification APIs (like `crypto.subtle.verify`) for comparing sensitive values like signatures, tokens, or hashes.

## 2026-05-15 - [MEDIUM] Unhandled exception in Base64 decoding
**Vulnerability:** The `atob()` function throws a `DOMException` on malformed input, which was causing unhandled 500 errors in Cloudflare Pages functions.
**Learning:** Defensive coding in API handlers must account for common functions that throw (like `atob` or `JSON.parse`) when processing user-controlled input, even if the input is expected to be a valid token.
**Prevention:** Wrap Base64 decoding logic in `try...catch` blocks and return a safe default (like an empty `Uint8Array`) to allow subsequent validation to fail gracefully.

## 2026-06-20 - [HIGH] Fail-open on missing configuration
**Vulnerability:** Anti-cheat verification was treated as optional, bypassing all security checks if the signing secret was missing from the environment.
**Learning:** Security-critical features must not treat the absence of an environment variable as a feature toggle to skip validation; mandatory configuration must be enforced to prevent 'fail-open' vulnerabilities.
**Prevention:** Enforce mandatory configuration for security features. Missing required secrets should result in a hard "fail-secure" error (e.g., 503 Service Unavailable).

## 2026-06-20 - [MEDIUM] Exploit calibration via detailed error messages
**Vulnerability:** The API returned specific error messages for different validation failures, which can be used by attackers to calibrate and refine exploits.
**Learning:** Revealing detailed server-side validation or calculation results in API error responses facilitates exploit calibration and information leakage.
**Prevention:** Use generic error messages (e.g., "Invalid or tampered game token") for all security-related validation failures.
