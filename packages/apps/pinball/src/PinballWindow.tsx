'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import type { AppConfig } from '@retro-web/core';
import { useOsShell } from '@retro-web/core/context';
import { usePinballGame } from './usePinballGame';

export const PINBALL_ICON_SRC = 'apps/pinball/pinball-icon.png';

export type PinballSkin = 'karpos' | (string & {});

export const pinballAppConfig: AppConfig = {
  id: 'pinball',
  label: 'Nebula Pinball',
  icon: PINBALL_ICON_SRC,
  desktop: true,
  startMenu: { path: ['Programs', 'Games'] },
  taskbarLabel: 'Nebula Pinball',
};

export type PinballWindowProps = {
  skin?: PinballSkin;
};

/** Reference table size — canvas is always this aspect ratio */
const TABLE_W = 320;
const TABLE_H = 480;

export function PinballWindow({ skin = 'karpos' }: PinballWindowProps) {
  const { AppWindow, TitleBar } = useOsShell();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { gameState, newGame } = usePinballGame(canvasRef);

  // Resize canvas to fill container while preserving 2:3 aspect ratio
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    function resize() {
      if (!container || !canvas) return;
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      const scale = Math.min(cw / TABLE_W, ch / TABLE_H);
      canvas.width = Math.floor(TABLE_W * scale);
      canvas.height = Math.floor(TABLE_H * scale);
      canvas.style.width = canvas.width + 'px';
      canvas.style.height = canvas.height + 'px';
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Touch controls: tap left/right half for flippers, bottom center for plunger
  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      const w = rect.width;
      const h = rect.height;
      if (y > h * 0.75) {
        // Bottom third: plunger area
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
      } else if (x < w / 2) {
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ShiftLeft' }));
      } else {
        window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ShiftRight' }));
      }
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      const w = rect.width;
      const h = rect.height;
      if (y > h * 0.75) {
        window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' }));
      } else if (x < w / 2) {
        window.dispatchEvent(new KeyboardEvent('keyup', { code: 'ShiftLeft' }));
      } else {
        window.dispatchEvent(new KeyboardEvent('keyup', { code: 'ShiftRight' }));
      }
    }
  }, []);

  return (
    <AppWindow
      id="pinball-window"
      appId="pinball"
      className="pinball-window app-window app-window-hidden"
      titleBar={
        <TitleBar
          title="Nebula Pinball"
          icon={
            <img
              src={PINBALL_ICON_SRC}
              alt="Nebula Pinball"
              style={{ width: 16, height: 16, marginRight: 4 }}
            />
          }
          showMin
          showMax={false}
          showClose
        />
      }
    >
      <div data-pinball-skin={skin} className="pinball-app">
        {/* Menu bar */}
        <div className="pinball-menu">
          <button className="pinball-menu-btn" onClick={newGame}>
            Game
          </button>
          <span className="pinball-menu-item" onClick={newGame}>
            New Game (F2)
          </span>
          <span className="pinball-menu-sep" />
          <span className="pinball-rank">{gameState.rank}</span>
        </div>

        {/* Canvas container */}
        <div className="pinball-canvas-container" ref={containerRef}>
          <canvas
            ref={canvasRef}
            className="pinball-canvas"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          />
        </div>

        {/* Controls hint */}
        <div className="pinball-controls">
          <span>
            Z / ⇧L Flipper&nbsp;&nbsp;/ / ⇧R Flipper&nbsp;&nbsp;Space Plunge&nbsp;&nbsp;X
            Nudge&nbsp;&nbsp;F2 New
          </span>
        </div>
      </div>
    </AppWindow>
  );
}
