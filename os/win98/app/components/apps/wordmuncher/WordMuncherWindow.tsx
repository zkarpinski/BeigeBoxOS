import { useState, useEffect, useRef, useCallback } from 'react';
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
    name: "Short 'I' sound as in fish",
    correct: ['wish', 'hint', 'in', 'it', 'kill', 'since', 'crib', 'milk', 'fish', 'disk'],
    incorrect: ['bribe', 'rind', 'bide', 'pry', 'rise', 'bike', 'dine', 'quite', 'wide', 'glide'],
  },
  {
    name: "Short 'A' sound as in cat",
    correct: ['cat', 'bat', 'hat', 'mat', 'rat', 'sat', 'fat', 'pat', 'map', 'tap'],
    incorrect: ['cake', 'bake', 'hate', 'mate', 'rate', 'safe', 'fate', 'cape', 'tape', 'wave'],
  },
  {
    name: "Long 'E' sound as in bee",
    correct: ['see', 'bee', 'tree', 'me', 'we', 'he', 'she', 'free', 'flee', 'knee'],
    incorrect: ['say', 'day', 'may', 'play', 'way', 'my', 'by', 'fly', 'cry', 'try'],
  },
  {
    name: "Words ending in '-ing'",
    correct: ['ring', 'sing', 'king', 'wing', 'bring', 'thing', 'spring', 'string', 'swing', 'sting'],
    incorrect: ['rink', 'sink', 'kind', 'wine', 'brim', 'thin', 'sprout', 'strip', 'swim', 'step'],
  },
  {
    name: "Short 'O' sound as in top",
    correct: ['top', 'hop', 'pot', 'dog', 'fog', 'lot', 'not', 'hot', 'got', 'mop'],
    incorrect: ['tape', 'hope', 'pole', 'dome', 'foam', 'lone', 'note', 'home', 'goat', 'mope'],
  },
];

export function WordMuncherWindow() {
  const { apps } = useWindowManager();
  const appId = 'wordmuncher';
  const state = apps[appId];

  // Game State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [level, setLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);

  // Use a single position object + ref to avoid nested setState and stale closure issues
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
  const playerPosRef = useRef({ x: 0, y: 0 });
  const [board, setBoard] = useState<(CellItem | null)[][]>([]);
  const [troggles, setTroggles] = useState<Troggle[]>([]);

  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const gameContainerRef = useRef<HTMLDivElement>(null);

  // Keep ref in sync with state for use inside event handlers
  useEffect(() => {
    playerPosRef.current = playerPos;
  }, [playerPos]);

  const resetPlayerPos = useCallback(() => {
    const pos = { x: 0, y: 0 };
    playerPosRef.current = pos;
    setPlayerPos(pos);
  }, []);

  const initLevel = useCallback(
    (levelIdx: number) => {
      const category = CATEGORIES[levelIdx % CATEGORIES.length];

      const newBoard: (CellItem | null)[][] = Array(ROWS)
        .fill(null)
        .map(() => Array(COLUMNS).fill(null));

      const allWords = [
        ...category.correct.map((w) => ({ word: w, isCorrect: true })),
        ...category.incorrect.map((w) => ({ word: w, isCorrect: false })),
      ].sort(() => Math.random() - 0.5);

      let wordIdx = 0;
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLUMNS; c++) {
          if (Math.random() > 0.15 && wordIdx < allWords.length) {
            newBoard[r][c] = allWords[wordIdx++];
          }
        }
      }

      setBoard(newBoard);
      resetPlayerPos();

      const numTroggles = Math.min(Math.floor(levelIdx / CATEGORIES.length) + 1, 3);
      const newTroggles: Troggle[] = [];
      for (let i = 0; i < numTroggles; i++) {
        newTroggles.push({ x: COLUMNS - 1 - i, y: ROWS - 1 });
      }
      setTroggles(newTroggles);
    },
    [resetPlayerPos],
  );

  const loseLife = useCallback(() => {
    setLives((l) => {
      const newLives = l <= 1 ? 0 : l - 1;
      if (newLives <= 0) {
        setIsPlaying(false);
        setIsGameOver(true);
      }
      return newLives;
    });
    resetPlayerPos();
  }, [resetPlayerPos]);

  const startGame = () => {
    setIsPlaying(true);
    setIsGameOver(false);
    setScore(0);
    setLives(3);
    setLevel(0);
    initLevel(0);
    setTimeout(() => {
      if (gameContainerRef.current) {
        gameContainerRef.current.focus();
      }
    }, 50);
  };

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isPlaying) return;
      // Prevent key-repeat from skipping multiple squares when key is held
      if (e.repeat) return;

      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      const { x, y } = playerPosRef.current;

      if (e.key === 'ArrowUp') {
        const newY = Math.max(0, y - 1);
        if (newY !== y) {
          const pos = { x, y: newY };
          playerPosRef.current = pos;
          setPlayerPos(pos);
        }
      } else if (e.key === 'ArrowDown') {
        const newY = Math.min(ROWS - 1, y + 1);
        if (newY !== y) {
          const pos = { x, y: newY };
          playerPosRef.current = pos;
          setPlayerPos(pos);
        }
      } else if (e.key === 'ArrowLeft') {
        const newX = Math.max(0, x - 1);
        if (newX !== x) {
          const pos = { x: newX, y };
          playerPosRef.current = pos;
          setPlayerPos(pos);
        }
      } else if (e.key === 'ArrowRight') {
        const newX = Math.min(COLUMNS - 1, x + 1);
        if (newX !== x) {
          const pos = { x: newX, y };
          playerPosRef.current = pos;
          setPlayerPos(pos);
        }
      } else if (e.key === ' ') {
        setBoard((currentBoard) => {
          const { x: cx, y: cy } = playerPosRef.current;
          const cell = currentBoard[cy]?.[cx];
          if (cell) {
            if (cell.isCorrect) {
              setScore((s) => s + 10);
              const newBoard = currentBoard.map((row) => [...row]);
              newBoard[cy][cx] = null;

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
              loseLife();
            }
          }
          return currentBoard;
        });
      }
    },
    [isPlaying, initLevel, loseLife],
  );

  // Troggle movement
  useEffect(() => {
    if (!isPlaying) return;

    gameLoopRef.current = setInterval(
      () => {
        setTroggles((currentTroggles) => {
          return currentTroggles.map((t) => {
            const axis = Math.random() > 0.5 ? 'x' : 'y';
            const dir = Math.random() > 0.5 ? 1 : -1;
            let newX = t.x + (axis === 'x' ? dir : 0);
            let newY = t.y + (axis === 'y' ? dir : 0);
            newX = Math.max(0, Math.min(COLUMNS - 1, newX));
            newY = Math.max(0, Math.min(ROWS - 1, newY));
            return { x: newX, y: newY };
          });
        });
      },
      1000 - Math.min(level * 50, 500),
    );

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [isPlaying, level]);

  // Collision detection
  useEffect(() => {
    if (!isPlaying) return;
    const hit = troggles.some((t) => t.x === playerPos.x && t.y === playerPos.y);
    if (hit) loseLife();
  }, [playerPos, troggles, isPlaying, loseLife]);

  // Re-focus game container when window is focused
  useEffect(() => {
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
            <div className="wordmuncher-title">
              <span className="wm-title-word">WORD</span>
              <span className="wm-title-muncher">MUNCHER</span>
            </div>
            {isGameOver && (
              <div className="wordmuncher-gameover">
                <p>GAME OVER</p>
                <p className="wm-final-score">Final Score: {score}</p>
              </div>
            )}
            <button className="wordmuncher-btn" onClick={startGame}>
              {isGameOver ? 'PLAY AGAIN' : 'START GAME'}
            </button>
            <div className="wordmuncher-instructions">
              <p>Arrow Keys to move &nbsp;|&nbsp; Spacebar to munch</p>
              <p>Eat only the correct words for the category.</p>
              <p>Avoid the Troggles!</p>
            </div>
          </div>
        ) : (
          <div className="wordmuncher-game">
            <div className="wordmuncher-header">
              <div className="wordmuncher-stat">Level: {level + 1}</div>
              <div className="wordmuncher-rule">{currentCategory.name}</div>
              <div className="wordmuncher-stat">Score: {score}</div>
              <div className="wordmuncher-lives">
                {Array(lives)
                  .fill(null)
                  .map((_, i) => (
                    <span key={i} className="wm-life-icon" />
                  ))}
              </div>
            </div>

            <div className="wordmuncher-board">
              {Array(ROWS)
                .fill(null)
                .map((_, r) => (
                  <div key={`row-${r}`} className="wordmuncher-row">
                    {Array(COLUMNS)
                      .fill(null)
                      .map((_, c) => {
                        const isPlayerHere = playerPos.x === c && playerPos.y === r;
                        const isTroggleHere = troggles.some((t) => t.x === c && t.y === r);
                        const cell = board[r]?.[c];

                        return (
                          <div
                            key={`cell-${r}-${c}`}
                            className={`wordmuncher-cell ${isPlayerHere ? 'player' : ''} ${isTroggleHere ? 'troggle' : ''}`}
                          >
                            {cell ? <div className="wordmuncher-word">{cell.word}</div> : null}
                            {isPlayerHere && <div className="wordmuncher-player-sprite" />}
                            {isTroggleHere && !isPlayerHere && (
                              <div className="wordmuncher-troggle-sprite" />
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
