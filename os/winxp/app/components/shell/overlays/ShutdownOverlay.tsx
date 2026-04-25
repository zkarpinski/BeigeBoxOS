'use client';

import { useEffect } from 'react';

export function ShutdownOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (open) {
      document.body.classList.add('shutdown-active');
    } else {
      document.body.classList.remove('shutdown-active');
    }
  }, [open]);

  const handleReturn = () => {
    try {
      localStorage.setItem('winxp-shutdown', '1');
    } catch (_) {}
    window.location.href = 'https://zkarpinski.com';
  };

  if (!open) return null;

  return (
    <div id="shutdown-overlay" className="shutdown-overlay" onClick={handleReturn}>
      <div className="shutdown-screen">
        <p className="shutdown-message">It is now safe to turn off your computer.</p>
        <p className="shutdown-hint">Click any where to return</p>
      </div>
    </div>
  );
}
