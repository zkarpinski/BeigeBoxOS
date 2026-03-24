/**
 * Unit tests for Minesweeper game logic.
 */
import {
  makeBoard,
  getNeighbors,
  placeMines,
  floodReveal,
  cellClass,
  DIFFICULTIES,
  revealedCount,
  checkWin,
  type Cell,
} from './MinesweeperLogic';

describe('MinesweeperLogic', () => {
  describe('DIFFICULTIES', () => {
    test('beginner has 9x9 grid and 10 mines', () => {
      expect(DIFFICULTIES.beginner).toEqual({ w: 9, h: 9, mines: 10 });
    });
    test('intermediate has 16x16 grid and 40 mines', () => {
      expect(DIFFICULTIES.intermediate).toEqual({ w: 16, h: 16, mines: 40 });
    });
    test('expert has 30x16 grid and 99 mines', () => {
      expect(DIFFICULTIES.expert).toEqual({ w: 30, h: 16, mines: 99 });
    });
  });

  describe('makeBoard', () => {
    test('returns grid of correct dimensions', () => {
      const board = makeBoard(9, 9);
      expect(board.length).toBe(9);
      expect(board.every((row) => row.length === 9)).toBe(true);
    });
    test('all cells start unrevealed, no mines, no flags', () => {
      const board = makeBoard(5, 5);
      for (const row of board) {
        for (const cell of row) {
          expect(cell.isMine).toBe(false);
          expect(cell.isRevealed).toBe(false);
          expect(cell.flagState).toBe(0);
          expect(cell.neighborMines).toBe(0);
        }
      }
    });
    test('each cell has correct x,y', () => {
      const board = makeBoard(3, 2);
      expect(board[0][0]).toMatchObject({ x: 0, y: 0 });
      expect(board[0][2]).toMatchObject({ x: 2, y: 0 });
      expect(board[1][1]).toMatchObject({ x: 1, y: 1 });
    });
  });

  describe('getNeighbors', () => {
    test('center cell in 3x3 has 8 neighbors', () => {
      const n = getNeighbors(1, 1, 3, 3);
      expect(n).toHaveLength(8);
      expect(n).toContainEqual([0, 0]);
      expect(n).toContainEqual([2, 2]);
    });
    test('corner (0,0) has 3 neighbors', () => {
      const n = getNeighbors(0, 0, 9, 9);
      expect(n).toHaveLength(3);
      expect(n).toContainEqual([1, 0]);
      expect(n).toContainEqual([0, 1]);
      expect(n).toContainEqual([1, 1]);
    });
    test('edge (0,1) in 3x3 has 5 neighbors', () => {
      const n = getNeighbors(0, 1, 3, 3);
      expect(n).toHaveLength(5);
    });
    test('single cell grid returns empty', () => {
      const n = getNeighbors(0, 0, 1, 1);
      expect(n).toHaveLength(0);
    });
  });

  describe('placeMines', () => {
    test('places exactly the requested number of mines', () => {
      const board = makeBoard(9, 9);
      const result = placeMines(board, 4, 4, 10, 9, 9);
      const mineCount = result.flat().filter((c) => c.isMine).length;
      expect(mineCount).toBe(10);
    });
    test('safe cell and its 3x3 neighborhood never have mines', () => {
      const board = makeBoard(9, 9);
      const safeX = 4,
        safeY = 4;
      const result = placeMines(board, safeX, safeY, 10, 9, 9);
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const x = safeX + dx,
            y = safeY + dy;
          expect(result[y][x].isMine).toBe(false);
        }
      }
    });
    test('neighbor counts are correct for non-mine cells after placement', () => {
      const board = makeBoard(5, 5);
      const result = placeMines(board, 2, 2, 5, 5, 5);
      for (const row of result) {
        for (const cell of row) {
          if (cell.isMine) continue;
          const neighbors = getNeighbors(cell.x, cell.y, 5, 5);
          const expectedMines = neighbors.filter(([nx, ny]) => result[ny][nx].isMine).length;
          expect(cell.neighborMines).toBe(expectedMines);
        }
      }
    });
  });

  describe('floodReveal', () => {
    test('reveals single cell when it has no empty neighbors', () => {
      const board = makeBoard(3, 3);
      board[1][1].neighborMines = 2;
      const result = floodReveal(board, 1, 1, 3, 3);
      expect(result[1][1].isRevealed).toBe(true);
      expect(revealedCount(result)).toBe(1);
    });
    test('reveals connected region of zero-neighbor cells', () => {
      const board = makeBoard(3, 3);
      board[0][0].neighborMines = 0;
      board[0][1].neighborMines = 0;
      board[1][0].neighborMines = 0;
      board[1][1].neighborMines = 0;
      const result = floodReveal(board, 0, 0, 3, 3);
      expect(result[0][0].isRevealed).toBe(true);
      expect(result[0][1].isRevealed).toBe(true);
      expect(result[1][0].isRevealed).toBe(true);
      expect(result[1][1].isRevealed).toBe(true);
    });
    test('does not reveal flagged cells', () => {
      const board = makeBoard(2, 2);
      board[0][0].flagState = 1;
      const result = floodReveal(board, 0, 0, 2, 2);
      expect(result[0][0].isRevealed).toBe(false);
      expect(result[0][0].flagState).toBe(1);
    });
    test('clears question mark when revealing', () => {
      const board = makeBoard(2, 2);
      board[0][0].flagState = 2;
      const result = floodReveal(board, 0, 0, 2, 2);
      expect(result[0][0].isRevealed).toBe(true);
      expect(result[0][0].flagState).toBe(0);
    });
  });

  describe('cellClass', () => {
    const baseCell: Cell = {
      x: 0,
      y: 0,
      isMine: false,
      isRevealed: false,
      flagState: 0,
      neighborMines: 0,
    };

    test('unrevealed cell has ms-cell only', () => {
      expect(cellClass(baseCell, 'ready')).toBe('ms-cell');
    });
    test('unrevealed with flag has flag class', () => {
      expect(cellClass({ ...baseCell, flagState: 1 }, 'ready')).toContain('flag');
    });
    test('unrevealed with question has question class', () => {
      expect(cellClass({ ...baseCell, flagState: 2 }, 'ready')).toContain('question');
    });
    test('revealed non-mine has revealed', () => {
      expect(cellClass({ ...baseCell, isRevealed: true }, 'playing')).toContain('revealed');
    });
    test('revealed mine has revealed and mine-red', () => {
      const c = cellClass({ ...baseCell, isRevealed: true, isMine: true }, 'lost');
      expect(c).toContain('revealed');
      expect(c).toContain('mine-red');
    });
    test('lost game: unrevealed mine shows mine class', () => {
      expect(cellClass({ ...baseCell, isMine: true }, 'lost')).toContain('mine');
    });
    test('lost game: wrong flag shows mine-cross', () => {
      expect(cellClass({ ...baseCell, flagState: 1 }, 'lost')).toContain('mine-cross');
    });
    test('won game: unrevealed mine shows flag', () => {
      expect(cellClass({ ...baseCell, isMine: true }, 'won')).toContain('flag');
    });
  });

  describe('revealedCount', () => {
    test('returns 0 for fresh board', () => {
      const board = makeBoard(9, 9);
      expect(revealedCount(board)).toBe(0);
    });
    test('returns correct count after some reveals', () => {
      const board = makeBoard(3, 3);
      board[0][0].isRevealed = true;
      board[1][1].isRevealed = true;
      expect(revealedCount(board)).toBe(2);
    });
  });

  describe('checkWin', () => {
    test('beginner: win when all non-mine cells revealed', () => {
      const board = makeBoard(9, 9);
      let count = 0;
      for (const row of board) {
        for (const cell of row) {
          if (count < 9 * 9 - 10) {
            cell.isRevealed = true;
            count++;
          }
        }
      }
      expect(checkWin(board, 'beginner')).toBe(true);
    });
    test('beginner: not win when fewer revealed', () => {
      const board = makeBoard(9, 9);
      board[0][0].isRevealed = true;
      expect(checkWin(board, 'beginner')).toBe(false);
    });
    test('expert: win condition uses 30*16 - 99 cells', () => {
      const board = makeBoard(30, 16);
      const toReveal = 30 * 16 - 99;
      let n = 0;
      for (const row of board) {
        for (const cell of row) {
          if (n < toReveal) {
            cell.isRevealed = true;
            n++;
          }
        }
      }
      expect(checkWin(board, 'expert')).toBe(true);
    });
  });
});
