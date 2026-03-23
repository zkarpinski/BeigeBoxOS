'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useWindowManager } from '@retro-web/core/context';
import type { AppConfig } from '@/app/types/app-config';

export const timAppConfig: AppConfig = {
  id: 'the_incredible_machine',
  label: 'The Incredible Machine',
  icon: 'apps/the_incredible_machine/tim-icon.png',
  desktop: true,
  startMenu: { path: ['Programs', 'Games'] },
};

export function TimWindow() {
  const { isAppVisible, hideApp, openFatalError } = useWindowManager();
  const visible = isAppVisible('the_incredible_machine');
  const [pos, setPos] = useState({ left: 0, top: 0 });
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  const winRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closedRef = useRef(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const triggerFatalError = useCallback(() => {
    if (closedRef.current) return;
    closedRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    audioRef.current?.pause();
    hideApp('the_incredible_machine');
    openFatalError({
      program: 'The Incredible Machine',
      details:
        'The Incredible Machine caused an invalid page fault in\n' +
        'module THEINCREDIBLEMACHINE.EXE at 0177:00c03a2f.\n\n' +
        'Registers:\n' +
        'EAX=1c8a329d CS=0177 EIP=00c03a2f EFLGS=00010246\n' +
        'EBX=00000000 SS=017f ESP=00b4ef28 EBP=00b4ef58\n' +
        'ECX=43a7f200 DS=017f ESI=011e329c FS=3eaf\n' +
        'EDX=00000068 ES=017f EDI=00000000 GS=0000\n\n' +
        'Bytes at CS:EIP:\n' +
        '8b 45 f4 8b 55 08 89 02 8b 45 0c 85 c0 74 0a 8b',
    });
  }, [hideApp, openFatalError]);

  const close = useCallback(() => {
    if (closedRef.current) return;
    closedRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    audioRef.current?.pause();
    hideApp('the_incredible_machine');
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
    audioRef.current?.play().catch(() => {});
    timerRef.current = setTimeout(triggerFatalError, 20000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, triggerFatalError]);

  const handleTitleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).id === 'tim-close') return;
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
      id="tim-window"
      className="tim-win app-window"
      style={{ position: 'fixed', left: pos.left, top: pos.top, zIndex: 9999 }}
    >
      <div className="title-bar" onMouseDown={handleTitleMouseDown}>
        <div className="title-bar-text">
          <img
            src="apps/the_incredible_machine/tim-icon.png"
            alt="TIM"
            style={{ width: 16, height: 16, marginRight: 4 }}
          />
          <span className="title-text">The Incredible Machine</span>
        </div>
        <div className="title-bar-controls">
          <button
            className="win-btn title-btn"
            id="tim-close"
            title="Close"
            onClick={close}
            aria-label="Close"
          >
            <span className="icon-close">X</span>
          </button>
        </div>
      </div>
      <div className="tim-body">
        <img src="apps/the_incredible_machine/logo.png" className="tim-screen" alt="Sierra Logo" />
        <audio
          ref={audioRef}
          src="apps/the_incredible_machine/sierra.mp3"
          onEnded={triggerFatalError}
        />
      </div>
    </div>,
    document.body,
  );
}
