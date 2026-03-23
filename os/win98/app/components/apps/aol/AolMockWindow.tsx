'use client';

import React, { forwardRef } from 'react';
import { AolIconSmall } from './AolIcon';

export interface AolMockWindowProps {
  activeWindow: string;
  onClose: () => void;
}

export const AolMockWindow = forwardRef<HTMLDivElement, AolMockWindowProps>(function AolMockWindow(
  { activeWindow, onClose },
  ref,
) {
  return (
    <div ref={ref} className="aol-mock-window" style={{ top: '50px', left: '350px', zIndex: 10 }}>
      <div className="aol-mock-titlebar">
        <AolIconSmall /> {activeWindow}
        <div className="aol-mock-titlebar-controls">
          <button className="aol-win-btn" onClick={onClose}>
            X
          </button>
        </div>
      </div>
      <div className="aol-mock-body">
        <h3>Welcome to {activeWindow}</h3>
        <p>This is a simulated area for the {activeWindow} channel.</p>
        {activeWindow === 'Games' && <p>Play the best online games here!</p>}
        {activeWindow === 'NEWS' && <p>Top stories of the hour...</p>}
        {activeWindow === 'AOL Today' && <p>What's happening today on America Online.</p>}
        <button onClick={onClose} style={{ marginTop: '20px' }}>
          Close Window
        </button>
      </div>
    </div>
  );
});
