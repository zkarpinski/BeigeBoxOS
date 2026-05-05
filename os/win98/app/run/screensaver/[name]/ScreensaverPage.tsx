'use client';

import { useEffect } from 'react';
import { UnderwaterScreensaver } from '../../../components/shell/screensaver/UnderwaterScreensaver';

export function ScreensaverPage() {
  // Dismiss to home on any input
  useEffect(() => {
    const events: (keyof WindowEventMap)[] = ['mousedown', 'keydown', 'touchstart'];
    const handler = () => (window.location.href = '/');
    const t = setTimeout(() => events.forEach((e) => window.addEventListener(e, handler)), 600);
    return () => {
      clearTimeout(t);
      events.forEach((e) => window.removeEventListener(e, handler));
    };
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, cursor: 'none', background: '#000' }}>
      <UnderwaterScreensaver />
    </div>
  );
}
