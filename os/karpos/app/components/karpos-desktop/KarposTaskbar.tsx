'use client';

/**
 * KarpOS shell taskbar — same behavior as Win98 taskbar chrome, but uses
 * {@link KarposApplicationsMenu} instead of {@link StartMenuTree}.
 * Win98’s `Taskbar` component stays Win98-only (no optional start-menu injection).
 * Launcher: `KarposAppsButton` (“APPS”), not Win98 `StartButton`.
 */
import { useEffect, useState } from 'react';
import type { AppConfig } from '@retro-web/core/types/app-config';
import { KarposAppsButton } from './KarposAppsButton';
import { KarposTaskbarTasks } from './KarposTaskbarTasks';
import { KarposSystemTray } from './KarposSystemTray';
import { KarposApplicationsMenu } from './KarposApplicationsMenu';
import { shouldKeepMenuOpenOnDocumentClick } from './karposMenuDocumentClick';

/** Tray icons hidden on KarpOS (apps still launch from APPS / registry). */
const KARPOS_TRAY_EXCLUDED_IDS = new Set(['zonealarm', 'aim']);

export function KarposTaskbar({ registry }: { registry: AppConfig[] }) {
  const [menuOpen, setMenuOpen] = useState(false);

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
        <KarposTaskbarTasks registry={registry} />
        <KarposSystemTray
          registry={registry}
          trayAppFilter={(a) => !KARPOS_TRAY_EXCLUDED_IDS.has(a.id)}
        />
      </div>
      <KarposApplicationsMenu registry={registry} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
    </>
  );
}
