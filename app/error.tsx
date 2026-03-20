'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', maxWidth: 480 }}>
      <h2 style={{ margin: '0 0 12px 0', fontSize: 18 }}>Something went wrong</h2>
      <p style={{ margin: '0 0 16px 0', color: '#666' }}>{error.message}</p>
      <button
        type="button"
        onClick={reset}
        style={{
          padding: '8px 16px',
          background: '#0000a0',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer',
          fontSize: 14,
        }}
      >
        Try again
      </button>
    </div>
  );
}
