# Option 2: Static site on Cloudflare Pages + Worker API for leaderboard

This guide explains how to deploy the Windows 98 site as a **static export** on **Cloudflare Pages** and run the Minesweeper leaderboard API as **Cloudflare Pages Functions** (Workers). The static site and the API are on the same domain; the client keeps using `/api/minesweeper-leaderboard` and `/api/minesweeper-leaderboard/start` with no code changes.

**Why:** Next.js with `output: 'export'` produces a static site. Next.js API routes do not run in that build. By implementing the same API as Cloudflare Pages Functions, the leaderboard still works in production with Supabase, and you stay on the [Cloudflare free tier](https://developers.cloudflare.com/workers/platform/pricing/) (100k requests/day for Workers).

---

## Architecture

- **Static site:** `next build` → output in `out/` (or your static output dir). Cloudflare Pages serves these files.
- **API:** Files in the repo under `functions/` are deployed as Pages Functions. Requests to `/api/minesweeper-leaderboard` and `/api/minesweeper-leaderboard/start` are handled by these Workers, which call Supabase.

The front end already uses relative URLs (`/api/...`), so once the Functions are deployed on the same host, no client changes are needed.

---

## Prerequisites

1. **Supabase project** with the leaderboard tables. If you haven’t already, follow [MINESWEEPER_LEADERBOARD_SUPABASE.md](./MINESWEEPER_LEADERBOARD_SUPABASE.md) to create:
   - `minesweeper_leaderboard`
   - `minesweeper_used_tokens`
2. **Cloudflare account** (free tier is enough).

---

## 1. API is in Cloudflare Functions only

The project has no Next.js API routes; the leaderboard API lives only in `functions/` and runs on Cloudflare:

| Path in repo                                     | Serves                               | Methods   |
| ------------------------------------------------ | ------------------------------------ | --------- |
| `functions/api/minesweeper-leaderboard.js`       | `/api/minesweeper-leaderboard`       | GET, POST |
| `functions/api/minesweeper-leaderboard/start.js` | `/api/minesweeper-leaderboard/start` | POST      |

They implement the full API (min time, signed game token, one token per game, Supabase). Locally, `next dev` has no API so the client falls back to localStorage; in production Cloudflare serves these routes.

---

## 2. Environment variables

### Cloudflare (required for the leaderboard API)

In **Cloudflare dashboard** → **Pages** → your project → **Settings** → **Environment variables**, add:

| Variable                     | Required         | Description                                                                                                    |
| ---------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------- |
| `SUPABASE_URL`               | Yes              | Supabase project URL, e.g. `https://xxxx.supabase.co`. (The Functions also accept `NEXT_PUBLIC_SUPABASE_URL`.) |
| `SUPABASE_SERVICE_ROLE_KEY`  | Yes              | From Supabase → Settings → API → **service_role**. Mark as **Encrypt** (secret).                               |
| `LEADERBOARD_SIGNING_SECRET` | No (recommended) | Random secret for game tokens, e.g. `openssl rand -hex 32`. Mark as **Encrypt**.                               |

Apply to **Production** (and **Preview** if you use preview URLs). Redeploy after changing. The Functions read these from `context.env`; they do **not** read `.env.local`.

### .env.local (optional, for the test script only)

Used only when you run `node scripts/test-leaderboard-api.js` without passing a URL:

| Variable   | Description                                                   |
| ---------- | ------------------------------------------------------------- |
| `SITE_URL` | Your deployed site URL, e.g. `https://your-project.pages.dev` |

You do **not** need Supabase keys in `.env.local` for the leaderboard; the test script only calls your deployed API.

---

## 3. Build and deploy to Cloudflare Pages

### Option A: Deploy via Git (recommended)

1. Connect your repo to Cloudflare Pages (Pages → Create project → Connect to Git).
2. **Build settings:**
   - **Framework preset:** Next.js (Static HTML Export) or **None**.
   - **Build command:** `npm run build` (runs `next build` then writes `out/_routes.json` for Cloudflare).
   - **Build output directory:** `out` (Next.js static export default). If your `next.config` uses a different output dir, set that here.
   - **Root directory:** leave blank unless the app lives in a subdirectory.
3. Add the environment variables (step 2) in the same project.
4. Save and deploy. Pages will:
   - Run the build and publish the contents of `out/`.
   - Deploy the `functions/` directory as Pages Functions so `/api/minesweeper-leaderboard` and `/api/minesweeper-leaderboard/start` are served by Workers.

### Option B: Deploy with Wrangler

From the project root:

```bash
# Install Wrangler if needed
npm install -g wrangler

# Build the static site
npm run build

# Deploy to Pages (project name and dir may vary)
npx wrangler pages deploy out --project-name=your-website
```

Ensure the deployment includes the `functions` folder (same repo or same `wrangler.toml` context). Configure the env vars for the Pages project in the dashboard or via Wrangler.

### Optional: Limit Function invocations to `/api/*`

By default, adding a `functions/` directory can make Pages invoke a Function for every request. To keep static requests free and only run Workers for the leaderboard API, add a `_routes.json` in your **build output** (e.g. `out/`) so only `/api/*` hits the Functions:

**`out/_routes.json`** — the `npm run build` script already runs `scripts/write-cloudflare-routes.js` after `next build`, so `out/` includes this file. It limits Function invocations to `/api/*` so static assets stay free.

---

## 4. Verify

1. Open your site on the Pages URL (e.g. `https://your-project.pages.dev`).
2. Open Minesweeper, play a game, and win.
3. Submit your name. You should see your rank and the entry on the leaderboard.
4. Open **Game → Best Times** and confirm the list loads (from Supabase via the Worker).

If the API is missing or env vars are wrong, the client will fall back to the local-only leaderboard (localStorage); check the browser Network tab for 503/500 on `/api/minesweeper-leaderboard` and fix env/config.

**Quick API test (after deploy):** From the repo root, run:

```bash
node scripts/test-leaderboard-api.js https://your-project.pages.dev
```

Or set `SITE_URL` in `.env.local` and run `node scripts/test-leaderboard-api.js`. The script loads `.env.local` and checks that the leaderboard GET (Supabase) and the token POST (signing secret) respond correctly.

---

## 5. Cost

- **Cloudflare Pages:** Free for static sites and standard traffic.
- **Cloudflare Workers / Pages Functions:** Free tier includes 100,000 requests per day. Typical leaderboard usage (a few hundred to a few thousand requests per day) stays within this.
- **Supabase:** As in the main Supabase doc, the leaderboard uses only tables and API calls (no Realtime, no Edge Functions), so it fits the free tier.

---

## Summary

| Step | Action                                                                                                             |
| ---- | ------------------------------------------------------------------------------------------------------------------ |
| 1    | Use the `functions/api/...` files in this repo for the leaderboard API.                                            |
| 2    | Set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `LEADERBOARD_SIGNING_SECRET` in the Cloudflare Pages project. |
| 3    | Build with `npm run build` and deploy the static output plus `functions/` to Cloudflare Pages.                     |
| 4    | No client changes; the app keeps calling `/api/minesweeper-leaderboard` and `/api/minesweeper-leaderboard/start`.  |

This is “Option 2”: static site on Pages, leaderboard API on Workers, same domain, free tier.

---

## Troubleshooting

### 503 on `/api/minesweeper-leaderboard` or `/api/minesweeper-leaderboard/start`

The Functions are running but returning 503 because **Supabase (and optionally the signing secret) are not configured** for the environment that served the request.

1. In **Cloudflare dashboard** → **Workers & Pages** → your **Pages** project → **Settings** → **Environment variables**.
2. For **Production** (and **Preview** if you use branch deploys), add:
   - **SUPABASE_URL** — your Supabase project URL (e.g. `https://xxxx.supabase.co`). Mark as **plain text** (not secret) so the Function can read it.
   - **SUPABASE_SERVICE_ROLE_KEY** — from Supabase → Settings → API → `service_role`. Mark as **Secret**.
   - **LEADERBOARD_SIGNING_SECRET** — a random string (e.g. `openssl rand -hex 32`). Mark as **Secret**.
3. **Redeploy** the project (e.g. **Deployments** → **…** → **Retry deployment** or push a new commit) so the new env vars are picked up.

After that, the leaderboard API should return 200 and the app will use Supabase; until then the client falls back to localStorage.

### Build command

Use `npm run build` so that `out/_routes.json` is written after the static export. Using `npx next build` alone works for the static site but skips the routes file (optional; Pages may still work).

- **503 on `/api/minesweeper-leaderboard` or `/api/minesweeper-leaderboard/start`:** The Functions are running but Supabase isn’t configured. In Cloudflare Pages → your project → **Settings** → **Environment variables**, add (for Production and/or Preview):
  - **SUPABASE_URL** — your Supabase project URL, e.g. `https://xxxx.supabase.co`
  - **SUPABASE_SERVICE_ROLE_KEY** — from Supabase → Settings → API → `service_role` (mark as **Encrypt** / secret)
  - **LEADERBOARD_SIGNING_SECRET** (optional) — random string for game tokens, e.g. `openssl rand -hex 32`  
    Redeploy after changing env vars. The app will fall back to localStorage until the API returns 200.
