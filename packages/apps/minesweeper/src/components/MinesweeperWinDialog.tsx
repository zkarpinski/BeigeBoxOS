'use client';

import React from 'react';
import type { DifficultyKey } from '../logic/MinesweeperLogic';
import { addScore } from '../leaderboard/leaderboard';

type Props = {
  open: boolean;
  time: number;
  rank: number;
  winName: string;
  onWinNameChange: (v: string) => void;
  difficulty: DifficultyKey;
  gameTokenRef: React.MutableRefObject<string | null>;
  onClose: () => void;
};

export function MinesweeperWinDialog({
  open,
  time,
  rank,
  winName,
  onWinNameChange,
  difficulty,
  gameTokenRef,
  onClose,
}: Props) {
  if (!open) return null;

  async function handleOk() {
    if (rank > 0) {
      await addScore(difficulty, winName.trim(), time, gameTokenRef.current);
    }
    onClose();
  }

  return (
    <div className="minesweeper-dialog-overlay">
      <div className="minesweeper-dialog win98-dialog">
        <div className="minesweeper-dialog-title">You won!</div>
        <div className="minesweeper-dialog-body">
          <p>Time: {time} seconds</p>
          {rank > 0 ? (
            <>
              <p>
                You&apos;re rank <strong>#{rank}</strong>! Enter your name to save:
              </p>
              <input
                type="text"
                className="minesweeper-dialog-input"
                value={winName}
                onChange={(e) => onWinNameChange(e.target.value)}
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
          <button type="button" className="minesweeper-dialog-btn" onClick={handleOk}>
            OK
          </button>
          {rank > 0 && (
            <button type="button" className="minesweeper-dialog-btn" onClick={onClose}>
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
