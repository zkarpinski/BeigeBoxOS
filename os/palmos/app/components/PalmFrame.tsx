'use client';

import React from 'react';
import { usePalmSounds } from '../hooks/usePalmSounds';

interface PalmFrameProps {
  children: React.ReactNode;
  onHomeClick?: () => void;
  onMenuClick?: () => void;
  onSearchClick?: () => void;
  onCalcClick?: () => void;
  onAppButtonClick?: (app: string) => void;
  onScroll?: (direction: 'up' | 'down') => void;
}

// Silkscreen icons (white, matching Palm m505 silk area)
function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M10 3L2 9.5V18h5.5v-5.5h5V18H18V9.5L10 3z" fill="white" />
    </svg>
  );
}
function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="5" width="16" height="2" rx="1" fill="white" />
      <rect x="2" y="9" width="16" height="2" rx="1" fill="white" />
      <rect x="2" y="13" width="16" height="2" rx="1" fill="white" />
    </svg>
  );
}
function CalcGridIcon() {
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
function FindIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="9" cy="9" r="5.5" stroke="white" strokeWidth="2" />
      <line x1="13" y1="13" x2="18" y2="18" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// Hardware button icons (dark, engraved look)
function DateBookHWIcon() {
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
function AddressHWIcon() {
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
function TodoHWIcon() {
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
function NoteHWIcon() {
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

const silkBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '5px',
  borderRadius: '4px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const hwBtnStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  background: 'linear-gradient(to bottom, #d8d8d8, #b0b0b0)',
  border: '1px solid #888',
  boxShadow: '0 3px 0 #666, inset 0 1px 0 rgba(255,255,255,0.6)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

export function PalmFrame({
  children,
  onHomeClick,
  onMenuClick,
  onSearchClick,
  onCalcClick,
  onAppButtonClick,
  onScroll,
}: PalmFrameProps) {
  const { playClick } = usePalmSounds();

  const handleHomeClick = () => {
    playClick();
    onHomeClick?.();
  };
  const handleAppButtonClick = (app: string) => {
    playClick();
    onAppButtonClick?.(app);
  };
  const handleCalcClick = () => {
    playClick();
    onCalcClick?.();
  };
  const handleSearchClick = () => {
    playClick();
    onSearchClick?.();
  };
  const handleMenuClick = () => {
    playClick();
    onMenuClick?.();
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#222',
        padding: '28px',
      }}
    >
      {/* Device chassis — silver/gray metallic body */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '312px',
          background: 'linear-gradient(155deg, #e6e6e6 0%, #c4c4c4 45%, #a6a6a6 100%)',
          borderRadius: '34px 34px 18px 18px',
          boxShadow:
            '4px 5px 0 #808080, 0 10px 40px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.7)',
          paddingBottom: '14px',
          border: '1px solid #b0b0b0',
        }}
      >
        {/* palm / m505 logos */}
        <div
          style={{
            position: 'absolute',
            top: '13px',
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0 20px',
            boxSizing: 'border-box',
            color: '#555',
            opacity: 0.75,
          }}
        >
          <span
            style={{
              fontFamily: 'serif',
              fontStyle: 'italic',
              fontSize: '15px',
              fontWeight: 'bold',
            }}
          >
            palm
          </span>
          <span style={{ fontFamily: 'sans-serif', fontSize: '11px', letterSpacing: '1px' }}>
            m505
          </span>
        </div>

        {/* Speaker slot */}
        <div
          style={{
            marginTop: '40px',
            marginBottom: '7px',
            width: '56px',
            height: '4px',
            borderRadius: '2px',
            background: 'linear-gradient(to right, #888, #ccc, #888)',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.4)',
          }}
        />

        {/* Screen bezel */}
        <div
          style={{
            background: '#282828',
            borderRadius: '3px',
            padding: '4px',
            boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.9)',
            border: '1px solid #111',
          }}
        >
          <div
            style={{
              width: '264px',
              height: '264px',
              overflow: 'hidden',
              background: 'white',
              position: 'relative',
            }}
          >
            {children}
          </div>
        </div>

        {/* Graffiti / silk area */}
        <div
          style={{
            width: '272px',
            height: '94px',
            marginTop: '7px',
            background: 'linear-gradient(to bottom, #383838, #282828)',
            borderRadius: '4px',
            border: '1px solid #111',
            display: 'flex',
            alignItems: 'stretch',
            flexShrink: 0,
            overflow: 'hidden',
          }}
        >
          {/* Left silk buttons */}
          <div
            style={{
              width: '38px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-evenly',
              padding: '4px 0',
            }}
          >
            <button onClick={handleHomeClick} style={silkBtnStyle} title="Home">
              <HomeIcon />
            </button>
            <button onClick={handleMenuClick} style={silkBtnStyle} title="Menu">
              <MenuIcon />
            </button>
          </div>

          {/* Graffiti input — abc | 123 */}
          <div
            style={{
              flex: 1,
              borderLeft: '1px solid #1a1a1a',
              borderRight: '1px solid #1a1a1a',
              display: 'flex',
            }}
          >
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#aaa',
                fontSize: '18px',
                fontFamily: 'serif',
                fontStyle: 'italic',
                opacity: 0.4,
              }}
            >
              abc
            </div>
            <div style={{ width: '1px', background: '#555', margin: '10px 0' }} />
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#aaa',
                fontSize: '18px',
                fontFamily: 'serif',
                fontStyle: 'italic',
                opacity: 0.4,
              }}
            >
              123
            </div>
          </div>

          {/* Right silk buttons */}
          <div
            style={{
              width: '38px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-evenly',
              padding: '4px 0',
            }}
          >
            <button onClick={handleCalcClick} style={silkBtnStyle} title="Calculator">
              <CalcGridIcon />
            </button>
            <button onClick={handleSearchClick} style={silkBtnStyle} title="Find">
              <FindIcon />
            </button>
          </div>
        </div>

        {/* Hardware buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '272px',
            marginTop: '12px',
            padding: '0 6px',
          }}
        >
          <button
            onClick={() => handleAppButtonClick('datebook')}
            style={hwBtnStyle}
            title="Date Book"
          >
            <DateBookHWIcon />
          </button>

          <button
            onClick={() => handleAppButtonClick('address')}
            style={hwBtnStyle}
            title="Address"
          >
            <AddressHWIcon />
          </button>

          {/* Scroll rocker (pill shape) */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <button
              onClick={() => {
                playClick();
                onScroll?.('up');
              }}
              title="Scroll Up"
              style={{
                width: '36px',
                height: '22px',
                borderRadius: '4px 4px 0 0',
                background: 'linear-gradient(to bottom, #d4d4d4, #b0b0b0)',
                border: '1px solid #888',
                borderBottom: '1px solid #999',
                boxShadow: '0 2px 0 #666, inset 0 1px 0 rgba(255,255,255,0.5)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="10" height="7" viewBox="0 0 10 7">
                <polygon points="5,0.5 9.5,6.5 0.5,6.5" fill="#555" />
              </svg>
            </button>
            <button
              onClick={() => {
                playClick();
                onScroll?.('down');
              }}
              title="Scroll Down"
              style={{
                width: '36px',
                height: '22px',
                borderRadius: '0 0 4px 4px',
                background: 'linear-gradient(to bottom, #b0b0b0, #d4d4d4)',
                border: '1px solid #888',
                borderTop: 'none',
                boxShadow: '0 2px 0 #666',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="10" height="7" viewBox="0 0 10 7">
                <polygon points="5,6.5 9.5,0.5 0.5,0.5" fill="#555" />
              </svg>
            </button>
          </div>

          <button
            onClick={() => handleAppButtonClick('todo')}
            style={hwBtnStyle}
            title="To Do List"
          >
            <TodoHWIcon />
          </button>

          <button onClick={() => handleAppButtonClick('memo')} style={hwBtnStyle} title="Note Pad">
            <NoteHWIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
