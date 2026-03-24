/**
 * Unit tests for Minesweeper leaderboard (localStorage + API helpers).
 */
import {
  getLeaderboard,
  getAllLeaderboards,
  getRank,
  getRankFromData,
  addScore,
  fetchLeaderboard,
  requestStartToken,
  reportGameEnded,
  type LeaderboardData,
} from './leaderboard';

const STORAGE_KEY = 'minesweeper-leaderboard';

function clearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

describe('leaderboard', () => {
  beforeEach(clearStorage);
  afterEach(clearStorage);

  describe('getLeaderboard / getAllLeaderboards', () => {
    test('returns empty arrays when no data', () => {
      expect(getLeaderboard('beginner')).toEqual([]);
      expect(getAllLeaderboards()).toEqual({
        beginner: [],
        intermediate: [],
        expert: [],
      });
    });

    test('returns top 10 for difficulty after addScore', async () => {
      await addScore('beginner', 'Alice', 50);
      expect(getLeaderboard('beginner')).toEqual([{ name: 'Alice', time: 50 }]);
      expect(getLeaderboard('intermediate')).toEqual([]);
    });

    test('getAllLeaderboards returns all three difficulties', async () => {
      await addScore('beginner', 'A', 10);
      await addScore('expert', 'B', 200);
      const all = getAllLeaderboards();
      expect(all.beginner).toHaveLength(1);
      expect(all.beginner[0]).toEqual({ name: 'A', time: 10 });
      expect(all.intermediate).toEqual([]);
      expect(all.expert).toHaveLength(1);
      expect(all.expert[0]).toEqual({ name: 'B', time: 200 });
    });
  });

  describe('getRank', () => {
    test('empty board: time gets rank 1', () => {
      expect(getRank('beginner', 100)).toBe(1);
    });

    test('one entry worse than time: rank 1', async () => {
      await addScore('beginner', 'X', 50);
      expect(getRank('beginner', 30)).toBe(1);
    });

    test('one entry better than time: rank 2', async () => {
      await addScore('beginner', 'X', 20);
      expect(getRank('beginner', 50)).toBe(2);
    });

    test('rank 11 returns 0 (not in top 10)', async () => {
      for (let i = 0; i < 10; i++) await addScore('beginner', `P${i}`, 10 + i); // 10..19, all better than 50
      expect(getRank('beginner', 50)).toBe(0);
    });

    test('exactly 10 entries: new best gets rank 1', async () => {
      for (let i = 0; i < 10; i++) await addScore('beginner', `P${i}`, 20 + i);
      expect(getRank('beginner', 5)).toBe(1);
    });
  });

  describe('getRankFromData', () => {
    test('computes rank from pre-fetched data', () => {
      const data: LeaderboardData = {
        beginner: [
          { name: 'A', time: 10 },
          { name: 'B', time: 20 },
        ],
        intermediate: [],
        expert: [],
      };
      expect(getRankFromData(data, 'beginner', 5)).toBe(1);
      expect(getRankFromData(data, 'beginner', 15)).toBe(2);
      expect(getRankFromData(data, 'beginner', 25)).toBe(3);
      expect(getRankFromData(data, 'beginner', 100)).toBe(3); // 2 better, rank 3, still in top 10
    });
    test('returns 0 when rank would be beyond top 10', () => {
      const data: LeaderboardData = {
        beginner: Array.from({ length: 10 }, (_, i) => ({ name: `P${i}`, time: 10 + i })),
        intermediate: [],
        expert: [],
      };
      expect(getRankFromData(data, 'beginner', 5)).toBe(1);
      expect(getRankFromData(data, 'beginner', 25)).toBe(0); // 10 better times, rank 11
    });
  });

  describe('addScore (local)', () => {
    test('adds entry and returns rank 1', async () => {
      const rank = await addScore('beginner', 'Bob', 42);
      expect(rank).toBe(1);
      expect(getLeaderboard('beginner')).toEqual([{ name: 'Bob', time: 42 }]);
    });

    test('trims name and uses Anonymous for empty', async () => {
      await addScore('beginner', '  ', 10);
      expect(getLeaderboard('beginner')[0].name).toBe('Anonymous');
    });

    test('sorts by time ascending and keeps top 10', async () => {
      await addScore('beginner', 'A', 100);
      await addScore('beginner', 'B', 10);
      await addScore('beginner', 'C', 50);
      expect(getLeaderboard('beginner').map((e) => e.time)).toEqual([10, 50, 100]);
    });

    test('more than 10 entries: only top 10 kept', async () => {
      for (let i = 0; i < 15; i++) await addScore('beginner', `P${i}`, 100 - i);
      const list = getLeaderboard('beginner');
      expect(list).toHaveLength(10);
      expect(list[0].time).toBe(86); // 100-14
      expect(list[9].time).toBe(95); // 100-5
    });
  });

  describe('fetchLeaderboard', () => {
    test('returns null when fetch fails', async () => {
      const orig = global.fetch;
      (global as unknown as { fetch: unknown }).fetch = () => Promise.reject(new Error('network'));
      const result = await fetchLeaderboard();
      (global as unknown as { fetch: unknown }).fetch = orig;
      expect(result).toBeNull();
    });

    test('returns null when response not ok', async () => {
      const orig = global.fetch;
      (global as unknown as { fetch: unknown }).fetch = () =>
        Promise.resolve({ ok: false, json: () => Promise.resolve({}) } as Response);
      const result = await fetchLeaderboard();
      (global as unknown as { fetch: unknown }).fetch = orig;
      expect(result).toBeNull();
    });

    test('returns data and metrics when response ok and has data', async () => {
      const orig = global.fetch;
      (global as unknown as { fetch: unknown }).fetch = () =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: {
                beginner: [{ name: 'X', time: 5 }],
                intermediate: [],
                expert: [],
              },
              metrics: {
                beginner: { attempts: 10, completed: 8, won: 5 },
                intermediate: { attempts: 0, completed: 0, won: 0 },
                expert: { attempts: 0, completed: 0, won: 0 },
              },
            }),
        } as Response);
      const result = await fetchLeaderboard();
      (global as unknown as { fetch: unknown }).fetch = orig;
      expect(result).not.toBeNull();
      expect(result!.data.beginner).toEqual([{ name: 'X', time: 5 }]);
      expect(result!.metrics?.beginner).toEqual({ attempts: 10, completed: 8, won: 5 });
    });
  });

  describe('reportGameEnded', () => {
    test('does not call fetch when gameToken is missing', async () => {
      const orig = global.fetch;
      const fetchSpy = jest.fn();
      (global as unknown as { fetch: unknown }).fetch = fetchSpy;
      await reportGameEnded('beginner');
      await reportGameEnded('expert', null);
      await reportGameEnded('intermediate', undefined);
      (global as unknown as { fetch: unknown }).fetch = orig;
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    test('POSTs to ended endpoint with difficulty and game_token when token provided', async () => {
      const orig = global.fetch;
      let capturedUrl: string | null = null;
      let capturedOpts: RequestInit | null = null;
      (global as unknown as { fetch: unknown }).fetch = (url: unknown, opts?: RequestInit) => {
        capturedUrl = String(url);
        capturedOpts = opts ?? null;
        return Promise.resolve({ ok: true } as Response);
      };
      await reportGameEnded('expert', 'my.token.value');
      (global as unknown as { fetch: unknown }).fetch = orig;
      expect(capturedUrl).toMatch(/\/api\/minesweeper-leaderboard\/ended$/);
      expect(capturedOpts?.method).toBe('POST');
      expect(capturedOpts?.headers).toEqual({ 'Content-Type': 'application/json' });
      const body = JSON.parse((capturedOpts?.body as string) ?? '{}');
      expect(body).toEqual({ difficulty: 'expert', game_token: 'my.token.value' });
    });

    test('does not throw when fetch fails', async () => {
      const orig = global.fetch;
      (global as unknown as { fetch: unknown }).fetch = () => Promise.reject(new Error('network'));
      await expect(reportGameEnded('beginner', 'token')).resolves.toBeUndefined();
      (global as unknown as { fetch: unknown }).fetch = orig;
    });
  });

  describe('requestStartToken', () => {
    test('returns null when fetch fails', async () => {
      const orig = global.fetch;
      (global as unknown as { fetch: unknown }).fetch = () => Promise.reject(new Error('net'));
      const token = await requestStartToken('beginner');
      (global as unknown as { fetch: unknown }).fetch = orig;
      expect(token).toBeNull();
    });

    test('returns token when response ok', async () => {
      const orig = global.fetch;
      (global as unknown as { fetch: unknown }).fetch = (
        _url: unknown,
        opts?: { method?: string },
      ) => {
        expect(opts?.method).toBe('POST');
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ token: 'fake.token.here' }),
        } as Response);
      };
      const token = await requestStartToken('intermediate');
      (global as unknown as { fetch: unknown }).fetch = orig;
      expect(token).toBe('fake.token.here');
    });
  });

  describe('addScore with API fallback', () => {
    test('when API returns ok with rank, returns that rank', async () => {
      const orig = global.fetch;
      (global as unknown as { fetch: unknown }).fetch = (url: unknown) => {
        const u = String(url);
        if (u.includes('/start'))
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ token: 't' }),
          } as Response);
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ rank: 2 }),
        } as Response);
      };
      const rank = await addScore('beginner', 'Test', 30, 'some-token');
      (global as unknown as { fetch: unknown }).fetch = orig;
      expect(rank).toBe(2);
    });

    test('when API fails, falls back to localStorage and returns local rank', async () => {
      clearStorage();
      const orig = global.fetch;
      (global as unknown as { fetch: unknown }).fetch = () => Promise.reject(new Error('offline'));
      const rank = await addScore('beginner', 'Local', 99);
      (global as unknown as { fetch: unknown }).fetch = orig;
      expect(rank).toBe(1);
      expect(getLeaderboard('beginner')).toEqual([{ name: 'Local', time: 99 }]);
    });
  });
});
