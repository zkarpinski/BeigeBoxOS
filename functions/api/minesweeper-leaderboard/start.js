/**
 * Cloudflare Pages Function: /api/minesweeper-leaderboard/start
 * POST = return a signed game token for the given difficulty; increments attempts metric.
 */

import { createClient } from '@supabase/supabase-js';

const DIFFICULTIES = ['beginner', 'intermediate', 'expert'];

function getSupabase(env) {
  const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function b64UrlEncode(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmacSha256(secretKey, data) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secretKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    typeof data === 'string' ? new TextEncoder().encode(data) : data,
  );
  return new Uint8Array(sig);
}

async function createGameToken(secret, gameId, difficulty) {
  const payload = { g: gameId, d: difficulty, iat: Date.now() };
  const payloadB64 = b64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = await hmacSha256(secret, payloadB64);
  return `${payloadB64}.${b64UrlEncode(sig)}`;
}

const CONFIG_HINT =
  'Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and LEADERBOARD_SIGNING_SECRET in Cloudflare Pages → Settings → Environment variables (Production).';

export async function onRequestPost(context) {
  const secret = context.env.LEADERBOARD_SIGNING_SECRET;
  if (!secret) {
    return jsonResponse(
      { error: 'Game tokens not configured', hint: CONFIG_HINT, token: null },
      503,
    );
  }
  let body;
  try {
    body = await context.request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON', token: null }, 400);
  }
  const difficulty = body.difficulty;
  if (!DIFFICULTIES.includes(difficulty)) {
    return jsonResponse({ error: 'Invalid difficulty', token: null }, 400);
  }
  const gameId = crypto.randomUUID();
  const token = await createGameToken(secret, gameId, difficulty);
  const supabase = getSupabase(context.env);
  if (supabase) {
    try {
      await supabase.rpc('increment_minesweeper_attempts', { p_difficulty: difficulty });
    } catch {
      /* ignore metrics failure */
    }
  }
  return jsonResponse({ token });
}
