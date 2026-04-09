'use client';

import { useEffect, useState } from 'react';

type PixelTile = {
  id: number;
  left: number;
  top: number;
  delayMs: number;
};

export function KarposShutdownOverlay({ open }: { open: boolean }) {
  const PIXEL_SIZE = 100;
  const MAX_ANIM_MS = 4000;
  const PIXEL_FADE_MS = 200;
  const [gridSize, setGridSize] = useState({ cols: 0, rows: 0 });
  const [started, setStarted] = useState(false);
  const [pixelTiles, setPixelTiles] = useState<PixelTile[]>([]);

  useEffect(() => {
    if (!open) return;
    const updateGrid = () => {
      const cols = Math.max(1, Math.ceil(window.innerWidth / PIXEL_SIZE));
      const rows = Math.max(1, Math.ceil(window.innerHeight / PIXEL_SIZE));
      setGridSize({ cols, rows });
    };
    updateGrid();
    window.addEventListener('resize', updateGrid);
    return () => window.removeEventListener('resize', updateGrid);
  }, [open]);

  const pixelCount = gridSize.cols * gridSize.rows;

  useEffect(() => {
    if (!open || pixelCount === 0 || pixelTiles.length !== pixelCount) {
      setStarted(false);
      return;
    }
    // Double requestAnimationFrame ensures that the DOM is painted once with
    // initial opacity 0 before the `--started` class triggers the transition limit.
    const raf = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setStarted(true));
    });
    return () => window.cancelAnimationFrame(raf);
  }, [open, pixelTiles.length, pixelCount]);

  useEffect(() => {
    if (!open || pixelCount === 0) {
      setPixelTiles([]);
      return;
    }
    const maxDelay = Math.max(0, MAX_ANIM_MS - PIXEL_FADE_MS);
    const ids = Array.from({ length: pixelCount }, (_, i) => i);
    // Fisher-Yates shuffle — must run outside render (Math.random is impure).
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
  }, [open, pixelCount, gridSize.cols, gridSize.rows, MAX_ANIM_MS, PIXEL_FADE_MS, PIXEL_SIZE]);

  useEffect(() => {
    if (!open) return;
    document.body.classList.add('shutdown-active');
    return () => document.body.classList.remove('shutdown-active');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      window.location.href = 'https://zkarpinski.com';
    }, MAX_ANIM_MS);
    return () => window.clearTimeout(t);
  }, [open]);

  if (!open) return null;

  return (
    <div
      id="karpos-shutdown-overlay"
      className={`karpos-shutdown-overlay${started ? ' karpos-shutdown-overlay--started' : ''}`}
    >
      <div className="karpos-shutdown-grid" aria-hidden="true">
        {pixelTiles.map((tile) => (
          <div
            key={tile.id}
            className="karpos-shutdown-pixel"
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
      <div className="karpos-shutdown-message-wrap">
        <p className="karpos-shutdown-message">Thanks for visiting KarpOS...</p>
      </div>
    </div>
  );
}
