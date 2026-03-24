'use client';

import React, { createContext, useContext } from 'react';
import type { OsShellValue } from '../types/os-shell';

const OsShellContext = createContext<OsShellValue | null>(null);

export interface OsShellProviderProps {
  value: OsShellValue;
  children: React.ReactNode;
}

/**
 * Provides OS-native window shell (`AppWindow`, `TitleBar`, `MenuBar`) and FS hooks
 * so shared app components in `@retro-web/core/apps/*` stay theme-agnostic.
 *
 * **App windows** should use `useOsShell()` for `AppWindow`, `TitleBar`, and `MenuBar` — do not import
 * those from `../win98` or `../winxp` so the same component matches Win98, WinXP, or KarpOS chrome.
 *
 * Mount once per desktop (inside {@link WindowManagerProvider}), using the current OS
 * implementation from `os/<name>/app/components/<theme>/`.
 */
export function OsShellProvider({ value, children }: OsShellProviderProps) {
  return <OsShellContext.Provider value={value}>{children}</OsShellContext.Provider>;
}

export function useOsShell(): OsShellValue {
  const v = useContext(OsShellContext);
  if (!v) {
    throw new Error(
      'useOsShell must be used within OsShellProvider (wrap Desktop with OS AppWindow, TitleBar, MenuBar).',
    );
  }
  return v;
}
