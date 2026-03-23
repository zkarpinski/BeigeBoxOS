'use client';

import React, { useRef, useEffect, useCallback } from 'react';

export function playSound(name: string) {
  if (!name) return;
  const AudioCtxClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtxClass) return;
  const ctx = new AudioCtxClass();
  function tone(freq: number, start: number, dur: number, gain = 0.3) {
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.connect(env);
    env.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = 'sine';
    env.gain.setValueAtTime(gain, ctx.currentTime + start);
    env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
    osc.start(ctx.currentTime + start);
    osc.stop(ctx.currentTime + start + dur + 0.05);
  }
  if (name === 'chord') {
    tone(261.6, 0, 0.4);
    tone(329.6, 0, 0.4);
    tone(392.0, 0, 0.4);
  } else if (name === 'ding') {
    tone(880, 0, 0.5);
  } else if (name === 'tada') {
    tone(261.6, 0, 0.15);
    tone(329.6, 0.15, 0.15);
    tone(392.0, 0.3, 0.35);
  } else if (name === 'notify') {
    tone(523.3, 0, 0.15);
    tone(392.0, 0.15, 0.25);
  } else if (name === 'exclamation') {
    tone(600, 0, 0.08);
    tone(500, 0.1, 0.12);
    tone(400, 0.24, 0.18);
  }
  setTimeout(() => ctx.close(), 1000);
}

export function useDraggable(ref: React.RefObject<HTMLDivElement | null>) {
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('.dp-titlebtn')) return;
      if (!ref.current) return;
      dragging.current = true;
      const rect = ref.current.getBoundingClientRect();
      offset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      e.preventDefault();
    },
    [ref],
  );

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragging.current || !ref.current) return;
      const dlg = ref.current;
      const x = Math.max(
        0,
        Math.min(e.clientX - offset.current.x, window.innerWidth - dlg.offsetWidth),
      );
      const y = Math.max(
        0,
        Math.min(e.clientY - offset.current.y, window.innerHeight - dlg.offsetHeight),
      );
      dlg.style.left = x + 'px';
      dlg.style.top = y + 'px';
    }
    function onUp() {
      dragging.current = false;
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [ref]);

  return onMouseDown;
}

export function centerDialog(dlg: HTMLDivElement, defaultW = 400, defaultH = 300) {
  const w = dlg.offsetWidth || defaultW;
  const h = dlg.offsetHeight || defaultH;
  dlg.style.left = Math.round((window.innerWidth - w) / 2) + 'px';
  dlg.style.top = Math.round((window.innerHeight - h) / 2) + 'px';
}
