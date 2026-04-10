'use client';

import { useEffect, useMemo } from 'react';
import { NotepadWindow } from '@retro-web/core/apps/notepad';
import { OsShellProvider, ToastProvider } from '@retro-web/core/context';
import { AppWindow, TitleBar, KarpGlobalShim, KarposToasts } from '../karpos-shell';
import { MenuBar } from '@win98/components/win98/MenuBar';
import { writeFile } from '../../fileSystem';
import { MinesweeperWindow } from '@retro-web/app-minesweeper';
import { PinballWindow } from '@retro-web/app-pinball';
import { DesktopDestroyer } from '@retro-web/app-desktop-destroyer';
import { CalculatorWindow } from '@retro-web/app-calculator';
import { PdfReaderWindow } from '@retro-web/app-pdf-reader';
import { ProjectsWindow } from '../apps/projects/ProjectsWindow';
import { PadWindow } from '../apps/pad/PadWindow';
import { DesktopIcons } from './desktop-icons';
import { KarposTaskbar } from './KarposTaskbar';
import { KarposShellOverlays } from './KarposShellOverlays';
import { appRegistry } from '../../registry';
import { WindowManagerProvider, useWindowManager } from '@retro-web/core/context';
import { initFileSystem } from '../../fileSystem';

function DesktopDestroyerContainer() {
  const { apps } = useWindowManager();
  if (!apps['desktop-destroyer']?.visible) return null;
  return <DesktopDestroyer skin="karpos" />;
}

export function KarpDesktop() {
  const urlAppId = useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      const u = new URL(window.location.href);
      const app = u.searchParams.get('app');
      return app && app.trim() ? app.trim() : null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    initFileSystem(appRegistry);
  }, []);

  useEffect(() => {
    if (!urlAppId) return;
    try {
      window.history.replaceState(null, '', '/');
    } catch {
      /* ignore */
    }
  }, [urlAppId]);

  return (
    <WindowManagerProvider
      registry={appRegistry}
      initialOpenAppId={urlAppId}
      boundsStorageKey="karpos-window-bounds"
      applyOpenByDefault={false}
    >
      <ToastProvider>
        <KarpGlobalShim registry={appRegistry} />
        <OsShellProvider value={{ AppWindow, TitleBar, MenuBar, writeFile }}>
          <div className="seo-intro" aria-hidden="true">
            <h1>KarpOS — Zachary Karpinski</h1>
            <p>
              A neo-brutalist playground desktop in the browser. Open Projects, Notepad,
              Minesweeper, Calculator, PDF Reader, Pad, and Nebula Pinball.
            </p>
          </div>

          <NotepadWindow />
          <SpaceTraderWindow skin="karpos" />
          <MinesweeperWindow skin="karpos" />
          <CalculatorWindow skin="karpos" />
          <PdfReaderWindow />
          <ProjectsWindow />
          <PadWindow />
          <PinballWindow skin="karpos" />
          <DesktopDestroyerContainer />

          <DesktopIcons registry={appRegistry} />
          <KarposTaskbar registry={appRegistry} />
          <KarposShellOverlays />
          <KarposToasts />
        </OsShellProvider>
      </ToastProvider>
    </WindowManagerProvider>
  );
}
