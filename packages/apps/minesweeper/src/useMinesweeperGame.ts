'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  type Cell,
  type DifficultyKey,
  type GameState,
  DIFFICULTIES,
  makeBoard,
  getNeighbors,
  placeMines,
  floodReveal,
  checkWin,
} from './logic/MinesweeperLogic';
import {
  getRank,
  getRankFromData,
  fetchLeaderboard,
  requestStartToken,
  reportGameEnded,
  type LeaderboardData,
  type LeaderboardMetrics,
} from './leaderboard/leaderboard';

export function useMinesweeperGame() {
  const [difficulty, setDiff] = useState<DifficultyKey>('beginner');
  const [board, setBoard] = useState<Cell[][]>(() => makeBoard(9, 9));
  const [gameState, setGS] = useState<GameState>('ready');
  const [flags, setFlags] = useState(0);
  const [timer, setTimer] = useState(0);
  const [face, setFace] = useState<'smile' | 'surprise' | 'dead' | 'win'>('smile');
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
  const lastLostRef = useRef(false);
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

  const initGame = useCallback(
    (diff: DifficultyKey = diffRef.current) => {
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
    },
    [stopTimer],
  );

  const changeDiff = useCallback(
    (d: DifficultyKey) => {
      setDiff(d);
      initGame(d);
    },
    [initGame],
  );

  useEffect(() => () => stopTimer(), [stopTimer]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'F2') initGame();
    };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [initGame]);

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

  return {
    difficulty,
    board,
    gameState,
    flags,
    timer,
    face,
    useMarks,
    pressedCell,
    chordCells,
    winDialog,
    setWinDialog,
    winName,
    setWinName,
    showLeaderboard,
    setShowLeaderboard,
    leaderboardData,
    setLeaderboardData,
    leaderboardMetrics,
    setLeaderboardMetrics,
    initGame,
    changeDiff,
    setUseMarks,
    handleCellMouseDown,
    mineDisplay,
    gridW: w,
    gridH: h,
    gameTokenRef,
  };
}
