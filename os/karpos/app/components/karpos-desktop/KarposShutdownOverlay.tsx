'use client';

import { useEffect, useMemo, useState } from 'react';

export function KarposShutdownOverlay({ open }: { open: boolean }) {
  const PIXEL_SIZE = 100;
  const MAX_ANIM_MS = 4000;
  const PIXEL_FADE_MS = 200;
  const [gridSize, setGridSize] = useState({ cols: 10, rows: 10 });
  const [started, setStarted] = useState(false);

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

  useEffect(() => {
    if (!open) {
      setStarted(false);
      return;
    }
    const raf = window.requestAnimationFrame(() => setStarted(true));
    return () => window.cancelAnimationFrame(raf);
  }, [open]);

  const pixelCount = gridSize.cols * gridSize.rows;
  const pixelTiles = useMemo(() => {
    const maxDelay = Math.max(0, MAX_ANIM_MS - PIXEL_FADE_MS);
    const ids = Array.from({ length: pixelCount }, (_, i) => i);
    // Fisher-Yates shuffle so dim order is random.
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

    return Array.from({ length: pixelCount }, (_, idx) => {
      const row = Math.floor(idx / gridSize.cols);
      const col = idx % gridSize.cols;
      return {
        id: idx,
        left: col * PIXEL_SIZE,
        top: row * PIXEL_SIZE,
        delayMs: delayById[idx],
      };
    });
  }, [MAX_ANIM_MS, PIXEL_FADE_MS, PIXEL_SIZE, gridSize.cols, pixelCount]);

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
