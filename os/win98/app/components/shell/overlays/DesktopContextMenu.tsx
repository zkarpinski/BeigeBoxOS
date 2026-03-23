'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useWindowManager } from '@retro-web/core/context';

export function DesktopContextMenu() {
  const { showApp } = useWindowManager();
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const getPosition = (e: MouseEvent): { x: number; y: number } => {
      if (lastTouchRef.current) return lastTouchRef.current;
      return { x: e.clientX, y: e.clientY };
    };

    const onTouch = (e: TouchEvent) => {
      const t = e.changedTouches?.[0] ?? e.touches?.[0];
      if (t) lastTouchRef.current = { x: t.clientX, y: t.clientY };
    };

    const onCtx = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest('#taskbar') ||
        target.closest('.app-window') ||
        target.closest('[id$="-window"]') ||
        target.closest('#start-menu') ||
        target.closest('#boot-screen') ||
        target.closest('#shutdown-overlay') ||
        target.closest('#desktop-context-menu')
      ) {
        e.preventDefault();
        return;
      }
      e.preventDefault();
      const position = getPosition(e);
      setPos(position);
      lastTouchRef.current = null;
    };
    const hide = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#desktop-context-menu')) setPos(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPos(null);
    };
    document.addEventListener('touchstart', onTouch, { passive: true });
    document.addEventListener('touchend', onTouch, { passive: true });
    document.addEventListener('contextmenu', onCtx);
    document.addEventListener('click', hide);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('touchstart', onTouch);
      document.removeEventListener('touchend', onTouch);
      document.removeEventListener('contextmenu', onCtx);
      document.removeEventListener('click', hide);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  if (!pos) return null;

  const style: React.CSSProperties = { position: 'fixed', left: pos.x, top: pos.y };

  const arrangeByName = () => {
    const container = document.getElementById('desktop-icons');
    if (!container) {
      setPos(null);
      return;
    }
    const icons = Array.from(container.children) as HTMLElement[];
    icons.sort((a, b) => {
      const aText = (a.querySelector('.icon-label, span') as HTMLElement | null)?.textContent ?? '';
      const bText = (b.querySelector('.icon-label, span') as HTMLElement | null)?.textContent ?? '';
      return aText.localeCompare(bText);
    });
    icons.forEach((el) => container.appendChild(el));
    setPos(null);
  };

  return (
    <div id="desktop-context-menu" className="desktop-context-menu" style={style}>
      <div className="ctx-item has-submenu">
        <span className="ctx-label">Arrange Icons</span>
        <span className="ctx-arrow">▶</span>
        <div className="ctx-submenu">
          <div className="ctx-item" id="ctx-arrange-name" onClick={arrangeByName}>
            by Name
          </div>
          <div className="ctx-item" id="ctx-arrange-type" onClick={() => setPos(null)}>
            by Type
          </div>
          <div className="ctx-item" id="ctx-arrange-date" onClick={() => setPos(null)}>
            by Date
          </div>
        </div>
      </div>
      <div className="ctx-item" id="ctx-refresh" onClick={() => setPos(null)}>
        Refresh
      </div>
      <div className="ctx-divider" />
      <div className="ctx-item has-submenu">
        <span className="ctx-label">New</span>
        <span className="ctx-arrow">▶</span>
        <div className="ctx-submenu">
          <div className="ctx-item" id="ctx-new-folder" onClick={() => setPos(null)}>
            Folder
          </div>
          <div className="ctx-item" id="ctx-new-shortcut" onClick={() => setPos(null)}>
            Shortcut
          </div>
          <div className="ctx-divider" />
          <div className="ctx-item" id="ctx-new-text" onClick={() => setPos(null)}>
            Text Document
          </div>
        </div>
      </div>
      <div className="ctx-divider" />
      <div
        className="ctx-item"
        id="ctx-properties"
        onClick={() => {
          setPos(null);
          showApp('controlpanel');
        }}
      >
        Properties
      </div>
    </div>
  );
}
