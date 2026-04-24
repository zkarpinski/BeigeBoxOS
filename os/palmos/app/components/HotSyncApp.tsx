'use client';

import React, { useState, useEffect } from 'react';

interface HotSyncAppProps {
  onComplete: () => void;
}

export function HotSyncApp({ onComplete }: HotSyncAppProps) {
  const [phase, setPhase] = useState<'syncing' | 'complete'>('syncing');

  useEffect(() => {
    const syncTimer = setTimeout(() => setPhase('complete'), 2800);
    return () => clearTimeout(syncTimer);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
        background: 'white',
        gap: '12px',
      }}
    >
      <style>{`
        @keyframes hotsync-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes hotsync-fill {
          from { width: 0%; }
          to   { width: 100%; }
        }
      `}</style>

      {/* HotSync logo */}
      <div
        style={{
          width: '72px',
          height: '72px',
          position: 'relative',
          animation: phase === 'syncing' ? 'hotsync-spin 1.1s linear infinite' : 'none',
        }}
      >
        <svg width="72" height="72" viewBox="0 0 72 72">
          {/* Outer ring background */}
          <circle cx="36" cy="36" r="32" fill="none" stroke="#e0e0e0" strokeWidth="8" />

          {/* Upper arc — clockwise from ~210° to ~30° */}
          <path
            d="M 36,4 A 32,32 0 1,1 12.2,52"
            fill="none"
            stroke="#1A1A8C"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Arrowhead at end of upper arc (pointing down-right at ~210°) */}
          <polygon points="12.2,52 6,42 22,44" fill="#1A1A8C" />

          {/* Lower arc — clockwise from ~30° to ~210° */}
          <path
            d="M 36,68 A 32,32 0 1,1 59.8,20"
            fill="none"
            stroke="#1A1A8C"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Arrowhead at end of lower arc (pointing up-left at ~30°) */}
          <polygon points="59.8,20 66,30 50,28" fill="#1A1A8C" />
        </svg>
      </div>

      {/* Brand name */}
      <div
        style={{
          fontSize: '13px',
          fontWeight: 'bold',
          color: '#1A1A8C',
          letterSpacing: '1px',
        }}
      >
        HotSync
      </div>

      {phase === 'syncing' ? (
        <>
          {/* Progress bar */}
          <div
            style={{
              width: '160px',
              height: '8px',
              border: '1px solid #333',
              background: '#f0f0f0',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                background: '#1A1A8C',
                animation: 'hotsync-fill 2.6s linear forwards',
              }}
            />
          </div>

          <div style={{ fontSize: '10px', color: '#555' }}>Synchronizing...</div>
        </>
      ) : (
        <>
          {/* Complete state */}
          <div style={{ fontSize: '11px', color: '#008000', fontWeight: 'bold' }}>
            HotSync Complete
          </div>

          {/* Progress bar full */}
          <div
            style={{
              width: '160px',
              height: '8px',
              border: '1px solid #333',
              background: '#1A1A8C',
            }}
          />

          <button
            onClick={onComplete}
            style={{
              marginTop: '4px',
              border: '2px solid #000',
              background: 'white',
              padding: '2px 20px',
              fontSize: '11px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            OK
          </button>
        </>
      )}
    </div>
  );
}
