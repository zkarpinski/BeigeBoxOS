'use client';

import { useEffect } from 'react';
import { UnderwaterScreensaver } from './UnderwaterScreensaver';

export function ScreensaverOverlay({ onDismiss }: { onDismiss: () => void }) {
  useEffect(() => {
    const events: (keyof WindowEventMap)[] = ['mousemove', 'mousedown', 'keydown', 'touchstart'];
    const handler = () => onDismiss();

    // Brief delay so the events that triggered mounting don't immediately dismiss
    const listenTimer = setTimeout(() => {
      events.forEach((e) => window.addEventListener(e, handler));
    }, 600);

    return () => {
      clearTimeout(listenTimer);
      events.forEach((e) => window.removeEventListener(e, handler));
    };
  }, [onDismiss]);

  return (
    <div className="screensaver-overlay">
      <UnderwaterScreensaver />
    </div>
  );
}
