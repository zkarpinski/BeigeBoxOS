'use client';

import { useEffect, useState } from 'react';
import type { AppConfig } from '../../types/app-config';
import { StartMenuTree } from './StartMenuTree';
import { StartButton } from './taskbar/StartButton';
import { TaskbarTasks } from './taskbar/TaskbarTasks';
import { SystemTray } from './taskbar/SystemTray';

export function Taskbar({ registry }: { registry: AppConfig[] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [volumeOpen, setVolumeOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      // Use composedPath so retargeting / shadow DOM still count; also catches cases
      // where the click target node was removed mid-event (path still includes menu).
      const path = e.composedPath();
      const insideMenu = path.some((n) => n instanceof HTMLElement && n.closest('#xp-start-menu'));
      const insideStart = path.some((n) => n instanceof HTMLElement && n.closest('#start-button'));
      if (!insideMenu && !insideStart) setMenuOpen(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [menuOpen]);

  // Quick Launch: IE6 (or IE5), Show Desktop placeholder
  const ie = registry.find((a) => a.id === 'ie6' || a.id === 'ie5');

  return (
    <>
      <div id="taskbar">
        <StartButton active={menuOpen} onClick={() => setMenuOpen((v) => !v)} />
        {/* Quick Launch */}
        <div className="quick-launch">
          {ie && (
            <div
              className="quick-launch-btn"
              title={ie.label}
              onClick={() => {
                const { showApp } =
                  (window as unknown as { WindowsXP?: { showApp: (id: string) => void } })
                    .WindowsXP ?? {};
                showApp?.(ie.id);
              }}
            >
              <img
                src={ie.icon}
                alt={ie.label}
                width={16}
                height={16}
                style={{ imageRendering: 'pixelated' }}
              />
            </div>
          )}
          <div className="quick-launch-btn" title="Show Desktop" style={{ fontSize: 13 }}>
            🖥
          </div>
        </div>
        <div className="taskbar-divider" />
        <TaskbarTasks registry={registry} />
        <SystemTray registry={registry} volumeOpen={volumeOpen} setVolumeOpen={setVolumeOpen} />
      </div>
      <StartMenuTree registry={registry} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
    </>
  );
}
