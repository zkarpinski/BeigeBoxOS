'use client';

import React, { useState, useEffect } from 'react';

export function PalmStatusBar() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase();

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
      {/* Time - blue box on left */}
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

      {/* Battery indicator - centered */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
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

      {/* Category dropdown - right */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '2px',
          padding: '0 6px',
          color: '#000',
        }}
      >
        <span style={{ fontSize: '8px' }}>▼</span>
        <span>All</span>
      </div>
    </div>
  );
}
