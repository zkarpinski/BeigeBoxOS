## 2026-04-11 - [HIGH] Timing attack in HMAC verification

**Vulnerability:** HMAC signature verification was implemented using a manual loop, which is susceptible to timing attacks.
**Learning:** Manual comparisons of cryptographic hashes/signatures can leak information about the correct value because they often exit early upon finding the first mismatching byte.
**Prevention:** Always use constant-time comparison functions or native cryptographic verification APIs (like `crypto.subtle.verify`) for comparing sensitive values like signatures, tokens, or hashes.

## 2026-05-15 - [MEDIUM] Unhandled exception in Base64 decoding
**Vulnerability:** The `atob()` function throws a `DOMException` on malformed input, which was causing unhandled 500 errors in Cloudflare Pages functions.
**Learning:** Defensive coding in API handlers must account for common functions that throw (like `atob` or `JSON.parse`) when processing user-controlled input, even if the input is expected to be a valid token.
**Prevention:** Wrap Base64 decoding logic in `try...catch` blocks and return a safe default (like an empty `Uint8Array`) to allow subsequent validation to fail gracefully.

## 2026-05-27 - [HIGH] Insecure postMessage targetOrigin
**Vulnerability:** The `NavigatorWindow.tsx` (Win98) used a wildcard `'*'` as the `targetOrigin` in a `postMessage` call from a sandboxed iframe.
**Learning:** Using `'*'` allows any window that frames the component to intercept the message, which is a risk even for non-sensitive data like navigation URLs.
**Prevention:** Always specify the exact target origin (e.g., `window.location.origin`) when sending messages via `postMessage` to ensure they are only received by the intended recipient.

## 2026-06-12 - [HIGH] Fail-open leaderboard API
**Vulnerability:** The Minesweeper Leaderboard API would skip token verification if `LEADERBOARD_SIGNING_SECRET` was missing, essentially "failing open".
**Learning:** Security-critical features must never treat the absence of a configuration (like a secret) as a signal to skip validation.
**Prevention:** Always enforce the presence of required security configurations and return a hard error (e.g., 503) if they are missing.
