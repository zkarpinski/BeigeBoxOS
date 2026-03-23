/**
 * Minesweeper leaderboard: one per difficulty, top 10 by time (seconds).
 * Uses Supabase via /api/minesweeper-leaderboard when configured; falls back to localStorage.
 */

import type { DifficultyKey } from './MinesweeperLogic';

const STORAGE_KEY = 'minesweeper-leaderboard';
const API_PATH = '/api/minesweeper-leaderboard';
const API_START_PATH = '/api/minesweeper-leaderboard/start';
const API_ENDED_PATH = '/api/minesweeper-leaderboard/ended';
const TOP_N = 10;

export interface LeaderboardEntry {
  name: string;
  time: number;
}

export type LeaderboardData = Record<DifficultyKey, LeaderboardEntry[]>;

export interface DifficultyMetrics {
  attempts: number;
  completed: number;
  won: number;
}

export type LeaderboardMetrics = Record<DifficultyKey, DifficultyMetrics>;

function load(): LeaderboardData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefault();
    const data = JSON.parse(raw) as LeaderboardData;
    return {
      beginner: Array.isArray(data.beginner) ? data.beginner : [],
      intermediate: Array.isArray(data.intermediate) ? data.intermediate : [],
      expert: Array.isArray(data.expert) ? data.expert : [],
    };
  } catch {
    return getDefault();
  }
}

function getDefault(): LeaderboardData {
  return { beginner: [], intermediate: [], expert: [] };
}

function save(data: LeaderboardData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function getLeaderboard(diff: DifficultyKey): LeaderboardEntry[] {
  const data = load();
  return (data[diff] ?? []).slice(0, TOP_N);
}

export function getAllLeaderboards(): LeaderboardData {
  const data = load();
  return {
    beginner: (data.beginner ?? []).slice(0, TOP_N),
    intermediate: (data.intermediate ?? []).slice(0, TOP_N),
    expert: (data.expert ?? []).slice(0, TOP_N),
  };
}

/** Returns 1-based rank if this time would be in top 10, or 0 if not. */
export function getRank(diff: DifficultyKey, time: number): number {
  const entries = getLeaderboard(diff);
  const better = entries.filter((e) => e.time < time).length;
  const rank = better + 1;
  return rank <= TOP_N ? rank : 0;
}

/** Same as getRank but from pre-fetched leaderboard data (e.g. from API). */
export function getRankFromData(data: LeaderboardData, diff: DifficultyKey, time: number): number {
  const entries = (data[diff] ?? []).slice(0, TOP_N);
  const better = entries.filter((e) => e.time < time).length;
  const rank = better + 1;
  return rank <= TOP_N ? rank : 0;
}

/** Fetch leaderboard and metrics from API. Returns null if API is not configured or request fails. */
export async function fetchLeaderboard(): Promise<{
  data: LeaderboardData;
  metrics: LeaderboardMetrics | null;
} | null> {
  try {
    const res = await fetch(API_PATH);
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: LeaderboardData;
      metrics?: LeaderboardMetrics;
    };
    if (!json.data) return null;
    const data: LeaderboardData = {
      beginner: (json.data.beginner ?? []).slice(0, TOP_N),
      intermediate: (json.data.intermediate ?? []).slice(0, TOP_N),
      expert: (json.data.expert ?? []).slice(0, TOP_N),
    };
    const metrics = json.metrics ?? null;
    return { data, metrics };
  } catch {
    return null;
  }
}

/** Report a game ended (lost). Optional gameToken for server-side metrics; ignored if API unavailable. */
export async function reportGameEnded(
  diff: DifficultyKey,
  gameToken?: string | null,
): Promise<void> {
  if (!gameToken) return;
  try {
    await fetch(API_ENDED_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ difficulty: diff, game_token: gameToken }),
    });
  } catch {
    /* ignore */
  }
}

function addScoreLocal(diff: DifficultyKey, name: string, time: number): number {
  const data = load();
  const list = (data[diff] ?? []).slice();
  list.push({ name: name.trim() || 'Anonymous', time });
  list.sort((a, b) => a.time - b.time);
  data[diff] = list.slice(0, TOP_N);
  save(data);
  const rank = 1 + list.slice(0, TOP_N).filter((e) => e.time < time).length;
  return Math.min(rank, TOP_N) || 1;
}

/** Request a signed game token when the game starts (first click). Used for server-side time validation. */
export async function requestStartToken(diff: DifficultyKey): Promise<string | null> {
  try {
    const res = await fetch(API_START_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ difficulty: diff }),
    });
    const json = (await res.json()) as { token?: string };
    return res.ok && json.token ? json.token : null;
  } catch {
    return null;
  }
}

/** Submit score: tries API first (validates and prevents cheating), falls back to localStorage. Returns rank. */
export async function addScore(
  diff: DifficultyKey,
  name: string,
  time: number,
  gameToken?: string | null,
): Promise<number> {
  try {
    const body: Record<string, unknown> = {
      difficulty: diff,
      player_name: name.trim() || 'Anonymous',
      time_seconds: time,
    };
    if (gameToken) body.game_token = gameToken;
    const res = await fetch(API_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = (await res.json()) as { rank?: number; error?: string };
    if (res.ok && typeof json.rank === 'number') return json.rank;
  } catch {
    /* ignore */
  }
  return addScoreLocal(diff, name, time);
}
