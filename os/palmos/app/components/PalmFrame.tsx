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
    <div className="palm-page-wrapper">
      {/* Device chassis — silver/gray metallic body */}
      <div className="palm-chassis">
        {/* palm / m505 logos */}
        <div className="palm-logos">
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
        <div className="palm-speaker" />

        {/* Screen bezel */}
        <div className="palm-bezel">
          <div className="palm-screen">{children}</div>
        </div>

        {/* Graffiti / silk area */}
        <div className="palm-silk-area">
          {/* Left silk buttons */}
          <div className="palm-silk-btn-column">
            <button onClick={handleHomeClick} className="palm-silk-btn" title="Home">
              <HomeIcon />
            </button>
            <button onClick={handleMenuClick} className="palm-silk-btn" title="Menu">
              <MenuIcon />
            </button>
          </div>

          {/* Graffiti input — abc | 123 */}
          <div className="palm-graffiti-container">
            <div className="palm-graffiti-input">abc</div>
            <div className="palm-graffiti-divider" />
            <div className="palm-graffiti-input">123</div>
          </div>

          {/* Right silk buttons */}
          <div className="palm-silk-btn-column">
            <button onClick={handleCalcClick} className="palm-silk-btn" title="Calculator">
              <CalcGridIcon />
            </button>
            <button onClick={handleSearchClick} className="palm-silk-btn" title="Find">
              <FindIcon />
            </button>
          </div>
        </div>

        {/* Hardware buttons */}
        <div className="palm-hardware-buttons">
          <button
            onClick={() => handleAppButtonClick('datebook')}
            className="palm-hw-btn"
            title="Date Book"
          >
            <DateBookHWIcon />
          </button>

          <button
            onClick={() => handleAppButtonClick('address')}
            className="palm-hw-btn"
            title="Address"
          >
            <AddressHWIcon />
          </button>

          {/* Scroll rocker (pill shape) */}
          <div className="palm-scroll-rocker">
            <button
              onClick={() => {
                playClick();
                onScroll?.('up');
              }}
              title="Scroll Up"
              className="palm-scroll-btn palm-scroll-btn-up"
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
              className="palm-scroll-btn palm-scroll-btn-down"
            >
              <svg width="10" height="7" viewBox="0 0 10 7">
                <polygon points="5,6.5 9.5,0.5 0.5,0.5" fill="#555" />
              </svg>
            </button>
          </div>

          <button
            onClick={() => handleAppButtonClick('todo')}
            className="palm-hw-btn"
            title="To Do List"
          >
            <TodoHWIcon />
          </button>

          <button
            onClick={() => handleAppButtonClick('memo')}
            className="palm-hw-btn"
            title="Note Pad"
          >
            <NoteHWIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
