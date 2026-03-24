/**
 * Pure Minesweeper game logic. Exported for unit testing.
 */

export type DifficultyKey = 'beginner' | 'intermediate' | 'expert';

export const DIFFICULTIES: Record<DifficultyKey, { w: number; h: number; mines: number }> = {
  beginner: { w: 9, h: 9, mines: 10 },
  intermediate: { w: 16, h: 16, mines: 40 },
  expert: { w: 30, h: 16, mines: 99 },
};

export interface Cell {
  x: number;
  y: number;
  isMine: boolean;
  isRevealed: boolean;
  flagState: 0 | 1 | 2;
  neighborMines: number;
}

export type GameState = 'ready' | 'playing' | 'won' | 'lost';

export function makeBoard(w: number, h: number): Cell[][] {
  return Array.from({ length: h }, (_, y) =>
    Array.from(
      { length: w },
      (_, x): Cell => ({
        x,
        y,
        isMine: false,
        isRevealed: false,
        flagState: 0,
        neighborMines: 0,
      }),
    ),
  );
}

export function getNeighbors(x: number, y: number, w: number, h: number): [number, number][] {
  const out: [number, number][] = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx,
        ny = y + dy;
      if (nx >= 0 && nx < w && ny >= 0 && ny < h) out.push([nx, ny]);
    }
  }
  return out;
}

export function placeMines(
  board: Cell[][],
  safeX: number,
  safeY: number,
  mines: number,
  w: number,
  h: number,
): Cell[][] {
  const b = board.map((r) => r.map((c) => ({ ...c })));
  let n = 0;
  while (n < mines) {
    const x = Math.floor(Math.random() * w),
      y = Math.floor(Math.random() * h);
    if (Math.abs(x - safeX) <= 1 && Math.abs(y - safeY) <= 1) continue;
    if (!b[y][x].isMine) {
      b[y][x].isMine = true;
      n++;
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!b[y][x].isMine)
        b[y][x].neighborMines = getNeighbors(x, y, w, h).filter(
          ([nx, ny]) => b[ny][nx].isMine,
        ).length;
    }
  }
  return b;
}

export function floodReveal(board: Cell[][], x: number, y: number, w: number, h: number): Cell[][] {
  const b = board.map((r) => r.map((c) => ({ ...c })));
  const stack: [number, number][] = [[x, y]];
  while (stack.length) {
    const [cx, cy] = stack.pop()!;
    const cell = b[cy][cx];
    if (cell.isRevealed || cell.flagState === 1) continue;
    cell.isRevealed = true;
    if (cell.flagState === 2) cell.flagState = 0;
    if (!cell.isMine && cell.neighborMines === 0) {
      stack.push(...getNeighbors(cx, cy, w, h));
    }
  }
  return b;
}

export function cellClass(cell: Cell, gs: GameState): string {
  const c = ['ms-cell'];
  if (cell.isRevealed) {
    c.push('revealed');
    if (cell.isMine) c.push('mine-red');
  } else {
    if (cell.flagState === 1 && !(gs === 'lost' && cell.isMine)) c.push('flag');
    else if (cell.flagState === 2) c.push('question');
    if (gs === 'lost' && cell.isMine) c.push('mine');
    if (gs === 'lost' && !cell.isMine && cell.flagState === 1) c.push('mine-cross');
    if (gs === 'won' && cell.isMine && cell.flagState !== 1) c.push('flag');
  }
  return c.join(' ');
}

export function revealedCount(b: Cell[][]): number {
  return b.flat().filter((c) => c.isRevealed).length;
}

export function checkWin(b: Cell[][], diff: DifficultyKey): boolean {
  const { w, h, mines } = DIFFICULTIES[diff];
  return revealedCount(b) === w * h - mines;
}
