/**
 * Cloudflare Pages Function: /api/minesweeper-leaderboard
 * GET = return leaderboard from Supabase; POST = validate and insert score.
 * Replicates app/api/minesweeper-leaderboard/route.ts for static export deploy.
 */

import { createClient } from '@supabase/supabase-js';

const DIFFICULTIES = ['beginner', 'intermediate', 'expert'];
const MIN_TIME = { beginner: 5, intermediate: 15, expert: 30 };
const MAX_NAME_LENGTH = 20;
const TOP_N = 10;
const TIME_TOLERANCE_SEC = 15;
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

// --- Game token verification (Web Crypto, no Node) ---
function b64UrlEncode(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
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

function verifyGameToken(secret, token) {
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
  // Signature verified asynchronously in POST handler
  return { payloadB64, sigB64, payload };
}

async function verifyGameTokenSignature(secret, payloadB64, sigB64) {
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    const actualSig = b64UrlDecode(sigB64);
    return await crypto.subtle.verify('HMAC', key, actualSig, new TextEncoder().encode(payloadB64));
  } catch {
    return false;
  }
}

const CONFIG_HINT =
  'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Cloudflare Pages → Settings → Environment variables (Production).';

export async function onRequestGet(context) {
  const supabase = getSupabase(context.env);
  if (!supabase) {
    return jsonResponse(
      { error: 'Leaderboard not configured', hint: CONFIG_HINT, data: null },
      503,
    );
  }
  try {
    const [beginnerRes, intermediateRes, expertRes, metricsRes] = await Promise.all([
      supabase
        .from('minesweeper_leaderboard')
        .select('player_name, time_seconds')
        .eq('difficulty', 'beginner')
        .order('time_seconds', { ascending: true })
        .limit(TOP_N),
      supabase
        .from('minesweeper_leaderboard')
        .select('player_name, time_seconds')
        .eq('difficulty', 'intermediate')
        .order('time_seconds', { ascending: true })
        .limit(TOP_N),
      supabase
        .from('minesweeper_leaderboard')
        .select('player_name, time_seconds')
        .eq('difficulty', 'expert')
        .order('time_seconds', { ascending: true })
        .limit(TOP_N),
      supabase.from('minesweeper_metrics').select('difficulty, attempts, completed, won'),
    ]);

    if (beginnerRes.error) throw beginnerRes.error;
    if (intermediateRes.error) throw intermediateRes.error;
    if (expertRes.error) throw expertRes.error;

    const mapRows = (rows) =>
      (rows ?? []).map((r) => ({ name: r.player_name, time: r.time_seconds }));

    const metricsRows = metricsRes.error ? [] : (metricsRes.data ?? []);
    const metricsByDiff = (d) =>
      metricsRows.find((r) => r.difficulty === d) || { attempts: 0, completed: 0, won: 0 };
    const metrics = {
      beginner: metricsByDiff('beginner'),
      intermediate: metricsByDiff('intermediate'),
      expert: metricsByDiff('expert'),
    };
    return jsonResponse({
      data: {
        beginner: mapRows(beginnerRes.data),
        intermediate: mapRows(intermediateRes.data),
        expert: mapRows(expertRes.data),
      },
      metrics,
    });
  } catch (e) {
    console.error('Leaderboard GET error', e);
    return jsonResponse({ error: 'Failed to load leaderboard', data: null }, 500);
  }
}

export async function onRequestPost(context) {
  const supabase = getSupabase(context.env);
  if (!supabase) {
    return jsonResponse({ error: 'Leaderboard not configured', hint: CONFIG_HINT, rank: 0 }, 503);
  }
  let body;
  try {
    body = await context.request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON', rank: 0 }, 400);
  }
  const difficulty = body.difficulty;
  if (!DIFFICULTIES.includes(difficulty))
    return jsonResponse({ error: 'Invalid difficulty', rank: 0 }, 400);
  const time =
    typeof body.time_seconds === 'number'
      ? body.time_seconds
      : parseInt(String(body.time_seconds), 10);
  if (!Number.isFinite(time) || time < MIN_TIME[difficulty] || time > 9999) {
    return jsonResponse(
      { error: `Time must be between ${MIN_TIME[difficulty]} and 9999 seconds`, rank: 0 },
      400,
    );
  }
  const signingSecret = context.env.LEADERBOARD_SIGNING_SECRET;
  if (!signingSecret) {
    return jsonResponse(
      { error: 'Leaderboard not configured (missing signing secret)', rank: 0 },
      503,
    );
  }

  const token = body.game_token;
  if (!token || typeof token !== 'string') {
    return jsonResponse({ error: 'Missing game token. Start a game and try again.', rank: 0 }, 400);
  }
  const verified = verifyGameToken(signingSecret, token);
  if (!verified) return jsonResponse({ error: 'Invalid or tampered game token', rank: 0 }, 400);
  const ok = await verifyGameTokenSignature(signingSecret, verified.payloadB64, verified.sigB64);
  if (!ok) return jsonResponse({ error: 'Invalid or tampered game token', rank: 0 }, 400);
  if (verified.payload.d !== difficulty) {
    return jsonResponse({ error: 'Token difficulty does not match submission', rank: 0 }, 400);
  }
  const now = Date.now();
  const ageMs = now - verified.payload.iat;
  if (ageMs < 0 || ageMs > TOKEN_MAX_AGE_MS) {
    return jsonResponse({ error: 'Game token expired or invalid', rank: 0 }, 400);
  }
  const elapsedSec = ageMs / 1000;
  if (Math.abs(elapsedSec - time) > TIME_TOLERANCE_SEC) {
    return jsonResponse({ error: 'Game token time verification failed', rank: 0 }, 400);
  }
  const { error: usedError } = await supabase
    .from('minesweeper_used_tokens')
    .insert({ game_id: verified.payload.g });
  if (usedError) {
    const isDuplicate = usedError.code === '23505';
    return jsonResponse(
      {
        error: isDuplicate ? 'This game was already submitted.' : 'Failed to record game.',
        rank: 0,
      },
      400,
    );
  }
  const name =
    typeof body.player_name === 'string'
      ? body.player_name.trim().slice(0, MAX_NAME_LENGTH) || 'Anonymous'
      : 'Anonymous';
  try {
    const { error: insertError } = await supabase.from('minesweeper_leaderboard').insert({
      difficulty,
      player_name: name,
      time_seconds: time,
    });
    if (insertError) throw insertError;
    const { error: rpcErr } = await supabase.rpc('increment_minesweeper_completed_won', {
      p_difficulty: difficulty,
    });
    if (rpcErr && process.env.NODE_ENV !== 'production')
      console.warn('Metrics increment failed:', rpcErr.message);
    const { count } = await supabase
      .from('minesweeper_leaderboard')
      .select('*', { count: 'exact', head: true })
      .eq('difficulty', difficulty)
      .lt('time_seconds', time);
    const rank = Math.min((count ?? 0) + 1, TOP_N);
    return jsonResponse({ rank, error: null });
  } catch (e) {
    console.error('Leaderboard POST error', e);
    return jsonResponse({ error: 'Failed to save score', rank: 0 }, 500);
  }
}
