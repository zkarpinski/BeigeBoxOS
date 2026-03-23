'use client';

import React from 'react';

export function WordRuler() {
  return (
    <div className="ruler-container">
      <div className="ruler-left-controls">
        <div className="ruler-btn">L</div>
      </div>
      <div className="ruler">
        <div className="ruler-indent-left">
          <div className="indent-top" />
          <div className="indent-bottom" />
          <div className="indent-box" />
        </div>
        <div className="ruler-ticks">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <div key={n} className="ruler-tick-group">
              <span>{n}</span>
            </div>
          ))}
          {[10, 11, 12, 13, 14, 15].map((n) => (
            <div key={n} className="ruler-tick-group" style={{ width: '25px' }}>
              <span>{n}</span>
            </div>
          ))}
        </div>
        <div className="ruler-indent-right">
          <div className="indent-top" />
        </div>
      </div>
      <div className="ruler-right-padding" />
    </div>
  );
}
