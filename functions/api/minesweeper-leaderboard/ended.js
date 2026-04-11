/**
 * Cloudflare Pages Function: /api/minesweeper-leaderboard/ended
 * POST = report a game ended (lost). Body: { difficulty, game_token }.
 * Verifies token, records game_id as used (so it can't be used to submit), increments completed.
 */

import { createClient } from '@supabase/supabase-js';

const DIFFICULTIES = ['beginner', 'intermediate', 'expert'];
const TOKEN_MAX_AGE_MS = 2 * 60 * 60 * 1000;

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function getSupabase(env) {
  const url = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

function b64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = str.length % 4;
  if (pad) str += '===='.slice(0, 4 - pad);
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
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

function parseToken(token) {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;
  let payloadJson;
  try {
    payloadJson = new TextDecoder().decode(b64UrlDecode(payloadB64));
  } catch {
    return null;
  }
  let payload;
  try {
    payload = JSON.parse(payloadJson);
  } catch {
    return null;
  }
  if (
    typeof payload.g !== 'string' ||
    !DIFFICULTIES.includes(payload.d) ||
    typeof payload.iat !== 'number'
  )
    return null;
  return { payloadB64, sigB64, payload };
}

async function verifySignature(secret, payloadB64, sigB64) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  const actualSig = b64UrlDecode(sigB64);
  return await crypto.subtle.verify(
    'HMAC',
    key,
    actualSig,
    new TextEncoder().encode(payloadB64),
  );
}

export async function onRequestPost(context) {
  const supabase = getSupabase(context.env);
  if (!supabase) {
    return jsonResponse({ error: 'Leaderboard not configured', ok: false }, 503);
  }
  const secret = context.env.LEADERBOARD_SIGNING_SECRET;
  if (!secret) {
    return jsonResponse({ error: 'Game tokens not configured', ok: false }, 503);
  }
  let body;
  try {
    body = await context.request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON', ok: false }, 400);
  }
  const difficulty = body.difficulty;
  const token = body.game_token;
  if (!DIFFICULTIES.includes(difficulty)) {
    return jsonResponse({ error: 'Invalid difficulty', ok: false }, 400);
  }
  if (!token || typeof token !== 'string') {
    return jsonResponse({ error: 'Missing game_token', ok: false }, 400);
  }
  const parsed = parseToken(token);
  if (!parsed) return jsonResponse({ error: 'Invalid token', ok: false }, 400);
  const ok = await verifySignature(secret, parsed.payloadB64, parsed.sigB64);
  if (!ok) return jsonResponse({ error: 'Invalid token', ok: false }, 400);
  if (parsed.payload.d !== difficulty) {
    return jsonResponse({ error: 'Token difficulty does not match', ok: false }, 400);
  }
  const ageMs = Date.now() - parsed.payload.iat;
  if (ageMs < 0 || ageMs > TOKEN_MAX_AGE_MS) {
    return jsonResponse({ error: 'Token expired', ok: false }, 400);
  }
  const { error: usedError } = await supabase
    .from('minesweeper_used_tokens')
    .insert({ game_id: parsed.payload.g });
  if (usedError && usedError.code !== '23505') {
    return jsonResponse({ error: 'Failed to record game', ok: false }, 500);
  }
  if (usedError && usedError.code === '23505') {
    return jsonResponse({ ok: true, already_recorded: true });
  }
  await supabase.rpc('increment_minesweeper_completed', { p_difficulty: difficulty });
  return jsonResponse({ ok: true });
}
