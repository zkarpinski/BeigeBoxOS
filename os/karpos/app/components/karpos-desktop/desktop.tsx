'use client';

import { useEffect, useMemo } from 'react';
import { WordWindow } from '@win98/components/apps/word';
import { NotepadWindow } from '@retro-web/core/apps/notepad';
import { OsShellProvider } from '@retro-web/core/context';
import { AppWindow, TitleBar, KarpGlobalShim } from '../karpos-shell';
import { MenuBar } from '@win98/components/win98/MenuBar';
import { writeFile } from '../../fileSystem';
import { AimWindow } from '@win98/components/apps/aim';
import { MinesweeperWindow } from '@retro-web/app-minesweeper';
import { CalculatorWindow } from '@retro-web/app-calculator';
import { PaintWindow } from '@win98/components/apps/paint';
import { MsDosWindow } from '@win98/components/apps/msdos';
import { WinampWindow } from '@win98/components/apps/winamp';
import { Ie5Window } from '@win98/components/apps/ie5';
import { NapsterWindow } from '@win98/components/apps/napster';
import { NavigatorWindow } from '@win98/components/apps/navigator';
import { DefragWindow } from '@win98/components/apps/defrag';
import { Vb6Window } from '@win98/components/apps/vb6';
import { ControlPanelWindow } from '@win98/components/apps/controlpanel';
import { MyComputerWindow } from '@win98/components/apps/mycomputer';
import { PdfReaderWindow } from '@retro-web/app-pdf-reader';
import { Thps2Window } from '@win98/components/apps/thps2/Thps2Window';
import { TimWindow } from '@win98/components/apps/the_incredible_machine/TimWindow';
import { PhotoshopWindow } from '@win98/components/apps/photoshop';
import { AolWindow } from '@win98/components/apps/aol';
import { ReporterWindow } from '@win98/components/apps/reporter';
import { ZonealarmWindow } from '@win98/components/apps/zonealarm';
import { TaskManagerWindow } from '@win98/components/apps/taskmanager';
import { AvgWindow } from '@win98/components/apps/avg';
import { DesktopIcons } from './desktop-icons';
import { KarposTaskbar } from './KarposTaskbar';
import { ShellOverlays } from '@win98/components/shell/ShellOverlays';
import { appRegistry } from '../../registry';
import { WindowManagerProvider } from '@retro-web/core/context';
import { initFileSystem } from '../../fileSystem';

export interface KarpDesktopProps {
  /** When set (via /run/[appId] or ?app=), opens only this app on load. */
  openAppId?: string;
}

export function KarpDesktop({ openAppId }: KarpDesktopProps) {
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

  const resolvedOpenAppId = (openAppId && openAppId.trim()) || urlAppId || null;

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
      initialOpenAppId={resolvedOpenAppId}
      boundsStorageKey="karpos-window-bounds"
      applyOpenByDefault={false}
    >
      <KarpGlobalShim registry={appRegistry} />
      <OsShellProvider value={{ AppWindow, TitleBar, MenuBar, writeFile }}>
        <div className="seo-intro" aria-hidden="true">
          <h1>KarpOS — Zachary Karpinski</h1>
          <p>
            A neo-brutalist playground desktop in the browser. Open Word, Winamp, Napster, AIM,
            Netscape Navigator, Minesweeper, Paint, Notepad, Calculator, and more.
          </p>
        </div>

        <WordWindow />
        <NotepadWindow />
        <AimWindow />
        <MinesweeperWindow skin="karpos" />
        <CalculatorWindow skin="karpos" />
        <PaintWindow />
        <MsDosWindow />
        <WinampWindow />
        <Ie5Window />
        <NapsterWindow />
        <NavigatorWindow />
        <DefragWindow />
        <Vb6Window />
        <ControlPanelWindow />
        <MyComputerWindow />
        <PdfReaderWindow />
        <Thps2Window />
        <TimWindow />
        <PhotoshopWindow />
        <AolWindow />
        <ReporterWindow />
        <ZonealarmWindow />
        <TaskManagerWindow registry={appRegistry} />
        <AvgWindow />

        <DesktopIcons registry={appRegistry} />
        <KarposTaskbar registry={appRegistry} />
        <ShellOverlays />
      </OsShellProvider>
    </WindowManagerProvider>
  );
}
