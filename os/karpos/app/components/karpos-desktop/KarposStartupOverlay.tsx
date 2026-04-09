'use client';

import { useEffect, useState } from 'react';

type PixelTile = {
  id: number;
  left: number;
  top: number;
  delayMs: number;
};

export function KarposStartupOverlay() {
  const PIXEL_SIZE = 100;
  const MAX_ANIM_MS = 1500;
  const PIXEL_FADE_MS = 150;
  const [gridSize, setGridSize] = useState({ cols: 0, rows: 0 });
  const [started, setStarted] = useState(false);
  const [visible, setVisible] = useState(true);
  const [pixelTiles, setPixelTiles] = useState<PixelTile[]>([]);

  useEffect(() => {
    const updateGrid = () => {
      const cols = Math.max(1, Math.ceil(window.innerWidth / PIXEL_SIZE));
      const rows = Math.max(1, Math.ceil(window.innerHeight / PIXEL_SIZE));
      setGridSize({ cols, rows });
    };
    updateGrid();
    window.addEventListener('resize', updateGrid);
    return () => window.removeEventListener('resize', updateGrid);
  }, []);

  const pixelCount = gridSize.cols * gridSize.rows;

  useEffect(() => {
    if (pixelCount === 0 || pixelTiles.length !== pixelCount) {
      return;
    }
    const raf = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setStarted(true));
    });
    return () => window.cancelAnimationFrame(raf);
  }, [pixelTiles.length, pixelCount]);

  useEffect(() => {
    if (pixelCount === 0) return;
    const maxDelay = Math.max(0, MAX_ANIM_MS - PIXEL_FADE_MS);
    const ids = Array.from({ length: pixelCount }, (_, i) => i);
    // Fisher-Yates shuffle
    for (let i = ids.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = ids[i];
      ids[i] = ids[j];
      ids[j] = tmp;
    }

    const delayById = new Array<number>(pixelCount).fill(0);
    const step = pixelCount > 1 ? maxDelay / (pixelCount - 1) : 0;
    ids.forEach((id, orderIdx) => {
      delayById[id] = Math.round(orderIdx * step);
    });

    setPixelTiles(
      Array.from({ length: pixelCount }, (_, idx) => {
        const row = Math.floor(idx / gridSize.cols);
        const col = idx % gridSize.cols;
        return {
          id: idx,
          left: col * PIXEL_SIZE,
          top: row * PIXEL_SIZE,
          delayMs: delayById[idx] ?? 0,
        };
      }),
    );
  }, [pixelCount, gridSize.cols, gridSize.rows, MAX_ANIM_MS, PIXEL_FADE_MS, PIXEL_SIZE]);

  useEffect(() => {
    if (!started) return;
    const t = window.setTimeout(() => {
      setVisible(false);
    }, MAX_ANIM_MS + PIXEL_FADE_MS);
    return () => window.clearTimeout(t);
  }, [started, MAX_ANIM_MS, PIXEL_FADE_MS]);

  if (!visible) return null;

  return (
    <div
      id="karpos-startup-overlay"
      className={`karpos-startup-overlay${started ? ' karpos-startup-overlay--started' : ''}`}
    >
      <div className="karpos-startup-grid" aria-hidden="true">
        {pixelTiles.map((tile) => (
          <div
            key={tile.id}
            className="karpos-startup-pixel"
            style={{
              left: `${tile.left}px`,
              top: `${tile.top}px`,
              width: `${PIXEL_SIZE}px`,
              height: `${PIXEL_SIZE}px`,
              transitionDelay: `${tile.delayMs}ms`,
              transitionDuration: `${PIXEL_FADE_MS}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
