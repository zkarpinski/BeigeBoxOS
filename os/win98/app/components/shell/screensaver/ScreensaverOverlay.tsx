'use client';

import { useEffect } from 'react';
import { UnderwaterScreensaver } from './UnderwaterScreensaver';
import { SpaceScreensaver } from './SpaceScreensaver';

function ActiveScreensaver({ name }: { name: string }) {
  if (name === 'space') return <SpaceScreensaver />;
  return <UnderwaterScreensaver />;
}

export function ScreensaverOverlay({ name, onDismiss }: { name: string; onDismiss: () => void }) {
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
      <ActiveScreensaver name={name} />
    </div>
  );
}
