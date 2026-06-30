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

## 2026-06-10 - [HIGH] Fail-open on missing environment secrets

**Vulnerability:** Security-critical validation logic in Minesweeper Leaderboard API was skipped if `LEADERBOARD_SIGNING_SECRET` was missing, allowing unvalidated submissions.
**Learning:** Treating the absence of a secret as a feature toggle to skip security checks creates a "fail-open" state. Critical paths must enforce mandatory configuration.
**Prevention:** Always implement "fail-secure" logic. If a required security secret is missing, return a hard error (e.g., 503 Service Unavailable) instead of bypassing validation.

## 2026-06-25 - [HIGH] HTML Sanitizer Bypass and Incomplete Blacklisting

**Vulnerability:** The Word 97 HTML sanitizer was vulnerable to XSS due to an incomplete blacklist of tags and attributes, and it iterated over a live `NamedNodeMap` while mutating it, potentially skipping malicious attributes.
**Learning:** Blacklist-based sanitization is inherently fragile and requires constant updates as new bypass vectors are discovered. Furthermore, iterating forward over a live collection while removing items causes indices to shift, which can lead to security bypasses.
**Prevention:** Harden sanitizers by blacklisting broad categories of dangerous tags (forms, frames, media, etc.) and blocking dangerous URI schemes (`javascript:`, `data:`, `vbscript:`) in all sensitive attributes. Crucially, convert live collections to static arrays (e.g., `Array.from(el.attributes)`) before iteration to ensure every element is processed regardless of mutations.
