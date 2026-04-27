'use client';

import { useCallback } from 'react';
import { useOsShell } from '../context/OsShellContext';
import { useOptionalWindowManager } from '../context/WindowManagerContext';

/**
 * Returns whether the given app is currently visible (open and not minimized).
 *
 * Works in both multi-window OSes (Win98, WinXP, KarpOS, macOS Tiger) and
 * single-app OSes (PalmOS, Windows Mobile). Shared app windows should use this
 * instead of `useWindowManager().apps[id]?.visible` so they don't crash when
 * rendered inside a single-app OS shell.
 *
 * @example
 * const isVisible = useAppVisibility('calculator');
 */
export function useAppVisibility(appId: string): boolean {
  const { osMode, currentApp } = useOsShell();
  const wm = useOptionalWindowManager();

  if (osMode === 'single-app') {
    return currentApp === appId;
  }
  const state = wm?.apps[appId];
  return !!(state?.visible && !state?.minimized);
}

/**
 * Returns a stable callback that closes/hides the given app.
 *
 * In multi-window mode, calls `WindowManager.hideApp(id)`.
 * In single-app mode, calls `goHome()` from `OsShellContext`.
 *
 * @example
 * const closeApp = useCloseApp('minesweeper');
 * <button onClick={closeApp}>Exit</button>
 */
export function useCloseApp(appId: string): () => void {
  const { osMode, goHome } = useOsShell();
  const wm = useOptionalWindowManager();

  return useCallback(() => {
    if (osMode === 'single-app') {
      goHome?.();
    } else {
      wm?.hideApp(appId);
    }
  }, [osMode, goHome, wm, appId]);
}
