'use client';

import React from 'react';
import type { Cell } from '../logic/MinesweeperLogic';
import type { GameState } from '../logic/MinesweeperLogic';
import { cellClass } from '../logic/MinesweeperLogic';

type Props = {
  mineDisplay: string;
  timerDisplay: string;
  face: 'smile' | 'surprise' | 'dead' | 'win';
  board: Cell[][];
  gameState: GameState;
  gridW: number;
  pressedCell: [number, number] | null;
  chordCells: [number, number][];
  onFaceClick: () => void;
  onCellMouseDown: (e: React.MouseEvent, x: number, y: number) => void;
};

export function MinesweeperGameBody({
  mineDisplay,
  timerDisplay,
  face,
  board,
  gameState,
  gridW,
  pressedCell,
  chordCells,
  onFaceClick,
  onCellMouseDown,
}: Props) {
  return (
    <div className="minesweeper-body">
      <div className="minesweeper-header">
        <div className="minesweeper-display">{mineDisplay}</div>
        <div className="minesweeper-face" onClick={onFaceClick}>
          <div className={`minesweeper-face-icon face-${face}`} />
        </div>
        <div className="minesweeper-display">{timerDisplay}</div>
      </div>
      <div
        className="minesweeper-grid"
        style={{ gridTemplateColumns: `repeat(${gridW}, var(--ms-cell-size, 16px))` }}
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
              onMouseDown={(e) => onCellMouseDown(e, cell.x, cell.y)}
            >
              {cell.isRevealed && !cell.isMine && cell.neighborMines > 0 ? cell.neighborMines : ''}
            </div>
          );
        })}
      </div>
    </div>
  );
}
