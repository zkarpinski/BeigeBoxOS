'use client';

import { useEffect, useMemo } from 'react';
import { WordWindow } from '../apps/word';
import { NotepadWindow } from '@retro-web/core/apps/notepad';
import { OsShellProvider } from '@retro-web/core/context';
import { AppWindow, TitleBar, MenuBar } from '../win98';
import { writeFile } from '../../fileSystem';
import { AimWindow } from '../apps/aim';
import { MinesweeperWindow } from '../apps/minesweeper';
import { CalculatorWindow } from '../apps/calculator';
import { PaintWindow } from '../apps/paint';
import { MsDosWindow } from '../apps/msdos';
import { WinampWindow } from '../apps/winamp';
import { Ie5Window } from '../apps/ie5';
import { NapsterWindow } from '../apps/napster';
import { NavigatorWindow } from '../apps/navigator';
import { DefragWindow } from '../apps/defrag';
import { Vb6Window } from '../apps/vb6';
import { ControlPanelWindow } from '../apps/controlpanel';
import { MyComputerWindow } from '../apps/mycomputer';
import { Thps2Window } from '../apps/thps2/Thps2Window';
import { TimWindow } from '../apps/the_incredible_machine/TimWindow';
import { PhotoshopWindow } from '../apps/photoshop';
import { AolWindow } from '../apps/aol';
import { ReporterWindow } from '../apps/reporter';
import { ZonealarmWindow } from '../apps/zonealarm';
import { TaskManagerWindow } from '../apps/taskmanager';
import { AvgWindow } from '../apps/avg';
import { BootScreen } from '../shell/BootScreen';
import { DesktopIcons } from '../shell/DesktopIcons';
import { Taskbar } from '../shell/Taskbar';
import { ShellOverlays } from '../shell/ShellOverlays';
import { appRegistry } from '../../registry';
import { WindowManagerProvider } from '@retro-web/core/context';
import { initFileSystem } from '../../fileSystem';
import { Windows98GlobalShim } from '../shell/Windows98GlobalShim';

export interface DesktopProps {
  /**
   * When set (via /run/[appId] URL), desktop skips the boot click prompt and opens
   * only this app.
   */
  openAppId?: string;
}

export function Desktop({ openAppId }: DesktopProps) {
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
  const skipBoot = typeof resolvedOpenAppId === 'string' && resolvedOpenAppId.length > 0;

  useEffect(() => {
    initFileSystem(appRegistry);
  }, []);

  // If we arrived via /?app=..., clean up the URL back to "/"
  useEffect(() => {
    if (!urlAppId) return;
    try {
      window.history.replaceState(null, '', '/');
    } catch {
      /* ignore */
    }
  }, [urlAppId]);

  useEffect(() => {
    // _onDesktopReady — staged desktop reveal (must exist before boot runs)
    (window as unknown as { _onDesktopReady?: (instant: boolean) => void })._onDesktopReady =
      function (instant: boolean) {
        const taskbar = document.getElementById('taskbar');
        const icons = document.getElementById('desktop-icons');
        const appWindows = Array.prototype.slice.call(
          document.querySelectorAll('.app-window:not(.app-window-hidden)'),
        ) as HTMLElement[];

        function show(el: HTMLElement | null) {
          if (el) {
            el.style.opacity = '1';
            el.style.pointerEvents = 'auto';
          }
        }

        if (instant) {
          if (taskbar) show(taskbar);
          if (icons) show(icons);
          appWindows.forEach(show);
          document.body.classList.remove('booting');
          return;
        }

        function fadeIn(el: HTMLElement | null) {
          if (!el) return;
          el.style.transition = 'opacity 0.5s ease';
          (el as HTMLElement).offsetHeight;
          show(el);
        }

        setTimeout(() => taskbar && fadeIn(taskbar), 600);
        setTimeout(() => icons && fadeIn(icons), 1200);
        setTimeout(() => appWindows.forEach(fadeIn), 1800);
        setTimeout(() => {
          document.body.classList.remove('booting');
        }, 2800);
      };

    // Boot screen logic
    const BOOT_KEY = 'word97-booted';
    const bootScreen = document.getElementById('boot-screen');
    const sound = document.getElementById('boot-sound') as HTMLAudioElement | null;
    const prompt = document.getElementById('boot-click-prompt');
    const fill = document.getElementById('boot-bar-fill');
    if (!bootScreen) return;

    // Direct app URLs should behave like the boot screen was already dismissed.
    if (skipBoot) {
      try {
        localStorage.setItem(BOOT_KEY, String(Date.now()));
      } catch {
        /* ignore */
      }
    }

    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    try {
      const stored = localStorage.getItem(BOOT_KEY);
      if (stored) {
        const ts = parseInt(stored, 10);
        if (!isNaN(ts) && Date.now() - ts < THIRTY_DAYS_MS) {
          bootScreen.style.display = 'none';
          (window as unknown as { _onDesktopReady: (instant: boolean) => void })._onDesktopReady(
            true,
          );
          return;
        }
        localStorage.removeItem(BOOT_KEY);
      }
    } catch {
      /* ignore */
    }

    let dismissed = false;
    function dismiss() {
      if (dismissed || !bootScreen) return;
      dismissed = true;
      try {
        localStorage.setItem(BOOT_KEY, String(Date.now()));
      } catch {
        /* ignore */
      }
      if (sound) sound.play().catch(() => {});
      bootScreen.style.transition = 'opacity 0.5s ease';
      bootScreen.style.opacity = '0';
      setTimeout(() => {
        if (bootScreen) bootScreen.style.display = 'none';
        (window as unknown as { _onDesktopReady: (instant: boolean) => void })._onDesktopReady(
          false,
        );
      }, 550);
    }

    setTimeout(() => {
      if (fill) (fill as HTMLElement).style.animationPlayState = 'paused';
      if (prompt) prompt.removeAttribute('hidden');
      bootScreen.addEventListener('click', dismiss);
      bootScreen.addEventListener('keydown', dismiss);
      bootScreen.setAttribute('tabindex', '0');
      bootScreen.focus();
    }, 2000);
  }, [skipBoot]);

  return (
    <WindowManagerProvider
      registry={appRegistry}
      initialOpenAppId={resolvedOpenAppId}
      boundsStorageKey="win98-window-bounds"
    >
      <Windows98GlobalShim registry={appRegistry} />
      <OsShellProvider value={{ AppWindow, TitleBar, MenuBar, writeFile }}>
        {/* SEO content (visually hidden, crawlable) */}
        <div className="seo-intro" aria-hidden="true">
          <h1>Windows 98 in the Browser</h1>
          <p>
            A nostalgic Windows 98 desktop in your browser. Open Word, Clippy, Winamp, Napster, AIM,
            Netscape Navigator, Minesweeper, Paint, Notepad, Calculator, and more. By Zachary
            Karpinski.
          </p>
        </div>

        {/* Boot screen */}
        <BootScreen />

        {/* App windows */}
        <WordWindow />
        <NotepadWindow />
        <AimWindow />
        <MinesweeperWindow />
        <CalculatorWindow />
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
        <Thps2Window />
        <TimWindow />
        <PhotoshopWindow />
        <AolWindow />
        <ReporterWindow />
        <ZonealarmWindow />
        <TaskManagerWindow registry={appRegistry} />
        <AvgWindow />

        {/* Shell */}
        <DesktopIcons registry={appRegistry} />
        <Taskbar registry={appRegistry} />
        <ShellOverlays />
      </OsShellProvider>
    </WindowManagerProvider>
  );
}
