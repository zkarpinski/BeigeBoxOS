'use client';

import React from 'react';
import type { DifficultyKey } from '../logic/MinesweeperLogic';
import type { LeaderboardData, LeaderboardMetrics } from '../leaderboard/leaderboard';

type Props = {
  data: LeaderboardData;
  metrics: LeaderboardMetrics | null;
  onClose: () => void;
};

export function MinesweeperLeaderboardDialog({ data, metrics, onClose }: Props) {
  return (
    <div className="minesweeper-dialog-overlay" onClick={onClose}>
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
              {metrics && (
                <div className="minesweeper-leaderboard-metrics">
                  Attempts: {metrics[diff]?.attempts ?? 0} · Completed:{' '}
                  {metrics[diff]?.completed ?? 0} · Won: {metrics[diff]?.won ?? 0}
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
                  {data[diff].length === 0 ? (
                    <tr>
                      <td colSpan={3}>No scores yet</td>
                    </tr>
                  ) : (
                    data[diff].map((entry, i) => (
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
          <button type="button" className="minesweeper-dialog-btn" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
