'use client';

import { useEffect, useRef, useState } from 'react';
import type { AppConfig } from '../../types/app-config';
import { StartMenuTree } from './StartMenuTree';
import { StartButton } from './taskbar/StartButton';
import { TaskbarTasks } from './taskbar/TaskbarTasks';
import { SystemTray } from './taskbar/SystemTray';

function TaskbarContextMenu({
  pos,
  onClose,
}: {
  pos: { x: number; y: number };
  onClose: () => void;
}) {
  const minimizeAll = () => {
    document.querySelectorAll<HTMLElement>('.app-window:not(.app-window-hidden)').forEach((el) => {
      el.querySelector<HTMLElement>('[data-win-min]')?.click();
    });
    onClose();
  };

  return (
    <div
      id="taskbar-context-menu"
      className="desktop-context-menu"
      style={{ position: 'fixed', left: pos.x, top: pos.y - 4, transform: 'translateY(-100%)' }}
    >
      <div className="ctx-item" onClick={minimizeAll}>
        Minimize All Windows
      </div>
    </div>
  );
}

export function Taskbar({ registry }: { registry: AppConfig[] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [volumeOpen, setVolumeOpen] = useState(false);
  const [ctxPos, setCtxPos] = useState<{ x: number; y: number } | null>(null);
  const taskbarRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!ctxPos) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#taskbar-context-menu')) setCtxPos(null);
    };
    document.addEventListener('click', handler);
    document.addEventListener('contextmenu', handler);
    return () => {
      document.removeEventListener('click', handler);
      document.removeEventListener('contextmenu', handler);
    };
  }, [ctxPos]);

  const handleTaskbarContext = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('#start-button') ||
      target.closest('.taskbar-task') ||
      target.closest('.system-tray')
    )
      return;
    e.preventDefault();
    setCtxPos({ x: e.clientX, y: e.clientY });
  };

  return (
    <>
      <div id="taskbar" ref={taskbarRef} onContextMenu={handleTaskbarContext}>
        <StartButton active={menuOpen} onClick={() => setMenuOpen((v) => !v)} />
        <div className="taskbar-divider" />
        <TaskbarTasks registry={registry} />
        <SystemTray registry={registry} volumeOpen={volumeOpen} setVolumeOpen={setVolumeOpen} />
      </div>
      <StartMenuTree registry={registry} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      {ctxPos && <TaskbarContextMenu pos={ctxPos} onClose={() => setCtxPos(null)} />}
    </>
  );
}
