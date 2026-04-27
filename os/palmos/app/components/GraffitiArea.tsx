'use client';

import React, { useRef, useCallback, useEffect, useState } from 'react';
import { recognize } from '../utils/graffitiRecognizer';
import type { Point } from '../utils/graffitiRecognizer';
import { usePalmSounds } from '../hooks/usePalmSounds';

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
  const canvasTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [hintKey, setHintKey] = useState<string>('');
  const { playClick } = usePalmSounds();

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
    if (canvasTimer.current) clearTimeout(canvasTimer.current);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    // Clear canvas quickly (300ms) so it doesn't linger during recognition
    canvasTimer.current = setTimeout(() => clearCanvas(), 300);
    // Keep hint visible longer so user can confirm what was recognized
    hintTimer.current = setTimeout(() => setHint(null), 1200);
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
    ctx.strokeStyle = 'rgba(50, 80, 200, 0.4)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    if (canvasTimer.current) clearTimeout(canvasTimer.current);
    if (hintTimer.current) clearTimeout(hintTimer.current);
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
      playClick();
      if (result === ' ') setHint('⎵');
      else if (result === '\b') setHint('⌫');
      else if (result === '\n') setHint('↵');
      else if (result === '.') setHint('·');
      else if (result === ',') setHint(',');
      else setHint(result.toUpperCase());
      setHintKey(String(Date.now()));
    } else {
      setHint('?');
      setHintKey(String(Date.now()));
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
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        {/* Center divider */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '10%',
            width: '1px',
            height: '80%',
            background: '#555',
            opacity: 0.3,
          }}
        />
        {/* Bottom-left label */}
        <div
          style={{
            position: 'absolute',
            bottom: '3px',
            left: '6px',
            color: '#aaa',
            fontSize: '9px',
            fontFamily: 'serif',
            fontStyle: 'italic',
            opacity: 0.5,
          }}
        >
          abc
        </div>
        {/* Bottom-right label */}
        <div
          style={{
            position: 'absolute',
            bottom: '3px',
            right: '6px',
            color: '#aaa',
            fontSize: '9px',
            fontFamily: 'serif',
            fontStyle: 'italic',
            opacity: 0.5,
          }}
        >
          123
        </div>
      </div>

      {/* Recognized character hint */}
      {hint && (
        <div
          key={hintKey}
          className="graffiti-hint-fade"
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
              fontSize: '48px',
              fontWeight: 'bold',
              color: '#3050cc',
              fontFamily: 'var(--font-palm), monospace',
              textShadow: '0 0 8px rgba(0,0,180,0.4)',
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
