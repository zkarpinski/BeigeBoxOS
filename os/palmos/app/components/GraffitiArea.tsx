'use client';

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { recognize } from '../utils/graffitiRecognizer';
import type { Point } from '../utils/graffitiRecognizer';

interface GraffitiAreaProps {
  /** Called when the user taps without drawing (opens system keyboard) */
  onKeyboardTap?: () => void;
}

// ── Dispatch helpers ──────────────────────────────────────────────────────────

function setNativeValue(el: HTMLInputElement | HTMLTextAreaElement, val: string) {
  const proto =
    el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  setter?.call(el, val);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

function dispatchChar(char: string) {
  const el = document.activeElement as HTMLInputElement | HTMLTextAreaElement | null;
  if (!el || !('value' in el)) return;

  if (char === '\b') {
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? start;
    if (start === end && start > 0) {
      const next = el.value.slice(0, start - 1) + el.value.slice(start);
      setNativeValue(el, next);
      el.selectionStart = el.selectionEnd = start - 1;
    } else if (start !== end) {
      const next = el.value.slice(0, start) + el.value.slice(end);
      setNativeValue(el, next);
      el.selectionStart = el.selectionEnd = start;
    }
  } else if (char === '\n') {
    el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    el.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
  } else {
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? start;
    const next = el.value.slice(0, start) + char + el.value.slice(end);
    setNativeValue(el, next);
    el.selectionStart = el.selectionEnd = start + char.length;
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function GraffitiArea({ onKeyboardTap }: GraffitiAreaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pts = useRef<Point[]>([]);
  const strokeSide = useRef<'letter' | 'number'>('letter');
  const strokeStart = useRef(0);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  // Size canvas to its container whenever the container resizes
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const sync = () => {
      const r = container.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        canvas.width = Math.round(r.width);
        canvas.height = Math.round(r.height);
      }
    };
    sync();

    const ro = new ResizeObserver(sync);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  const clearCanvas = useCallback(() => {
    const c = canvasRef.current;
    if (c) c.getContext('2d')!.clearRect(0, 0, c.width, c.height);
  }, []);

  const scheduleClean = useCallback(() => {
    if (fadeTimer.current) clearTimeout(fadeTimer.current);
    fadeTimer.current = setTimeout(() => {
      clearCanvas();
      setHint(null);
    }, 650);
  }, [clearCanvas]);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const drawSegment = useCallback((from: Point, to: Point) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.strokeStyle = 'rgba(0, 0, 100, 0.75)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    if (fadeTimer.current) clearTimeout(fadeTimer.current);
    clearCanvas();
    setHint(null);

    const pos = getPos(e);
    pts.current = [pos];
    strokeStart.current = Date.now();

    // Determine letter vs number half based on x position in canvas
    const canvas = canvasRef.current!;
    strokeSide.current = pos.x < canvas.width / 2 ? 'letter' : 'number';
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (pts.current.length === 0) return;
    const pos = getPos(e);
    drawSegment(pts.current[pts.current.length - 1], pos);
    pts.current.push(pos);
  };

  const onPointerUp = () => {
    if (pts.current.length === 0) return;

    const elapsed = Date.now() - strokeStart.current;
    const points = [...pts.current];
    pts.current = [];

    // Compute bounding box to detect a tap vs. a stroke
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const dx = Math.max(...xs) - Math.min(...xs);
    const dy = Math.max(...ys) - Math.min(...ys);
    const isTap = elapsed < 300 && dx < 12 && dy < 12;

    if (isTap) {
      clearCanvas();
      onKeyboardTap?.();
      return;
    }

    const result = recognize(points, strokeSide.current);
    if (result !== null) {
      dispatchChar(result);
      // Show a brief visual hint of the recognized character
      if (result === ' ') setHint('⎵');
      else if (result === '\b') setHint('⌫');
      else if (result === '\n') setHint('↵');
      else if (result === '.') setHint('·');
      else setHint(result.toUpperCase());
    } else {
      setHint('?');
    }

    scheduleClean();
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Static labels — sit behind the canvas */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#aaa',
            fontSize: '18px',
            fontFamily: 'serif',
            fontStyle: 'italic',
            opacity: 0.4,
          }}
        >
          abc
        </div>
        <div style={{ width: '1px', height: '60%', background: '#555', opacity: 0.4 }} />
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#aaa',
            fontSize: '18px',
            fontFamily: 'serif',
            fontStyle: 'italic',
            opacity: 0.4,
          }}
        >
          123
        </div>
      </div>

      {/* Recognized character hint */}
      {hint && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{
              fontSize: '26px',
              fontWeight: 'bold',
              color: '#3050cc',
              opacity: 0.85,
              fontFamily: 'var(--font-palm), monospace',
              textShadow: '0 0 6px rgba(0,0,180,0.3)',
            }}
          >
            {hint}
          </span>
        </div>
      )}

      {/* Drawing canvas — top layer, captures all pointer events */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 5,
          touchAction: 'none',
          cursor: 'crosshair',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      />
    </div>
  );
}
