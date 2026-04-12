import React from 'react';

// ─── Hardware button icons (dark, engraved) ───────────────────────────────────

export function DateBookHWIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="1.5" y="3" width="15" height="13" rx="1.5" stroke="#444" strokeWidth="1.5" />
      <line x1="1.5" y1="7" x2="16.5" y2="7" stroke="#444" strokeWidth="1.5" />
      <line x1="5.5" y1="1" x2="5.5" y2="5" stroke="#444" strokeWidth="1.5" strokeLinecap="round" />
      <line
        x1="12.5"
        y1="1"
        x2="12.5"
        y2="5"
        stroke="#444"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AddressHWIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="7" r="3.5" stroke="#444" strokeWidth="1.5" />
      <path
        d="M2 16c0-3.9 3.1-7 7-7s7 3.1 7 7"
        stroke="#444"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function TodoHWIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="1.5" y="1.5" width="15" height="15" rx="1.5" stroke="#444" strokeWidth="1.5" />
      <polyline
        points="4.5,9 7.5,12 13.5,5.5"
        stroke="#444"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function NoteHWIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2.5" y="1.5" width="13" height="15" rx="1.5" stroke="#444" strokeWidth="1.5" />
      <line
        x1="5.5"
        y1="6"
        x2="12.5"
        y2="6"
        stroke="#444"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="5.5"
        y1="9"
        x2="12.5"
        y2="9"
        stroke="#444"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <line
        x1="5.5"
        y1="12"
        x2="9.5"
        y2="12"
        stroke="#444"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── HardwareButton ───────────────────────────────────────────────────────────

interface HardwareButtonProps {
  onClick: () => void;
  title: string;
  isMobile: boolean;
  children: React.ReactNode;
}

export function HardwareButton({ onClick, title, isMobile, children }: HardwareButtonProps) {
  const size = isMobile ? '50px' : '40px';
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'linear-gradient(to bottom, #d8d8d8, #b0b0b0)',
        border: '1px solid #888',
        boxShadow: '0 3px 0 #666, inset 0 1px 0 rgba(255,255,255,0.6)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}
