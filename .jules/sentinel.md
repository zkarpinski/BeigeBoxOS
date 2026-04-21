## 2026-04-11 - [HIGH] Timing attack in HMAC verification

**Vulnerability:** HMAC signature verification was implemented using a manual loop, which is susceptible to timing attacks.
**Learning:** Manual comparisons of cryptographic hashes/signatures can leak information about the correct value because they often exit early upon finding the first mismatching byte.
**Prevention:** Always use constant-time comparison functions or native cryptographic verification APIs (like `crypto.subtle.verify`) for comparing sensitive values like signatures, tokens, or hashes.

## 2026-04-21 - [MEDIUM] Unbounded database queries in leaderboard API

**Vulnerability:** The Minesweeper leaderboard API fetched all scores from the database and filtered them in-memory, which could lead to DoS or excessive memory usage as the database grows.
**Learning:** In-memory filtering of database results is not scalable and can be exploited to cause performance degradation.
**Prevention:** Always use `LIMIT` and server-side filtering (e.g., `.eq()`, `.limit()`) in database queries to ensure the amount of data retrieved is bounded and predictable.
