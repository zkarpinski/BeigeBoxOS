import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useWindowManager } from '@retro-web/core/context';
import { AppWindow, TitleBar } from '../../win98';

const COLUMNS = 6;
const ROWS = 5;

type CellItem = {
  word: string;
  isCorrect: boolean;
};

type Troggle = {
  x: number;
  y: number;
};

const CATEGORIES = [
  {
    name: "Words with short 'A' sound",
    correct: ['CAT', 'BAT', 'HAT', 'MAT', 'RAT', 'SAT', 'FAT', 'PAT', 'MAP', 'TAP'],
    incorrect: ['COT', 'BUT', 'HIT', 'HOT', 'MUT', 'BIT', 'TOP', 'POT', 'MOP', 'PET'],
  },
  {
    name: "Words with long 'E' sound",
    correct: ['SEE', 'BEE', 'TREE', 'ME', 'WE', 'HE', 'SHE', 'FREE', 'FLEE', 'THREE'],
    incorrect: ['SAY', 'DAY', 'MAY', 'PLAY', 'WAY', 'MY', 'BY', 'FLY', 'CRY', 'TRY'],
  },
  {
    name: "Words with 'OO' sound",
    correct: ['MOON', 'SOON', 'NOON', 'SPOON', 'BOOM', 'ROOM', 'BROOM', 'ZOOM', 'LOOT', 'BOOT'],
    incorrect: ['MAN', 'SUN', 'NONE', 'SPUN', 'BAM', 'RAM', 'BRIM', 'ZIP', 'LOT', 'BAT'],
  },
];

export function WordMuncherWindow() {
  const { apps, focusApp, hideApp, minimizeApp } = useWindowManager();
  const appId = 'wordmuncher';
  const state = apps[appId];

  // Game State
  const [isPlaying, setIsPlaying] = useState(false);
  const [level, setLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);

  // Board State
  const [playerX, setPlayerX] = useState(0);
  const [playerY, setPlayerY] = useState(0);
  const [board, setBoard] = useState<(CellItem | null)[][]>([]);
  const [troggles, setTroggles] = useState<Troggle[]>([]);

  // Refs for loop
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  // Focus ref for keyboard input
  const gameContainerRef = useRef<HTMLDivElement>(null);

  const initLevel = useCallback((levelIdx: number) => {
    const category = CATEGORIES[levelIdx % CATEGORIES.length];

    // Generate board
    const newBoard: (CellItem | null)[][] = Array(ROWS)
      .fill(null)
      .map(() => Array(COLUMNS).fill(null));

    // Fill board with words
    const allWords = [
      ...category.correct.map((w) => ({ word: w, isCorrect: true })),
      ...category.incorrect.map((w) => ({ word: w, isCorrect: false })),
    ].sort(() => Math.random() - 0.5);

    let wordIdx = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLUMNS; c++) {
        // Leave some empty spaces, maybe 20%
        if (Math.random() > 0.2 && wordIdx < allWords.length) {
          newBoard[r][c] = allWords[wordIdx++];
        }
      }
    }

    setBoard(newBoard);
    setPlayerX(0);
    setPlayerY(0);

    // Add 1 troggle per level up to 3
    const numTroggles = Math.min((levelIdx % CATEGORIES.length) + 1, 3);
    const newTroggles: Troggle[] = [];
    for (let i = 0; i < numTroggles; i++) {
      // Spawn at bottom right
      newTroggles.push({ x: COLUMNS - 1 - i, y: ROWS - 1 });
    }
    setTroggles(newTroggles);
  }, []);

  const startGame = () => {
    setIsPlaying(true);
    setScore(0);
    setLives(3);
    setLevel(0);
    initLevel(0);
    if (gameContainerRef.current) {
      gameContainerRef.current.focus();
    }
  };

  const loseLife = useCallback(() => {
    setLives((l) => {
      if (l <= 1) {
        return 0;
      }
      return l - 1;
    });

    // Check if we lost the game
    if (lives <= 1) {
      setIsPlaying(false);
    }

    // Reset player position
    setPlayerX(0);
    setPlayerY(0);
  }, [lives]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isPlaying) return;

      // Prevent default scrolling for arrow keys and space
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      setPlayerX((x) => {
        setPlayerY((y) => {
          let newX = x;
          let newY = y;

          if (e.key === 'ArrowUp') newY = Math.max(0, y - 1);
          if (e.key === 'ArrowDown') newY = Math.min(ROWS - 1, y + 1);
          if (e.key === 'ArrowLeft') newX = Math.max(0, x - 1);
          if (e.key === 'ArrowRight') newX = Math.min(COLUMNS - 1, x + 1);

          if (e.key === ' ') {
            // Munch!
            setBoard((currentBoard) => {
              const cell = currentBoard[y][x];
              if (cell) {
                if (cell.isCorrect) {
                  setScore((s) => s + 10);
                  const newBoard = [...currentBoard];
                  newBoard[y] = [...newBoard[y]];
                  newBoard[y][x] = null;

                  // Check win condition (no correct words left)
                  const hasCorrectLeft = newBoard.some((row) => row.some((c) => c && c.isCorrect));
                  if (!hasCorrectLeft) {
                    setTimeout(() => {
                      setLevel((l) => {
                        const nextLevel = l + 1;
                        initLevel(nextLevel);
                        return nextLevel;
                      });
                    }, 500);
                  }

                  return newBoard;
                } else {
                  // Wrong munch
                  loseLife();
                }
              }
              return currentBoard;
            });
          }

          return newY;
        });
        return e.key === 'ArrowLeft'
          ? Math.max(0, x - 1)
          : e.key === 'ArrowRight'
            ? Math.min(COLUMNS - 1, x + 1)
            : x;
      });
    },
    [isPlaying, initLevel, loseLife],
  );

  // Handle troggle movement
  useEffect(() => {
    if (!isPlaying) return;

    gameLoopRef.current = setInterval(
      () => {
        setTroggles((currentTroggles) => {
          return currentTroggles.map((t) => {
            // Move randomly towards player sometimes, or random
            let dx = 0;
            let dy = 0;

            if (Math.random() > 0.5) {
              // Random
              const axis = Math.random() > 0.5 ? 'x' : 'y';
              const dir = Math.random() > 0.5 ? 1 : -1;
              if (axis === 'x') dx = dir;
              else dy = dir;
            } else {
              // Towards player (read directly from state by capturing it or we rely on a ref,
              // but for simplicity we'll just read the current state variables which will be stale,
              // so we should use a ref or functional update)
            }
            // Simple random for now to avoid stale closures
            const axis = Math.random() > 0.5 ? 'x' : 'y';
            const dir = Math.random() > 0.5 ? 1 : -1;
            if (axis === 'x') dx = dir;
            else dy = dir;

            let newX = t.x + dx;
            let newY = t.y + dy;

            newX = Math.max(0, Math.min(COLUMNS - 1, newX));
            newY = Math.max(0, Math.min(ROWS - 1, newY));

            return { x: newX, y: newY };
          });
        });
      },
      1000 - Math.min(level * 50, 500),
    ); // Speed up as level increases

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [isPlaying, level]);

  // Check collision
  useEffect(() => {
    if (!isPlaying) return;
    const hit = troggles.some((t) => t.x === playerX && t.y === playerY);
    if (hit) {
      loseLife();
    }
  }, [playerX, playerY, troggles, isPlaying, loseLife]);

  // Ensure focus
  useEffect(() => {
    // We consider the app "focused" if its zIndex is Z_FOCUSED (which is 11)
    const isFocused = state?.zIndex === 11;
    if (isFocused && isPlaying && gameContainerRef.current) {
      gameContainerRef.current.focus();
    }
  }, [state?.zIndex, isPlaying]);

  if (!state || !state.visible) return null;

  const currentCategory = CATEGORIES[level % CATEGORIES.length];

  return (
    <AppWindow
      id={`${appId}-window`}
      appId={appId}
      className={`app-window wordmuncher-window ${state.minimized ? 'minimized' : ''} windowed`}
      titleBar={
        <TitleBar title="Word Muncher" icon={<img src="/apps/wordmuncher/icon.png" alt="" />} />
      }
      allowResize={false}
      getCanDrag={() => true}
    >
      <div
        className="wordmuncher-container"
        tabIndex={0}
        ref={gameContainerRef}
        onKeyDown={handleKeyDown}
      >
        {!isPlaying ? (
          <div className="wordmuncher-menu">
            <h1 className="wordmuncher-title">WORD MUNCHER</h1>
            <button className="wordmuncher-btn" onClick={startGame}>
              Start Game
            </button>
            <div className="wordmuncher-instructions">
              <p>Use Arrow Keys to move.</p>
              <p>Press Spacebar to munch words!</p>
              <p>Munch only the correct words for the current category.</p>
              <p>Avoid the Troggles!</p>
            </div>
          </div>
        ) : (
          <div className="wordmuncher-game">
            <div className="wordmuncher-header">
              <div className="wordmuncher-stat">Score: {score}</div>
              <div className="wordmuncher-rule">Find: {currentCategory.name}</div>
              <div className="wordmuncher-stat">Lives: {lives}</div>
            </div>

            <div className="wordmuncher-board">
              {Array(ROWS)
                .fill(null)
                .map((_, r) => (
                  <div key={`row-${r}`} className="wordmuncher-row">
                    {Array(COLUMNS)
                      .fill(null)
                      .map((_, c) => {
                        const isPlayerHere = playerX === c && playerY === r;
                        const isTroggleHere = troggles.some((t) => t.x === c && t.y === r);
                        const cell = board[r]?.[c];

                        return (
                          <div
                            key={`cell-${r}-${c}`}
                            className={`wordmuncher-cell ${isPlayerHere ? 'player' : ''} ${isTroggleHere ? 'troggle' : ''}`}
                          >
                            {cell ? <div className="wordmuncher-word">{cell.word}</div> : null}
                            {isPlayerHere && <div className="wordmuncher-player-sprite">M</div>}
                            {isTroggleHere && !isPlayerHere && (
                              <div className="wordmuncher-troggle-sprite">T</div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </AppWindow>
  );
}
