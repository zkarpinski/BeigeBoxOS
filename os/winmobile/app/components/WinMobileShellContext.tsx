import React, { useMemo } from 'react';
import { OsShellProvider } from '@retro-web/core/context';
import type { AppWindowProps, TitleBarProps, MenuBarProps } from '@retro-web/core/types/os-shell';

function WinMobileAppWindow({ children }: AppWindowProps) {
  // In Windows Mobile, apps render full screen in the Pocket PC content area.
  return <div className="winmo-app-window-root h-full w-full">{children}</div>;
}

function WinMobileTitleBar(_props: TitleBarProps) {
  // WinMo uses a global top bar (Navigation Bar).
  return null;
}

function WinMobileMenuBar(_props: MenuBarProps) {
  // WinMo uses a global bottom bar (Command Bar).
  return null;
}

const writeFile = (path: string, content: string) => {
  try {
    localStorage.setItem(`winmo-fs-${path}`, content);
  } catch (_) {}
};

interface WinMobileShellProviderProps {
  currentApp: string;
  openApp: (id: string) => void;
  goHome: () => void;
  children: React.ReactNode;
}

export function WinMobileShellProvider({
  currentApp,
  openApp,
  goHome,
  children,
}: WinMobileShellProviderProps) {
  const shellValue = useMemo(
    () => ({
      osMode: 'single-app' as const,
      currentApp,
      openApp,
      goHome,
      AppWindow: WinMobileAppWindow,
      TitleBar: WinMobileTitleBar,
      MenuBar: WinMobileMenuBar,
      writeFile,
    }),
    [currentApp, openApp, goHome],
  );

  return <OsShellProvider value={shellValue}>{children}</OsShellProvider>;
}
