'use client';

import React from 'react';
import { useToast } from '@retro-web/core/context';

const ICONS: Record<string, string> = {
  info: 'ℹ',
  success: '✓',
  warning: '⚠',
  error: '✕',
};

export function KarposToasts() {
  const { toasts, removeToast } = useToast();
  if (toasts.length === 0) return null;

  return (
    <div className="karp-toasts" role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`karp-toast karp-toast-${toast.type}`} role="alert">
          <span className="karp-toast-icon" aria-hidden="true">
            {ICONS[toast.type]}
          </span>
          <span className="karp-toast-msg">{toast.message}</span>
          <button
            className="karp-toast-close"
            onClick={() => removeToast(toast.id)}
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
