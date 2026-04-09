'use client';

import { useEffect, useMemo } from 'react';
import { NotepadWindow } from '@retro-web/core/apps/notepad';
import { OsShellProvider, WindowManagerProvider } from '@retro-web/core/context';
import { AppWindow, TitleBar, MenuBar, MacGlobalShim } from '../macosx-shell';
import { writeFile } from '../../fileSystem';
import { MinesweeperWindow } from '@retro-web/app-minesweeper';
import { CalculatorWindow } from '@retro-web/app-calculator';
import { PdfReaderWindow } from '@retro-web/app-pdf-reader';
import { FinderWindow } from '../apps/finder/FinderWindow';
import { MacMenuBar } from './MacMenuBar';
import { MacDock } from './MacDock';
import { MacDesktopIcons } from './MacDesktopIcons';
import { MacShellOverlays } from './MacShellOverlays';
import { appRegistry } from '../../registry';
import { initFileSystem } from '../../fileSystem';

export function MacDesktop() {
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
      boundsStorageKey="macosx-tiger-window-bounds"
      applyOpenByDefault={false}
    >
      <MacGlobalShim registry={appRegistry} />
      <OsShellProvider value={{ AppWindow, TitleBar, MenuBar, writeFile }}>
        {/* SEO content */}
        <div className="seo-intro" aria-hidden="true">
          <h1>Mac OS X 10.4 Tiger in the Browser</h1>
          <p>
            A faithful recreation of Mac OS X 10.4 Tiger with the classic Aqua interface. Notepad
            (TextEdit), Minesweeper, Calculator, and PDF Reader. By Zachary Karpinski.
          </p>
        </div>

        {/* App windows */}
        <FinderWindow />
        <NotepadWindow />
        <MinesweeperWindow skin="macosx" />
        <CalculatorWindow skin="macosx" />
        <PdfReaderWindow />

        {/* Shell */}
        <MacMenuBar registry={appRegistry} />
        <MacDock registry={appRegistry} />
        <MacDesktopIcons />
        <MacShellOverlays />
      </OsShellProvider>
    </WindowManagerProvider>
  );
}
