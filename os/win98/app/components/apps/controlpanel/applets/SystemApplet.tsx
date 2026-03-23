'use client';

import React, { useRef, useEffect } from 'react';
import { useDraggable, centerDialog } from './shared';

const SYSTEM_ICON = 'apps/controlpanel/system.png';

export function SystemApplet({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleMouseDown = useDraggable(dialogRef);

  useEffect(() => {
    if (dialogRef.current) centerDialog(dialogRef.current, 420, 300);
  }, []);

  return (
    <div id="system-dialog" ref={dialogRef}>
      <div className="dp-titlebar" onMouseDown={titleMouseDown}>
        <span className="dp-titlebar-text">
          <img
            src={SYSTEM_ICON}
            alt=""
            style={{ width: 14, height: 14, imageRendering: 'pixelated' }}
          />
          {' System Properties'}
        </span>
        <div className="dp-titlebar-btns">
          <button className="dp-titlebtn" title="Help">
            ?
          </button>
          <button className="dp-titlebtn" title="Close" onClick={onClose}>
            ✕
          </button>
        </div>
      </div>
      <div className="dp-tabs">
        <button className="dp-tab active">General</button>
        <button className="dp-tab disabled" disabled>
          Device Manager
        </button>
        <button className="dp-tab disabled" disabled>
          Hardware Profiles
        </button>
        <button className="dp-tab disabled" disabled>
          Performance
        </button>
      </div>
      <div className="dp-panel-border">
        <div className="sys-general-panel">
          <div className="sys-top-row">
            <svg className="sys-win-logo" width="48" height="48" viewBox="0 0 48 48">
              <rect x="2" y="2" width="20" height="20" fill="#f35325" />
              <rect x="26" y="2" width="20" height="20" fill="#80bb01" />
              <rect x="2" y="26" width="20" height="20" fill="#05a6f0" />
              <rect x="26" y="26" width="20" height="20" fill="#ffba08" />
            </svg>
            <div className="sys-ms-text">
              <div className="sys-ms-line1">Microsoft Windows 98</div>
              <div className="sys-ms-line2">4.10.2222 A</div>
              <div className="sys-ms-line3">Second Edition</div>
            </div>
          </div>
          <div className="sys-divider" />
          <div className="sys-info-section">
            <div className="sys-info-label">Registered to:</div>
            <div className="sys-info-value">Windows User</div>
            <div className="sys-info-value sys-serial">55274-OEM-0000007-00000</div>
          </div>
          <div className="sys-divider" />
          <div className="sys-info-section">
            <div className="sys-info-label">Computer:</div>
            <div className="sys-info-value">GenuineIntel</div>
            <div className="sys-info-value">Pentium(r) II Processor</div>
            <div className="sys-info-value">400 MHz</div>
            <div className="sys-info-value">128.0 MB RAM</div>
          </div>
        </div>
      </div>
      <div className="dp-footer">
        <button className="dp-footer-btn default-btn" onClick={onClose}>
          OK
        </button>
        <button className="dp-footer-btn" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
