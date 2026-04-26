import React, { useMemo } from 'react';
import { OsShellProvider } from '@retro-web/core/context';
import type { AppWindowProps, TitleBarProps, MenuBarProps } from '@retro-web/core/types/os-shell';

function PalmAppWindow({ children }: AppWindowProps) {
  // In PalmOS, apps just render full screen in the app area.
  // We ignore drag, resize, titleBar, and className from desktop contexts.
  return <div className="palm-app-window-root h-full w-full">{children}</div>;
}

function PalmTitleBar(_props: TitleBarProps) {
  // PalmOS uses a global status bar for titles, so individual window title bars are hidden.
  return null;
}

function PalmMenuBar(_props: MenuBarProps) {
  // PalmOS has a slide-down menu bar, not a static window-attached one.
  return null;
}

const writeFile = (path: string, content: string) => {
  // Minimal no-op or basic local storage for PalmOS if needed by shared apps
  try {
    localStorage.setItem(`palmos-fs-${path}`, content);
  } catch (_) {}
};

interface PalmOsShellProviderProps {
  currentApp: string;
  openApp: (id: string) => void;
  goHome: () => void;
  children: React.ReactNode;
}

export function PalmOsShellProvider({
  currentApp,
  openApp,
  goHome,
  children,
}: PalmOsShellProviderProps) {
  const shellValue = useMemo(
    () => ({
      osMode: 'single-app' as const,
      currentApp,
      openApp,
      goHome,
      AppWindow: PalmAppWindow,
      TitleBar: PalmTitleBar,
      MenuBar: PalmMenuBar,
      writeFile,
    }),
    [currentApp, openApp, goHome],
  );

  return <OsShellProvider value={shellValue}>{children}</OsShellProvider>;
}
