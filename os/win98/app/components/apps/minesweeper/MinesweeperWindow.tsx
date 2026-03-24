'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { AppConfig } from '@/app/types/app-config';
import { useWindowManager, useOsShell } from '@retro-web/core/context';
import {
  type Cell,
  type DifficultyKey,
  type GameState,
  DIFFICULTIES,
  makeBoard,
  getNeighbors,
  placeMines,
  floodReveal,
  cellClass,
  checkWin,
} from './MinesweeperLogic';
import {
  getRank,
  getRankFromData,
  addScore,
  getAllLeaderboards,
  fetchLeaderboard,
  requestStartToken,
  reportGameEnded,
  type LeaderboardData,
  type LeaderboardMetrics,
} from './leaderboard';

const MINESWEEPER_ICON_SRC = 'apps/minesweeper/minesweeper-icon.png';

export const minesweeperAppConfig: AppConfig = {
  id: 'minesweeper',
  label: 'Minesweeper',
  icon: MINESWEEPER_ICON_SRC,
  desktop: true,
  startMenu: { path: ['Programs', 'Games'] },
  taskbarLabel: 'Minesweeper',
};

type FaceType = 'smile' | 'surprise' | 'dead' | 'win';

export function MinesweeperWindow() {
  const ctx = useWindowManager();
  const { AppWindow, TitleBar } = useOsShell();
  const [difficulty, setDiff] = useState<DifficultyKey>('beginner');
  const [board, setBoard] = useState<Cell[][]>(() => makeBoard(9, 9));
  const [gameState, setGS] = useState<GameState>('ready');
  const [flags, setFlags] = useState(0);
  const [timer, setTimer] = useState(0);
  const [face, setFace] = useState<FaceType>('smile');
  const [useMarks, setUseMarks] = useState(true);
  const [pressedCell, setPressedCell] = useState<[number, number] | null>(null);
  const [chordCells, setChordCells] = useState<[number, number][]>([]);
  const [winDialog, setWinDialog] = useState<{ show: boolean; time: number; rank: number }>({
    show: false,
    time: 0,
    rank: 0,
  });
  const [winName, setWinName] = useState('');
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [leaderboardMetrics, setLeaderboardMetrics] = useState<LeaderboardMetrics | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastWonRef = useRef(false);
  const gameTokenRef = useRef<string | null>(null);
  const leftDownRef = useRef(false);
  const rightDownRef = useRef(false);
  const boardRef = useRef(board);
  const gsRef = useRef(gameState);
  const diffRef = useRef(difficulty);
  boardRef.current = board;
  gsRef.current = gameState;
  diffRef.current = difficulty;

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => setTimer((t) => (t < 999 ? t + 1 : t)), 1000);
  }, []);

  function initGame(diff: DifficultyKey = diffRef.current) {
    stopTimer();
    lastWonRef.current = false;
    lastLostRef.current = false;
    gameTokenRef.current = null;
    const { w, h } = DIFFICULTIES[diff];
    setBoard(makeBoard(w, h));
    setGS('ready');
    setFlags(0);
    setTimer(0);
    setFace('smile');
    leftDownRef.current = false;
    rightDownRef.current = false;
    setPressedCell(null);
    setChordCells([]);
  }

  function changeDiff(d: DifficultyKey) {
    setDiff(d);
    initGame(d);
  }

  useEffect(() => () => stopTimer(), [stopTimer]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'F2') initGame();
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  });

  useEffect(() => {
    if (gameState !== 'playing' || gameTokenRef.current) return;
    requestStartToken(difficulty).then((token) => {
      if (token) gameTokenRef.current = token;
    });
  }, [gameState, difficulty]);

  useEffect(() => {
    if (gameState !== 'won' || lastWonRef.current) return;
    lastWonRef.current = true;
    setWinName('');
    let cancelled = false;
    (async () => {
      const result = await fetchLeaderboard();
      if (cancelled) return;
      const data = result?.data ?? null;
      const rank = data ? getRankFromData(data, difficulty, timer) : getRank(difficulty, timer);
      setWinDialog({ show: true, time: timer, rank });
    })();
    return () => {
      cancelled = true;
    };
  }, [gameState, difficulty, timer]);

  const lastLostRef = useRef(false);
  useEffect(() => {
    if (gameState !== 'lost' || lastLostRef.current) return;
    lastLostRef.current = true;
    reportGameEnded(difficulty, gameTokenRef.current);
  }, [gameState, difficulty]);

  function doReveal(x: number, y: number) {
    setBoard((prev) => {
      const cell = prev[y][x];
      if (cell.isRevealed || cell.flagState === 1) return prev;
      const diff = diffRef.current;
      const { w, h, mines } = DIFFICULTIES[diff];
      let next = prev;

      if (gsRef.current === 'ready') {
        next = placeMines(prev, x, y, mines, w, h);
        setGS('playing');
        gsRef.current = 'playing';
        startTimer();
      }

      next = floodReveal(next, x, y, w, h);

      if (next[y][x].isMine) {
        stopTimer();
        setGS('lost');
        gsRef.current = 'lost';
        setFace('dead');
        return next;
      }

      if (checkWin(next, diff)) {
        stopTimer();
        setGS('won');
        gsRef.current = 'won';
        setFace('win');
        setFlags(mines);
      }
      return next;
    });
  }

  function doChord(x: number, y: number) {
    const b = boardRef.current;
    const diff = diffRef.current;
    const { w, h, mines } = DIFFICULTIES[diff];
    const cell = b[y][x];
    if (!cell.isRevealed || cell.neighborMines === 0) return;
    const neighbors = getNeighbors(x, y, w, h);
    if (neighbors.filter(([nx, ny]) => b[ny][nx].flagState === 1).length !== cell.neighborMines)
      return;

    let hitMine = false;
    setBoard((prev) => {
      let next = prev.map((r) => r.map((c) => ({ ...c })));
      for (const [nx, ny] of neighbors) {
        const n = next[ny][nx];
        if (!n.isRevealed && n.flagState !== 1) {
          if (n.isMine) {
            n.isRevealed = true;
            hitMine = true;
          } else {
            next = floodReveal(next, nx, ny, w, h);
          }
        }
      }
      if (hitMine) {
        stopTimer();
        setGS('lost');
        gsRef.current = 'lost';
        setFace('dead');
      } else if (checkWin(next, diff)) {
        stopTimer();
        setGS('won');
        gsRef.current = 'won';
        setFace('win');
        setFlags(mines);
      }
      return next;
    });
  }

  function toggleFlag(x: number, y: number) {
    setBoard((prev) => {
      const cell = prev[y][x];
      if (cell.isRevealed) return prev;
      const next = prev.map((r) => r.map((c) => ({ ...c })));
      const c = next[y][x];
      if (c.flagState === 0) {
        c.flagState = 1;
        setFlags((f) => f + 1);
      } else if (c.flagState === 1) {
        c.flagState = useMarks ? 2 : 0;
        setFlags((f) => f - 1);
      } else {
        c.flagState = 0;
      }
      return next;
    });
  }

  function handleCellMouseDown(e: React.MouseEvent, x: number, y: number) {
    if (gsRef.current === 'lost' || gsRef.current === 'won') return;
    e.preventDefault();

    const cell = boardRef.current[y][x];
    if (e.button === 0 && cell.flagState === 1) return;

    if (e.button === 0) leftDownRef.current = true;
    if (e.button === 2) rightDownRef.current = true;

    const chord = e.button === 1 || (leftDownRef.current && rightDownRef.current);
    if (chord) {
      const diff = diffRef.current;
      const { w, h } = DIFFICULTIES[diff];
      setChordCells(
        getNeighbors(x, y, w, h).filter(
          ([nx, ny]) =>
            !boardRef.current[ny][nx].isRevealed && boardRef.current[ny][nx].flagState !== 1,
        ),
      );
      setFace('surprise');
      return;
    }
    if (leftDownRef.current && !rightDownRef.current) {
      if (!cell.isRevealed && cell.flagState !== 1) {
        setPressedCell([x, y]);
        setFace('surprise');
      }
    } else if (rightDownRef.current && !leftDownRef.current) {
      toggleFlag(x, y);
    }
  }

  useEffect(() => {
    function handleMouseUp(e: MouseEvent) {
      const wasChording = leftDownRef.current && rightDownRef.current;
      if (e.button === 0) leftDownRef.current = false;
      if (e.button === 2) rightDownRef.current = false;

      if (gsRef.current === 'lost' || gsRef.current === 'won') return;
      setFace('smile');

      if (wasChording) {
        setChordCells([]);
        if (!leftDownRef.current && !rightDownRef.current) {
          const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
          if (target?.classList.contains('ms-cell')) {
            const cx = parseInt(target.dataset.x ?? '-1');
            const cy = parseInt(target.dataset.y ?? '-1');
            if (cx >= 0 && cy >= 0) doChord(cx, cy);
          }
        }
        return;
      }
      setPressedCell((prev) => {
        if (prev && e.button === 0) {
          const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
          if (target?.classList.contains('ms-cell')) {
            const tx = parseInt(target.dataset.x ?? '-1');
            const ty = parseInt(target.dataset.y ?? '-1');
            if (tx === prev[0] && ty === prev[1]) doReveal(tx, ty);
          }
        }
        return null;
      });
    }
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  });

  const { w, h } = DIFFICULTIES[difficulty];
  const mineDisplay = (() => {
    const r = DIFFICULTIES[difficulty].mines - flags;
    return r >= 0 ? r.toString().padStart(3, '0') : '-' + Math.abs(r).toString().padStart(2, '0');
  })();

  return (
    <AppWindow
      id="minesweeper-window"
      appId="minesweeper"
      className="minesweeper-window app-window app-window-hidden"
      titleBar={
        <TitleBar
          title="Minesweeper"
          icon={
            <img
              src={MINESWEEPER_ICON_SRC}
              alt="Minesweeper"
              style={{ width: 16, height: 16, marginRight: 4 }}
            />
          }
          showMin
          showMax={false}
          showClose
        />
      }
    >
      <div className="minesweeper-menu-bar">
        <div className="minesweeper-menu-item">
          <u>G</u>ame
          <div className="minesweeper-menu-dropdown">
            <div className="minesweeper-dropdown-item" onClick={() => initGame()}>
              <span>
                <u>N</u>ew
              </span>
              <span className="notepad-shortcut">F2</span>
            </div>
            <div className="minesweeper-dropdown-divider" />
            {(['beginner', 'intermediate', 'expert'] as DifficultyKey[]).map((d) => (
              <div
                key={d}
                className={`minesweeper-dropdown-item${difficulty === d ? ' checked' : ''}`}
                onClick={() => changeDiff(d)}
              >
                <span>
                  <u>{d[0].toUpperCase()}</u>
                  {d.slice(1)}
                </span>
              </div>
            ))}
            <div className="minesweeper-dropdown-divider" />
            <div
              className="minesweeper-dropdown-item"
              onClick={async () => {
                const result = await fetchLeaderboard();
                setLeaderboardData(result?.data ?? getAllLeaderboards());
                setLeaderboardMetrics(result?.metrics ?? null);
                setShowLeaderboard(true);
              }}
            >
              <span>
                Best T<u>i</u>mes...
              </span>
            </div>
            <div className="minesweeper-dropdown-divider" />
            <div
              className={`minesweeper-dropdown-item${useMarks ? ' checked' : ''}`}
              onClick={() => setUseMarks((m) => !m)}
            >
              <span>
                <u>M</u>arks (?)
              </span>
            </div>
            <div className="minesweeper-dropdown-divider" />
            <div className="minesweeper-dropdown-item" onClick={() => ctx?.hideApp('minesweeper')}>
              <span>
                E<u>x</u>it
              </span>
            </div>
          </div>
        </div>
        <div className="minesweeper-menu-item">
          <u>H</u>elp
          <div className="minesweeper-menu-dropdown">
            <div className="minesweeper-dropdown-item">
              <span>
                Help <u>T</u>opics
              </span>
            </div>
            <div className="minesweeper-dropdown-divider" />
            <div className="minesweeper-dropdown-item">
              <span>
                <u>A</u>bout Minesweeper
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="minesweeper-body">
        <div className="minesweeper-header">
          <div className="minesweeper-display">{mineDisplay}</div>
          <div className="minesweeper-face" onClick={() => initGame()}>
            <div className={`minesweeper-face-icon face-${face}`} />
          </div>
          <div className="minesweeper-display">{timer.toString().padStart(3, '0')}</div>
        </div>
        <div
          className="minesweeper-grid"
          style={{ gridTemplateColumns: `repeat(${w}, var(--ms-cell-size, 16px))` }}
          onContextMenu={(e) => e.preventDefault()}
        >
          {board.flat().map((cell) => {
            const isPressed = pressedCell && pressedCell[0] === cell.x && pressedCell[1] === cell.y;
            const isChord = chordCells.some(([cx, cy]) => cx === cell.x && cy === cell.y);
            return (
              <div
                key={`${cell.x}-${cell.y}`}
                data-x={cell.x}
                data-y={cell.y}
                data-num={
                  cell.isRevealed && !cell.isMine && cell.neighborMines > 0
                    ? cell.neighborMines
                    : undefined
                }
                className={`${cellClass(cell, gameState)}${isPressed || isChord ? ' pressed' : ''}`}
                onMouseDown={(e) => handleCellMouseDown(e, cell.x, cell.y)}
              >
                {cell.isRevealed && !cell.isMine && cell.neighborMines > 0
                  ? cell.neighborMines
                  : ''}
              </div>
            );
          })}
        </div>
      </div>

      {winDialog.show && (
        <div className="minesweeper-dialog-overlay">
          <div className="minesweeper-dialog win98-dialog">
            <div className="minesweeper-dialog-title">You won!</div>
            <div className="minesweeper-dialog-body">
              <p>Time: {winDialog.time} seconds</p>
              {winDialog.rank > 0 ? (
                <>
                  <p>
                    You&apos;re rank <strong>#{winDialog.rank}</strong>! Enter your name to save:
                  </p>
                  <input
                    type="text"
                    className="minesweeper-dialog-input"
                    value={winName}
                    onChange={(e) => setWinName(e.target.value)}
                    placeholder="Your name"
                    maxLength={20}
                    autoFocus
                  />
                </>
              ) : (
                <p>You didn&apos;t make the top 10 this time. Keep practicing!</p>
              )}
            </div>
            <div className="minesweeper-dialog-buttons">
              <button
                type="button"
                className="minesweeper-dialog-btn"
                onClick={async () => {
                  if (winDialog.rank > 0) {
                    await addScore(
                      difficulty,
                      winName.trim(),
                      winDialog.time,
                      gameTokenRef.current,
                    );
                  }
                  setWinDialog((d) => ({ ...d, show: false }));
                }}
              >
                OK
              </button>
              {winDialog.rank > 0 && (
                <button
                  type="button"
                  className="minesweeper-dialog-btn"
                  onClick={() => setWinDialog((d) => ({ ...d, show: false }))}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showLeaderboard && leaderboardData && (
        <div className="minesweeper-dialog-overlay" onClick={() => setShowLeaderboard(false)}>
          <div
            className="minesweeper-dialog minesweeper-leaderboard-dialog win98-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="minesweeper-dialog-title">Best Times</div>
            <div className="minesweeper-dialog-body minesweeper-leaderboard-body">
              {(['beginner', 'intermediate', 'expert'] as DifficultyKey[]).map((diff) => (
                <div key={diff} className="minesweeper-leaderboard-section">
                  <div className="minesweeper-leaderboard-section-title">
                    {diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </div>
                  {leaderboardMetrics && (
                    <div className="minesweeper-leaderboard-metrics">
                      Attempts: {leaderboardMetrics[diff]?.attempts ?? 0} · Completed:{' '}
                      {leaderboardMetrics[diff]?.completed ?? 0} · Won:{' '}
                      {leaderboardMetrics[diff]?.won ?? 0}
                    </div>
                  )}
                  <table className="minesweeper-leaderboard-table">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Name</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboardData[diff].length === 0 ? (
                        <tr>
                          <td colSpan={3}>No scores yet</td>
                        </tr>
                      ) : (
                        leaderboardData[diff].map((entry, i) => (
                          <tr key={`${i}-${entry.time}-${entry.name}`}>
                            <td>{i + 1}</td>
                            <td>{entry.name}</td>
                            <td>{entry.time}s</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
            <div className="minesweeper-dialog-buttons">
              <button
                type="button"
                className="minesweeper-dialog-btn"
                onClick={() => setShowLeaderboard(false)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </AppWindow>
  );
}
