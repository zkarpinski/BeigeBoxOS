'use client';

import React, { useRef, useEffect } from 'react';
import { useAolDraggable } from './useAolDraggable';
import { AolIconSmall, AolLogoLarge } from './AolIcon';

export function AolSignOn({ onSignOn }: { onSignOn: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const c = containerRef.current;
    const d = dialogRef.current;
    if (!c || !d) return;
    const cr = c.getBoundingClientRect();
    const dw = 450;
    const dh = 280;
    d.style.left = Math.max(0, (cr.width - dw) / 2) + 'px';
    d.style.top = Math.max(0, (cr.height - dh) / 2) + 'px';
  }, []);

  useAolDraggable(dialogRef, containerRef, '.aol-signon-titlebar');

  return (
    <div ref={containerRef} className="aol-signon-container">
      <div ref={dialogRef} className="aol-signon-dialog aol-draggable-window">
        <div className="aol-signon-titlebar">
          <AolIconSmall /> Sign On
          <div className="aol-signon-titlebar-controls">
            <button className="aol-win-btn">_</button>
            <button className="aol-win-btn">□</button>
            <button className="aol-win-btn">X</button>
          </div>
        </div>
        <div className="aol-signon-body">
          <div className="aol-signon-left">
            <div className="aol-logo-container">
              <AolLogoLarge />
              <div className="aol-version">version 4.0</div>
            </div>
          </div>
          <div className="aol-signon-right">
            <div className="aol-signon-form">
              <div className="aol-form-group">
                <label>Select Screen Name:</label>
                <select defaultValue="Guest">
                  <option value="Guest">Guest</option>
                  <option value="F4stRunn3r200">F4stRunn3r200</option>
                  <option value="zKarpinski">zKarpinski</option>
                </select>
              </div>
              <div className="aol-form-group">
                <label>Select Location:</label>
                <select defaultValue="ISP">
                  <option value="ISP">ISP/LAN Connection</option>
                  <option value="Home">Home</option>
                </select>
              </div>
            </div>
            <div className="aol-signon-actions">
              <button className="aol-btn aol-btn-setup">SETUP</button>
              <button className="aol-btn aol-btn-help">HELP</button>
              <button className="aol-btn aol-btn-signon" onClick={onSignOn}>
                SIGN ON
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
