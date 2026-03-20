# Minesweeper Leaderboard with Supabase

The leaderboard can use **Supabase** when configured, with server-side validation to reduce cheating. If Supabase is not configured, the app falls back to **localStorage**.

**Free tier:** This setup uses only Supabase tables, RLS, and the leaderboard API (Cloudflare Pages Functions in production; see [CLOUDFLARE_PAGES_LEADERBOARD_API.md](./CLOUDFLARE_PAGES_LEADERBOARD_API.md)). No Supabase Edge Functions, no Realtime. It stays within the [Supabase free tier](https://supabase.com/pricing) (500 MB database, 2 GB bandwidth, 50,000 monthly active users).

## Setup

### 1. Create the tables in Supabase

In the Supabase SQL Editor, run:

```sql
-- Leaderboard scores (top 10 per difficulty shown)
create table minesweeper_leaderboard (
  id uuid default gen_random_uuid() primary key,
  difficulty text not null check (difficulty in ('beginner', 'intermediate', 'expert')),
  player_name text not null,
  time_seconds int not null check (time_seconds > 0),
  created_at timestamptz default now()
);

create index idx_leaderboard_difficulty_time on minesweeper_leaderboard(difficulty, time_seconds);

alter table minesweeper_leaderboard enable row level security;

create policy "Allow public read" on minesweeper_leaderboard for select using (true);

-- One token per game: each game_id can only be used once for a submit (when LEADERBOARD_SIGNING_SECRET is set)
create table minesweeper_used_tokens (
  game_id uuid primary key
);

alter table minesweeper_used_tokens enable row level security;

-- No anon access; only service role (API server) can insert/read.
-- Do not create any policies for anon. Service role bypasses RLS.

-- Metrics per difficulty: attempts (games started), completed (games ended), won (games won)
create table minesweeper_metrics (
  difficulty text primary key check (difficulty in ('beginner', 'intermediate', 'expert')),
  attempts bigint not null default 0,
  completed bigint not null default 0,
  won bigint not null default 0,
  updated_at timestamptz default now()
);

insert into minesweeper_metrics (difficulty) values ('beginner'), ('intermediate'), ('expert')
on conflict (difficulty) do nothing;

alter table minesweeper_metrics enable row level security;
create policy "Allow public read" on minesweeper_metrics for select using (true);

-- Atomic increments (called by API only; service role bypasses RLS)
create or replace function increment_minesweeper_attempts(p_difficulty text)
returns void language sql security definer as $$
  update minesweeper_metrics set attempts = attempts + 1, updated_at = now() where difficulty = p_difficulty;
$$;

create or replace function increment_minesweeper_completed_won(p_difficulty text)
returns void language sql security definer as $$
  update minesweeper_metrics set completed = completed + 1, won = won + 1, updated_at = now() where difficulty = p_difficulty;
$$;

create or replace function increment_minesweeper_completed(p_difficulty text)
returns void language sql security definer as $$
  update minesweeper_metrics set completed = completed + 1, updated_at = now() where difficulty = p_difficulty;
$$;
```

No insert/select policies are needed for `minesweeper_used_tokens` for anonymous users; the API (Cloudflare Functions in production) uses the service role and bypasses RLS.

### 2. Environment variables

**Production (Cloudflare):** Set these in the Cloudflare Pages project (Settings → Environment variables). See [CLOUDFLARE_PAGES_LEADERBOARD_API.md](./CLOUDFLARE_PAGES_LEADERBOARD_API.md).

**Local dev:** The app has no API routes; the client falls back to localStorage. To test against Supabase locally you’d need to run the Cloudflare Functions locally (e.g. `wrangler pages dev`). Optional: you can keep `.env.local` for other use; the leaderboard will use localStorage when running `next dev`.

For Cloudflare, use **SUPABASE_URL** (not `NEXT_PUBLIC_*`) and the same keys:

- **SUPABASE_URL** (or NEXT_PUBLIC_SUPABASE_URL): From Supabase project → Settings → API.
- **SUPABASE_SERVICE_ROLE_KEY**: From Supabase project → Settings → API → `service_role` (secret). Never expose this in the client.
- **LEADERBOARD_SIGNING_SECRET**: A random secret (e.g. `openssl rand -hex 32`) used to sign game-start tokens. When set, the API **requires** a valid token on submit and verifies that the claimed `time_seconds` matches the elapsed time since the token was issued (see below).

---

## How it works

- **Reads**: The client calls `GET /api/minesweeper-leaderboard`. The API (Cloudflare Functions in production) uses the service role to read from Supabase and returns the top 10 per difficulty. No Supabase keys are needed in the browser.
- **Writes**: When a player submits their name after winning, the client calls `POST /api/minesweeper-leaderboard` with `difficulty`, `player_name`, `time_seconds`, and (if signing is enabled) `game_token`. The API validates the payload and inserts via the service role.

### Signed game token (when `LEADERBOARD_SIGNING_SECRET` is set)

1. **Game start**: On the player’s first click, the client calls `POST /api/minesweeper-leaderboard/start` with `{ difficulty }`. The server returns a **signed token** containing a game id, difficulty, and server timestamp (`iat`). The client keeps this token in memory.
2. **Submit**: When the player wins and submits their name, the client sends the token with the score. The server:
   - Verifies the token’s HMAC signature (so it can’t be forged or tampered).
   - Checks that the token’s difficulty matches the submission.
   - Checks that the token isn’t too old (e.g. &lt; 2 hours).
   - **Validates time**: `elapsed = now - token.iat` must match the claimed `time_seconds` within a tolerance (e.g. 15 seconds). So you can’t submit “10 seconds” unless you actually started a game about 10 seconds ago.

So the server never trusts the client’s timer: it ties the score to **server-issued time** (when the token was created) and **server-issued time** (when the submit request arrived). Encryption isn’t needed: the payload is signed (HMAC-SHA256), not secret.

---

## Anti-cheat measures

1. **Minimum time per difficulty**  
   The API rejects times below a plausible minimum (e.g. beginner 5s, intermediate 15s, expert 30s). This blocks obviously impossible scores (e.g. 0 or 1 second).

2. **No direct DB writes from the client**  
   Inserts go only through the API (Cloudflare Functions in production). Anonymous users have no insert policy on the table, so they cannot write to Supabase directly.

3. **Server-side validation**  
   Difficulty must be one of `beginner` | `intermediate` | `expert`. Time must be a number in a valid range. Name is trimmed and length-capped.

4. **Signed game token (optional)**  
   If `LEADERBOARD_SIGNING_SECRET` is set, every submit must include a valid token from `/start`. The server verifies that the claimed game time matches the elapsed time since the token was issued (within ~15 seconds). Prevents submitting arbitrary low times without having had a game running.

5. **One token per game**  
   When token signing is enabled, the server records each used `game_id` in `minesweeper_used_tokens`. A token can only be used once; resubmitting with the same token returns "This game was already submitted."

6. **Optional (you can add later)**
   - **Rate limiting**: Limit submissions per IP (e.g. in the API route or via Supabase Edge Function).
   - **Stricter minimums**: Increase `MIN_TIME` in `functions/api/minesweeper-leaderboard.js` if you see suspicious scores.

---

## Metrics

The API tracks per-difficulty counts in `minesweeper_metrics`:

- **attempts** — games started (incremented when a start token is issued).
- **completed** — games that ended (won or lost); incremented on score submit (win) or when the client reports a loss via `POST /api/minesweeper-leaderboard/ended`.
- **won** — games won; incremented when a score is submitted.

`GET /api/minesweeper-leaderboard` includes a `metrics` object: `{ beginner: { attempts, completed, won }, intermediate: {...}, expert: {...} }`.

---

## Fallback

If the API is not configured (e.g. missing `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` in Cloudflare), it returns 503 and the app uses the existing **localStorage** leaderboard so the game still works offline or without Supabase.
