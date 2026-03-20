'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useWindowManager } from '../../../context/WindowManagerContext';
import type { AppConfig } from '@/app/types/app-config';

export const thps2AppConfig: AppConfig = {
  id: 'thps2',
  label: "Tony Hawk's Pro Skater 2",
  icon: 'apps/thps2/thps2-icon.png',
  desktop: true,
  startMenu: { path: ['Programs', 'Games'] },
};

export function Thps2Window() {
  const { isAppVisible, hideApp, openBsod } = useWindowManager();
  const visible = isAppVisible('thps2');
  const [pos, setPos] = useState({ left: 0, top: 0 });
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const winRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closedRef = useRef(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const close = useCallback(() => {
    if (closedRef.current) return;
    closedRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    hideApp('thps2');
  }, [hideApp]);

  useEffect(() => {
    if (!visible) {
      closedRef.current = false;
      return;
    }
    setPos({
      left: Math.max(0, (window.innerWidth - 400) / 2),
      top: Math.max(0, (window.innerHeight - 320) / 2),
    });
    closedRef.current = false;
    timerRef.current = setTimeout(() => {
      if (closedRef.current) return;
      closedRef.current = true;
      hideApp('thps2');
      openBsod({
        message:
          'A fatal exception 0E has occurred at F000:E2C3 in VXD THPS2(0D).\n' +
          'VXDLDR device driver THPS2.VXD failed to initialize.\n\n' +
          '*  Press any key to terminate the current application.\n' +
          '*  Press CTRL+ALT+DEL to restart your computer. You will\n' +
          '   lose any unsaved information in all applications.',
        clearStorage: true,
        reload: true,
      });
    }, 3000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, hideApp, openBsod]);

  const handleTitleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.thps2-close-btn')) return;
    dragging.current = true;
    const win = winRef.current;
    if (!win) return;
    const r = win.getBoundingClientRect();
    offset.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    e.preventDefault();
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      setPos({ left: e.clientX - offset.current.x, top: e.clientY - offset.current.y });
    };
    const onUp = () => {
      dragging.current = false;
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, []);

  if (!mounted || !visible) return null;

  return createPortal(
    <div
      ref={winRef}
      id="thps2-window"
      className="thps2-win"
      style={{ position: 'fixed', left: pos.left, top: pos.top, zIndex: 9999 }}
    >
      <div className="thps2-titlebar" onMouseDown={handleTitleMouseDown}>
        <span className="thps2-titlebar-text">
          <img src="apps/thps2/thps2-icon.png" className="thps2-tb-icon" alt="" />
          {" Tony Hawk's Pro Skater 2"}
        </span>
        <button className="thps2-close-btn" onClick={close} aria-label="Close">
          &#x2715;
        </button>
      </div>
      <div className="thps2-body">
        <img
          src="apps/thps2/thps2-title-screen.png"
          className="thps2-screen"
          alt="THPS2 title screen"
        />
      </div>
    </div>,
    document.body,
  );
}
