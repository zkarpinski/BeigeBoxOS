'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useDraggable, centerDialog } from './shared';

const DISPLAY_ICON = 'apps/controlpanel/display.png';

const WALLPAPERS = [
  { id: 'none', label: '(None)', src: null as string | null },
  { id: 'clouds', label: 'Clouds', src: 'shell/images/clouds.png' },
];

export function DisplayApplet({
  appliedWallpaper,
  onApply,
  onClose,
}: {
  appliedWallpaper: string;
  onApply: (id: string) => void;
  onClose: () => void;
}) {
  const [pending, setPending] = useState(appliedWallpaper);
  const [applyEnabled, setApplyEnabled] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleMouseDown = useDraggable(dialogRef);

  useEffect(() => {
    if (dialogRef.current) centerDialog(dialogRef.current, 420, 340);
  }, []);

  const pendingWp = WALLPAPERS.find((w) => w.id === pending);

  function handleSelect(id: string) {
    setPending(id);
    setApplyEnabled(id !== appliedWallpaper);
  }

  function handleApply() {
    onApply(pending);
    setApplyEnabled(false);
  }
  function handleOk() {
    onApply(pending);
    onClose();
  }

  return (
    <div id="display-properties-dialog" ref={dialogRef}>
      <div className="dp-titlebar" onMouseDown={titleMouseDown}>
        <span className="dp-titlebar-text">
          <img
            src={DISPLAY_ICON}
            alt=""
            style={{ width: 14, height: 14, imageRendering: 'pixelated' }}
          />
          {' Display Properties'}
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
        <button className="dp-tab active">Background</button>
        <button className="dp-tab disabled" disabled>
          Screen Saver
        </button>
        <button className="dp-tab disabled" disabled>
          Appearance
        </button>
        <button className="dp-tab disabled" disabled>
          Effects
        </button>
        <button className="dp-tab disabled" disabled>
          Web
        </button>
        <button className="dp-tab disabled" disabled>
          Settings
        </button>
      </div>
      <div className="dp-panel-border">
        <div className="dp-monitor-wrap">
          <div className="dp-monitor">
            <div className="dp-monitor-outer">
              <div
                className="dp-monitor-screen"
                style={pendingWp?.src ? {} : { background: '#008080' }}
              >
                {pendingWp?.src && (
                  <img
                    src={pendingWp.src}
                    alt=""
                    className="visible"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
              </div>
            </div>
            <div className="dp-monitor-stand" />
            <div className="dp-monitor-base" />
          </div>
        </div>
        <div className="dp-wallpaper-section">
          <div className="dp-wallpaper-label">Wallpaper</div>
          <div className="dp-wallpaper-sublabel">Select an HTML Document or a picture:</div>
          <div className="dp-wallpaper-row">
            <ul className="dp-wallpaper-list">
              {WALLPAPERS.map((wp) => (
                <li
                  key={wp.id}
                  className={pending === wp.id ? 'selected' : ''}
                  onClick={() => handleSelect(wp.id)}
                >
                  {wp.src ? (
                    <svg width="14" height="14" viewBox="0 0 14 14">
                      <rect width="14" height="14" rx="1" fill="#87ceeb" />
                      <rect x="0" y="8" width="14" height="6" fill="#5ab" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 14 14">
                      <rect
                        width="14"
                        height="14"
                        rx="1"
                        fill="#ccc"
                        stroke="#999"
                        strokeWidth="1"
                      />
                      <line x1="2" y1="2" x2="12" y2="12" stroke="#999" strokeWidth="1.5" />
                      <line x1="12" y1="2" x2="2" y2="12" stroke="#999" strokeWidth="1.5" />
                    </svg>
                  )}
                  {wp.label}
                </li>
              ))}
            </ul>
            <div className="dp-wallpaper-btns">
              <button className="dp-btn" disabled>
                Browse...
              </button>
              <button className="dp-btn" disabled>
                Pattern...
              </button>
              <div className="dp-display-label">Display:</div>
              <select className="dp-display-select" disabled>
                <option>Center</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div className="dp-footer">
        <button className="dp-footer-btn default-btn" onClick={handleOk}>
          OK
        </button>
        <button className="dp-footer-btn" onClick={onClose}>
          Cancel
        </button>
        <button className="dp-footer-btn" onClick={handleApply} disabled={!applyEnabled}>
          Apply
        </button>
      </div>
    </div>
  );
}
