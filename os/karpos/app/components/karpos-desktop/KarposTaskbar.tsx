'use client';

/**
 * KarpOS shell taskbar — same behavior as Win98 taskbar chrome, but uses
 * {@link KarposApplicationsMenu} instead of {@link StartMenuTree}.
 * Win98’s `Taskbar` component stays Win98-only (no optional start-menu injection).
 * Launcher: `KarposAppsButton` (“APPS”), not Win98 `StartButton`.
 */
import { useEffect, useState } from 'react';
import type { AppConfig } from '@retro-web/core/types/app-config';
import { TaskbarTasks } from '@win98/components/shell/taskbar/TaskbarTasks';
import { SystemTray } from '@win98/components/shell/taskbar/SystemTray';
import { KarposAppsButton } from './KarposAppsButton';
import { KarposApplicationsMenu } from './KarposApplicationsMenu';
import { shouldKeepMenuOpenOnDocumentClick } from './karposMenuDocumentClick';

export function KarposTaskbar({ registry }: { registry: AppConfig[] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [volumeOpen, setVolumeOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      const menuEl = document.getElementById('start-menu');
      const startBtnEl = document.getElementById('start-button');
      if (shouldKeepMenuOpenOnDocumentClick(e, menuEl, startBtnEl)) return;
      setMenuOpen(false);
    };
    // Bubble phase: runs after children; contains()/composedPath() handle inside-menu clicks.
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [menuOpen]);

  return (
    <>
      <div id="taskbar">
        <KarposAppsButton active={menuOpen} onClick={() => setMenuOpen((v) => !v)} />
        <div className="taskbar-divider" />
        <TaskbarTasks registry={registry} />
        <SystemTray registry={registry} volumeOpen={volumeOpen} setVolumeOpen={setVolumeOpen} />
      </div>
      <KarposApplicationsMenu registry={registry} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
    </>
  );
}
