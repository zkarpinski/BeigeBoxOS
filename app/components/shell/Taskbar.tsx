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
      const target = e.target as HTMLElement;
      if (!target.closest('#start-menu') && !target.closest('#start-button')) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [menuOpen]);

  return (
    <>
      <div id="taskbar">
        <StartButton active={menuOpen} onClick={() => setMenuOpen((v) => !v)} />
        <div className="taskbar-divider" />
        <TaskbarTasks registry={registry} />
        <SystemTray registry={registry} volumeOpen={volumeOpen} setVolumeOpen={setVolumeOpen} />
      </div>
      <StartMenuTree registry={registry} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
    </>
  );
}
