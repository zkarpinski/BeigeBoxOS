'use client';

import React, { useState, useEffect } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

interface Shortcut {
  label: string;
  onClick: () => void;
}

interface PalmStatusBarProps {
  appTitle?: string;
  showCategory?: boolean;
  shortcuts?: Shortcut[];
  onTitleClick?: () => void;
}

export function PalmStatusBar({
  appTitle,
  showCategory,
  shortcuts,
  onTitleClick,
}: PalmStatusBarProps = {}) {
  const [time, setTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);

    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFsChange);

    return () => {
      clearInterval(timer);
      document.removeEventListener('fullscreenchange', handleFsChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const timeStr = time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase();

  // App mode: title pill left + white space + bordered shortcut boxes right
  if (appTitle) {
    return (
      <div
        style={{
          display: 'flex',
          height: '22px',
          width: '100%',
          alignItems: 'stretch',
          borderBottom: '2px solid #000',
          background: 'white',
          fontFamily: 'sans-serif',
          fontWeight: 'bold',
          flexShrink: 0,
        }}
      >
        {/* Title pill */}
        <div
          onClick={onTitleClick}
          style={{
            backgroundColor: '#1A1A8C',
            color: 'white',
            padding: '0 8px',
            display: 'flex',
            alignItems: 'center',
            fontSize: '15px',
            borderBottomRightRadius: '6px',
            whiteSpace: 'nowrap',
            cursor: onTitleClick ? 'pointer' : 'default',
          }}
        >
          {appTitle}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Shortcut boxes */}
        {shortcuts && shortcuts.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'stretch',
              border: '1px solid #000',
              borderBottom: 'none',
            }}
          >
            {shortcuts.map(({ label, onClick }) => (
              <button
                key={label}
                onClick={onClick}
                style={{
                  width: '20px',
                  background: 'white',
                  border: 'none',
                  borderLeft: '1px solid #000',
                  color: '#000',
                  fontFamily: 'sans-serif',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Full screen toggle */}
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
          style={{
            background: 'none',
            border: 'none',
            padding: '0 6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#000',
          }}
        >
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>

        {/* Category picker for list apps */}
        {showCategory && (
          <div
            style={{
              color: '#000',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              paddingRight: '6px',
              fontSize: '13px',
            }}
          >
            <span style={{ fontSize: '8px' }}>▼</span>
            <span>All</span>
          </div>
        )}
      </div>
    );
  }

  // Launcher mode: time + battery + category
  return (
    <div
      style={{
        display: 'flex',
        height: '22px',
        width: '100%',
        alignItems: 'stretch',
        borderBottom: '1px solid #000',
        fontSize: '15px',
        fontWeight: 'bold',
        fontFamily: 'sans-serif',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          backgroundColor: '#1A1A8C',
          color: 'white',
          padding: '0 6px',
          display: 'flex',
          alignItems: 'center',
          minWidth: '62px',
          borderBottomRightRadius: '6px',
        }}
      >
        {timeStr}
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div
          style={{
            position: 'relative',
            width: '28px',
            height: '10px',
            border: '1px solid #333',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: '1px',
              top: '1px',
              bottom: '1px',
              width: '75%',
              background: 'linear-gradient(to bottom, #74ff74, #008000)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: '-3px',
              top: '2px',
              width: '2px',
              height: '5px',
              background: '#333',
            }}
          />
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '0 6px',
          color: '#000',
        }}
      >
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
          style={{
            background: 'none',
            border: 'none',
            padding: '2px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#000',
          }}
        >
          {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <span style={{ fontSize: '8px' }}>▼</span>
          <span>All</span>
        </div>
      </div>
    </div>
  );
}
