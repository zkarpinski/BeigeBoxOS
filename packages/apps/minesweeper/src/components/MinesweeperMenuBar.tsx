'use client';

import React, { useCallback, useState } from 'react';
import type { DifficultyKey } from '../logic/MinesweeperLogic';
import { getAllLeaderboards, fetchLeaderboard } from '../leaderboard/leaderboard';
import type { LeaderboardData, LeaderboardMetrics } from '../leaderboard/leaderboard';

type Props = {
  difficulty: DifficultyKey;
  useMarks: boolean;
  onNewGame: () => void;
  onChangeDiff: (d: DifficultyKey) => void;
  onToggleMarks: () => void;
  onExit: () => void;
  onOpenLeaderboard: (data: LeaderboardData, metrics: LeaderboardMetrics | null) => void;
};

/** After a dropdown action, hide menus until the pointer leaves the bar (hover-only CSS would keep them open). */
export function MinesweeperMenuBar({
  difficulty,
  useMarks,
  onNewGame,
  onChangeDiff,
  onToggleMarks,
  onExit,
  onOpenLeaderboard,
}: Props) {
  const [menusDismissed, setMenusDismissed] = useState(false);

  const dismissMenus = useCallback(() => setMenusDismissed(true), []);

  return (
    <div
      className={`minesweeper-menu-bar${menusDismissed ? ' minesweeper-menus-dismissed' : ''}`}
      onMouseLeave={() => setMenusDismissed(false)}
    >
      <div className="minesweeper-menu-item">
        <u>G</u>ame
        <div className="minesweeper-menu-dropdown">
          <div
            className="minesweeper-dropdown-item"
            onClick={() => {
              dismissMenus();
              onNewGame();
            }}
          >
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
              onClick={() => {
                dismissMenus();
                onChangeDiff(d);
              }}
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
              dismissMenus();
              const result = await fetchLeaderboard();
              onOpenLeaderboard(result?.data ?? getAllLeaderboards(), result?.metrics ?? null);
            }}
          >
            <span>
              Best T<u>i</u>mes...
            </span>
          </div>
          <div className="minesweeper-dropdown-divider" />
          <div
            className={`minesweeper-dropdown-item${useMarks ? ' checked' : ''}`}
            onClick={() => {
              dismissMenus();
              onToggleMarks();
            }}
          >
            <span>
              <u>M</u>arks (?)
            </span>
          </div>
          <div className="minesweeper-dropdown-divider" />
          <div
            className="minesweeper-dropdown-item"
            onClick={() => {
              dismissMenus();
              onExit();
            }}
          >
            <span>
              E<u>x</u>it
            </span>
          </div>
        </div>
      </div>
      <div className="minesweeper-menu-item">
        <u>H</u>elp
        <div className="minesweeper-menu-dropdown">
          <div className="minesweeper-dropdown-item" onClick={dismissMenus}>
            <span>
              Help <u>T</u>opics
            </span>
          </div>
          <div className="minesweeper-dropdown-divider" />
          <div className="minesweeper-dropdown-item" onClick={dismissMenus}>
            <span>
              <u>A</u>bout Minesweeper
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
