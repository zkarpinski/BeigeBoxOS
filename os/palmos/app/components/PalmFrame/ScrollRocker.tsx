import React from 'react';

interface ScrollRockerProps {
  onScrollUp: () => void;
  onScrollDown: () => void;
  isMobile: boolean;
}

export function ScrollRocker({ onScrollUp, onScrollDown, isMobile }: ScrollRockerProps) {
  const w = isMobile ? '44px' : '36px';
  const h = isMobile ? '25px' : '22px';
  const baseStyle: React.CSSProperties = {
    width: w,
    height: h,
    border: '1px solid #888',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <button
        onClick={onScrollUp}
        title="Scroll Up"
        style={{
          ...baseStyle,
          borderRadius: '4px 4px 0 0',
          background: 'linear-gradient(to bottom, #d4d4d4, #b0b0b0)',
          borderBottom: '1px solid #999',
          boxShadow: '0 2px 0 #666, inset 0 1px 0 rgba(255,255,255,0.5)',
        }}
      >
        <svg width="10" height="7" viewBox="0 0 10 7">
          <polygon points="5,0.5 9.5,6.5 0.5,6.5" fill="#555" />
        </svg>
      </button>
      <button
        onClick={onScrollDown}
        title="Scroll Down"
        style={{
          ...baseStyle,
          borderRadius: '0 0 4px 4px',
          background: 'linear-gradient(to bottom, #b0b0b0, #d4d4d4)',
          borderTop: 'none',
          boxShadow: '0 2px 0 #666',
        }}
      >
        <svg width="10" height="7" viewBox="0 0 10 7">
          <polygon points="5,6.5 9.5,0.5 0.5,0.5" fill="#555" />
        </svg>
      </button>
    </div>
  );
}
