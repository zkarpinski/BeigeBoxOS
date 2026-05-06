'use client';

import React, { useEffect } from 'react';

interface ScreensaverContainerProps {
  children: React.ReactNode;
  onDismiss?: () => void;
  background?: string;
}

export function ScreensaverContainer({
  children,
  onDismiss,
  background = '#000',
}: ScreensaverContainerProps) {
  useEffect(() => {
    const events: (keyof WindowEventMap)[] = ['mousedown', 'keydown', 'touchstart'];
    const handler = () => {
      if (onDismiss) {
        onDismiss();
      } else {
        window.location.href = '/';
      }
    };

    // Delay adding listeners slightly to avoid immediate dismissal if the user just clicked to launch it
    const t = setTimeout(() => {
      events.forEach((e) => window.addEventListener(e, handler));
    }, 600);

    return () => {
      clearTimeout(t);
      events.forEach((e) => window.removeEventListener(e, handler));
    };
  }, [onDismiss]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        cursor: 'none',
        background,
        zIndex: 999999, // Above everything
      }}
    >
      {children}
    </div>
  );
}
