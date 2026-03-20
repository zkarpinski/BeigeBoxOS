/**
 * Quick test that the leaderboard API (Cloudflare Functions + Supabase) is working.
 * Loads .env.local so you can set SITE_URL there. Do not commit .env.local.
 * Run: node scripts/test-leaderboard-api.js [BASE_URL]
 * Base URL is: CLI arg, or SITE_URL from .env.local.
 */

const path = require('path');
const fs = require('fs');

// Load .env.local into process.env (same vars as Cloudflare doc)
const envPath = path.resolve(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
}

const base = process.argv[2] || process.env.SITE_URL;
if (!base) {
  console.error('Usage: node scripts/test-leaderboard-api.js [BASE_URL]');
  console.error('Or set in .env.local: SITE_URL=https://your-site.pages.dev');
  process.exit(1);
}

const api = `${base.replace(/\/$/, '')}/api/minesweeper-leaderboard`;
const apiStart = `${api}/start`;

async function test() {
  let ok = true;

  // 1. GET leaderboard (needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)
  try {
    const r = await fetch(api);
    const body = await r.json().catch(() => ({}));
    if (r.status === 200 && body.data && typeof body.data.beginner === 'object') {
      console.log(
        '✓ GET /api/minesweeper-leaderboard — Supabase is reachable, leaderboard data OK',
      );
    } else if (r.status === 503) {
      console.error(
        '✗ GET /api/minesweeper-leaderboard — 503 (Supabase not configured or env vars missing)',
      );
      if (body.error) console.error('  Error:', body.error);
      ok = false;
    } else {
      console.error('✗ GET /api/minesweeper-leaderboard —', r.status, body.error || body);
      ok = false;
    }
  } catch (e) {
    console.error('✗ GET /api/minesweeper-leaderboard —', e.message);
    ok = false;
  }

  // 2. POST start (needs LEADERBOARD_SIGNING_SECRET)
  try {
    const r = await fetch(apiStart, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ difficulty: 'beginner' }),
    });
    const body = await r.json().catch(() => ({}));
    if (r.status === 200 && body.token) {
      console.log(
        '✓ POST /api/minesweeper-leaderboard/start — Game token issued (signing secret OK)',
      );
    } else if (r.status === 503) {
      console.warn(
        '⚠ POST /api/minesweeper-leaderboard/start — 503 (LEADERBOARD_SIGNING_SECRET not set; optional for anti-cheat)',
      );
    } else {
      console.error('✗ POST /api/minesweeper-leaderboard/start —', r.status, body.error || body);
      ok = false;
    }
  } catch (e) {
    console.error('✗ POST /api/minesweeper-leaderboard/start —', e.message);
    ok = false;
  }

  if (ok) {
    console.log(
      '\nLeaderboard API looks good. Try playing Minesweeper on the site and submitting a score.',
    );
  } else {
    process.exit(1);
  }
}

test();
