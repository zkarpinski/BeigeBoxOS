import React from 'react';

// ─── Silkscreen icons (white) ─────────────────────────────────────────────────

export function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 3L2 9.5V18h5.5v-5.5h5V18H18V9.5L10 3z" fill="white" />
    </svg>
  );
}

export function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="5" width="16" height="2" rx="1" fill="white" />
      <rect x="2" y="9" width="16" height="2" rx="1" fill="white" />
      <rect x="2" y="13" width="16" height="2" rx="1" fill="white" />
    </svg>
  );
}

export function CalcGridIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      {[0, 1, 2].map((row) =>
        [0, 1, 2].map((col) => (
          <rect
            key={`${row}-${col}`}
            x={2 + col * 6}
            y={2 + row * 6}
            width="5"
            height="5"
            rx="1"
            fill="white"
          />
        )),
      )}
    </svg>
  );
}

export function FindIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="9" cy="9" r="5.5" stroke="white" strokeWidth="2" />
      <line x1="13" y1="13" x2="18" y2="18" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// ─── SilkButton ───────────────────────────────────────────────────────────────

interface SilkButtonProps {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}

export function SilkButton({ onClick, title, children }: SilkButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '5px',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </button>
  );
}
