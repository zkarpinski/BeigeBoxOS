'use client';

/**
 * Minesweeper window: game UI + shell chrome via {@link useOsShell}.
 * Skins: pass `skin` and import matching CSS from `@retro-web/app-minesweeper/themes/*`
 * (see `MinesweeperSkin`). The root sets `[data-minesweeper-skin]` for theme overrides.
 */
import React from 'react';
import type { AppConfig } from '@retro-web/core';
import { useOsShell } from '@retro-web/core/context';
import { useCloseApp } from '@retro-web/core';
import { useMinesweeperGame } from './useMinesweeperGame';
import { MinesweeperMenuBar } from './components/MinesweeperMenuBar';
import { MinesweeperGameBody } from './components/MinesweeperGameBody';
import { MinesweeperWinDialog } from './components/MinesweeperWinDialog';
import { MinesweeperLeaderboardDialog } from './components/MinesweeperLeaderboardDialog';

export const MINESWEEPER_ICON_SRC = 'apps/minesweeper/minesweeper-icon.png';

/** Match imported theme CSS (`themes/win98.css`, `themes/karpos.css`, …). */
export type MinesweeperSkin = 'win98' | 'karpos' | (string & {});

export const minesweeperAppConfig: AppConfig = {
  id: 'minesweeper',
  label: 'Minesweeper',
  icon: MINESWEEPER_ICON_SRC,
  desktop: true,
  startMenu: { path: ['Programs', 'Games'] },
  taskbarLabel: 'Minesweeper',
};

export type MinesweeperWindowProps = {
  /** Default `win98`. Must match imported theme CSS. */
  skin?: MinesweeperSkin;
};

export function MinesweeperWindow({ skin = 'win98' }: MinesweeperWindowProps) {
  const { AppWindow, TitleBar } = useOsShell();
  const closeApp = useCloseApp('minesweeper');
  const g = useMinesweeperGame();

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
      <div data-minesweeper-skin={skin} className="minesweeper-app">
        <MinesweeperMenuBar
          difficulty={g.difficulty}
          useMarks={g.useMarks}
          onNewGame={() => g.initGame()}
          onChangeDiff={g.changeDiff}
          onToggleMarks={() => g.setUseMarks((m) => !m)}
          onExit={closeApp}
          onOpenLeaderboard={(data, metrics) => {
            g.setLeaderboardData(data);
            g.setLeaderboardMetrics(metrics);
            g.setShowLeaderboard(true);
          }}
        />
        <MinesweeperGameBody
          mineDisplay={g.mineDisplay}
          timerDisplay={g.timer.toString().padStart(3, '0')}
          face={g.face}
          board={g.board}
          gameState={g.gameState}
          gridW={g.gridW}
          pressedCell={g.pressedCell}
          chordCells={g.chordCells}
          onFaceClick={() => g.initGame()}
          onCellMouseDown={g.handleCellMouseDown}
        />
      </div>

      <MinesweeperWinDialog
        open={g.winDialog.show}
        time={g.winDialog.time}
        rank={g.winDialog.rank}
        winName={g.winName}
        onWinNameChange={g.setWinName}
        difficulty={g.difficulty}
        gameTokenRef={g.gameTokenRef}
        onClose={() => g.setWinDialog((d) => ({ ...d, show: false }))}
      />

      {g.showLeaderboard && g.leaderboardData && (
        <MinesweeperLeaderboardDialog
          data={g.leaderboardData}
          metrics={g.leaderboardMetrics}
          onClose={() => g.setShowLeaderboard(false)}
        />
      )}
    </AppWindow>
  );
}
