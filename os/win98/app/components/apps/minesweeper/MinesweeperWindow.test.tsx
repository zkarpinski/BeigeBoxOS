/**
 * Unit tests for MinesweeperWindow component (including leaderboard UI).
 */
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MinesweeperWindow, minesweeperAppConfig } from './MinesweeperWindow';
import { WindowManagerProvider } from '@retro-web/core/context';
import { addScore } from './leaderboard';

const STORAGE_KEY = 'minesweeper-leaderboard';

function renderMinesweeper() {
  return render(
    <WindowManagerProvider registry={[minesweeperAppConfig]}>
      <MinesweeperWindow />
    </WindowManagerProvider>,
  );
}

function clearLeaderboardStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

describe('MinesweeperWindow', () => {
  beforeEach(clearLeaderboardStorage);

  test('renders without crashing', () => {
    renderMinesweeper();
    expect(document.getElementById('minesweeper-window')).toBeInTheDocument();
  });

  test('window has correct id', () => {
    renderMinesweeper();
    const windowEl = document.getElementById('minesweeper-window');
    expect(windowEl).toBeInTheDocument();
  });

  test('beginner grid has 81 cells (9x9)', () => {
    renderMinesweeper();
    const grid = document.querySelector('.minesweeper-grid');
    expect(grid).toBeInTheDocument();
    const cells = grid!.querySelectorAll('.ms-cell');
    expect(cells).toHaveLength(81);
  });

  test('displays mine count 010 and timer 000 initially', () => {
    renderMinesweeper();
    const displays = document.querySelectorAll('.minesweeper-display');
    expect(displays).toHaveLength(2);
    expect(displays[0].textContent).toBe('010');
    expect(displays[1].textContent).toBe('000');
  });

  test('face button has smile state initially', () => {
    renderMinesweeper();
    const face = document.querySelector('.minesweeper-face-icon');
    expect(face).toHaveClass('face-smile');
  });

  test('Game menu has New, difficulty options, Best Times, and Exit', () => {
    renderMinesweeper();
    const gameMenu = document.querySelector('.minesweeper-menu-item');
    expect(gameMenu).toHaveTextContent(/game/i);
    expect(gameMenu).toHaveTextContent(/new/i);
    expect(gameMenu).toHaveTextContent(/best times/i);
    expect(gameMenu).toHaveTextContent(/beginner/i);
    expect(gameMenu).toHaveTextContent(/intermediate/i);
    expect(gameMenu).toHaveTextContent(/expert/i);
    expect(gameMenu).toHaveTextContent(/exit/i);
  });

  test('Help menu has Help Topics and About', () => {
    renderMinesweeper();
    const menuItems = document.querySelectorAll('.minesweeper-menu-item');
    const helpMenu = Array.from(menuItems).find((el) => el.textContent?.includes('Help'));
    expect(helpMenu).toHaveTextContent(/help topics/i);
    expect(helpMenu).toHaveTextContent(/about minesweeper/i);
  });

  test('clicking face button resets game', async () => {
    const user = userEvent.setup();
    renderMinesweeper();
    const face = document.querySelector('.minesweeper-face') as HTMLElement;
    expect(face).toBeInTheDocument();
    await user.click(face!);
    const windowEl = document.getElementById('minesweeper-window');
    expect(windowEl).toBeInTheDocument();
    const cells = windowEl!.querySelectorAll('.ms-cell');
    expect(cells.length).toBe(81);
  });

  test('grid cells have data-x and data-y and respond to mousedown', async () => {
    const user = userEvent.setup();
    renderMinesweeper();
    const grid = document.querySelector('.minesweeper-grid');
    const firstCell = grid!.querySelector('[data-x="0"][data-y="0"]') as HTMLElement;
    expect(firstCell).toHaveClass('ms-cell');
    await user.pointer({ target: firstCell, keys: '[MouseLeft>]' });
    expect(firstCell).toHaveClass('pressed');
  });

  test('minesweeperAppConfig has correct id and label', () => {
    expect(minesweeperAppConfig.id).toBe('minesweeper');
    expect(minesweeperAppConfig.label).toBe('Minesweeper');
    expect(minesweeperAppConfig.desktop).toBe(true);
    expect(minesweeperAppConfig.startMenu).toEqual({ path: ['Programs', 'Games'] });
  });

  describe('leaderboard', () => {
    function getBestTimesMenuItem(container: HTMLElement): HTMLElement {
      const items = container.querySelectorAll('.minesweeper-dropdown-item');
      for (const el of Array.from(items)) {
        if (el.textContent?.replace(/\s/g, '').toLowerCase().includes('besttimes'))
          return el as HTMLElement;
      }
      throw new Error('Best Times menu item not found');
    }

    test('Best Times opens leaderboard dialog with three sections', async () => {
      const user = userEvent.setup();
      renderMinesweeper();
      const gameMenu = document.querySelector('.minesweeper-menu-item') as HTMLElement;
      const bestTimesItem = getBestTimesMenuItem(gameMenu);
      await user.click(bestTimesItem);
      await screen.findAllByText('Rank'); // dialog has 3 tables
      expect(screen.getByText('Best Times')).toBeInTheDocument();
      expect(screen.getByText('Beginner')).toBeInTheDocument();
      expect(screen.getByText('Intermediate')).toBeInTheDocument();
      expect(screen.getByText('Expert')).toBeInTheDocument();
    });

    test('Best Times shows No scores yet when leaderboard empty', async () => {
      const user = userEvent.setup();
      renderMinesweeper();
      const gameMenu = document.querySelector('.minesweeper-menu-item') as HTMLElement;
      await user.click(getBestTimesMenuItem(gameMenu));
      await screen.findAllByText('Rank');
      const noScores = screen.getAllByText('No scores yet');
      expect(noScores.length).toBeGreaterThanOrEqual(1);
    });

    test('Best Times shows local scores when present', async () => {
      await addScore('beginner', 'Alice', 42);
      await addScore('intermediate', 'Bob', 120);
      const user = userEvent.setup();
      renderMinesweeper();
      const gameMenu = document.querySelector('.minesweeper-menu-item') as HTMLElement;
      await user.click(getBestTimesMenuItem(gameMenu));
      await screen.findAllByText('Rank');
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('42s')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('120s')).toBeInTheDocument();
    });

    test('leaderboard dialog OK button closes dialog', async () => {
      const user = userEvent.setup();
      renderMinesweeper();
      const gameMenu = document.querySelector('.minesweeper-menu-item') as HTMLElement;
      await user.click(getBestTimesMenuItem(gameMenu));
      await screen.findAllByText('Rank');
      const okBtn = screen.getByRole('button', { name: 'OK', hidden: true });
      await user.click(okBtn);
      expect(screen.queryAllByText('Rank')).toHaveLength(0);
    });

    test('Best Times shows metrics when API returns metrics', async () => {
      const origFetch = global.fetch;
      (global as unknown as { fetch: unknown }).fetch = (url: unknown) => {
        const u = String(url);
        if (
          u.includes('/minesweeper-leaderboard') &&
          !u.includes('/start') &&
          !u.includes('/ended')
        ) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                data: {
                  beginner: [],
                  intermediate: [],
                  expert: [],
                },
                metrics: {
                  beginner: { attempts: 12, completed: 10, won: 4 },
                  intermediate: { attempts: 5, completed: 3, won: 1 },
                  expert: { attempts: 0, completed: 0, won: 0 },
                },
              }),
          } as Response);
        }
        return (origFetch as (url: unknown) => Promise<Response>)(url);
      };
      const user = userEvent.setup();
      renderMinesweeper();
      const gameMenu = document.querySelector('.minesweeper-menu-item') as HTMLElement;
      await user.click(getBestTimesMenuItem(gameMenu));
      await screen.findAllByText('Rank');
      expect(screen.getByText(/Attempts: 12 · Completed: 10 · Won: 4/)).toBeInTheDocument();
      expect(screen.getByText(/Attempts: 5 · Completed: 3 · Won: 1/)).toBeInTheDocument();
      (global as unknown as { fetch: unknown }).fetch = origFetch;
    });
  });
});
