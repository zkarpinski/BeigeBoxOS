'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useDraggable, centerDialog } from './shared';
import { UnderwaterScreensaver } from '../../../shell/screensaver/UnderwaterScreensaver';

const DISPLAY_ICON = 'apps/controlpanel/display.png';

const WALLPAPERS = [
  { id: 'none', label: '(None)', src: null as string | null },
  { id: 'clouds', label: 'Clouds', src: 'shell/images/clouds.png' },
];

const SCREENSAVERS = [
  { id: 'none', label: '(None)' },
  { id: 'underwater', label: 'Underwater' },
];

const SS_KEY = 'win98-screensaver';
const SS_WAIT_KEY = 'win98-screensaver-wait';

function readSsSetting(): string {
  try {
    return localStorage.getItem(SS_KEY) ?? 'underwater';
  } catch {
    return 'underwater';
  }
}
function readSsWait(): number {
  try {
    return parseInt(localStorage.getItem(SS_WAIT_KEY) ?? '2', 10) || 2;
  } catch {
    return 2;
  }
}

export function DisplayApplet({
  appliedWallpaper,
  onApply,
  onClose,
}: {
  appliedWallpaper: string;
  onApply: (id: string) => void;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'background' | 'screensaver'>('background');

  // Background tab state
  const [pending, setPending] = useState(appliedWallpaper);
  const [applyEnabled, setApplyEnabled] = useState(false);

  // Screen Saver tab state
  const [pendingSs, setPendingSs] = useState<string>(readSsSetting);
  const [pendingWait, setPendingWait] = useState<number>(readSsWait);
  const [ssApplyEnabled, setSsApplyEnabled] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const titleMouseDown = useDraggable(dialogRef);

  useEffect(() => {
    if (dialogRef.current) centerDialog(dialogRef.current, 420, 390);
  }, []);

  // Background tab
  const pendingWp = WALLPAPERS.find((w) => w.id === pending);

  function handleBgSelect(id: string) {
    setPending(id);
    setApplyEnabled(id !== appliedWallpaper);
  }
  function handleBgApply() {
    onApply(pending);
    setApplyEnabled(false);
  }

  // Screen Saver tab
  function handleSsSelect(id: string) {
    setPendingSs(id);
    setSsApplyEnabled(true);
  }
  function handleWaitChange(delta: number) {
    setPendingWait((v) => {
      const n = Math.max(1, Math.min(60, v + delta));
      setSsApplyEnabled(true);
      return n;
    });
  }
  function handleSsApply() {
    try {
      localStorage.setItem(SS_KEY, pendingSs);
      localStorage.setItem(SS_WAIT_KEY, String(pendingWait));
      // Notify Desktop to re-read settings
      window.dispatchEvent(new CustomEvent('screensaver-settings-changed'));
    } catch {
      /* ignore */
    }
    setSsApplyEnabled(false);
  }
  function handlePreview() {
    window.dispatchEvent(new CustomEvent('screensaver-preview'));
  }

  function handleOk() {
    if (activeTab === 'background') {
      onApply(pending);
    } else {
      handleSsApply();
    }
    onClose();
  }
  function handleApply() {
    if (activeTab === 'background') {
      handleBgApply();
    } else {
      handleSsApply();
    }
  }

  const applyIsEnabled = activeTab === 'background' ? applyEnabled : ssApplyEnabled;

  // Monitor preview content
  function renderMonitorContent() {
    if (activeTab === 'background') {
      return pendingWp?.src ? (
        <img
          src={pendingWp.src}
          alt=""
          className="visible"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : null;
    }
    // Screen saver tab
    if (pendingSs === 'none') return null;
    return (
      <div style={{ width: '100%', height: '100%' }}>
        <UnderwaterScreensaver />
      </div>
    );
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
        <button
          className={`dp-tab${activeTab === 'background' ? ' active' : ''}`}
          onClick={() => setActiveTab('background')}
        >
          Background
        </button>
        <button
          className={`dp-tab${activeTab === 'screensaver' ? ' active' : ''}`}
          onClick={() => setActiveTab('screensaver')}
        >
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
        {/* Monitor preview */}
        <div className="dp-monitor-wrap">
          <div className="dp-monitor">
            <div className="dp-monitor-outer">
              <div
                className="dp-monitor-screen"
                style={
                  activeTab === 'background' && !pendingWp?.src
                    ? { background: '#008080' }
                    : activeTab === 'screensaver' && pendingSs === 'none'
                      ? { background: '#000' }
                      : {}
                }
              >
                {renderMonitorContent()}
              </div>
            </div>
            <div className="dp-monitor-stand" />
            <div className="dp-monitor-base" />
          </div>
        </div>

        {/* ── Background tab ── */}
        {activeTab === 'background' && (
          <div className="dp-wallpaper-section">
            <div className="dp-wallpaper-label">Wallpaper</div>
            <div className="dp-wallpaper-sublabel">Select an HTML Document or a picture:</div>
            <div className="dp-wallpaper-row">
              <ul className="dp-wallpaper-list">
                {WALLPAPERS.map((wp) => (
                  <li
                    key={wp.id}
                    className={pending === wp.id ? 'selected' : ''}
                    onClick={() => handleBgSelect(wp.id)}
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
        )}

        {/* ── Screen Saver tab ── */}
        {activeTab === 'screensaver' && (
          <div className="dp-ss-section">
            {/* Screen Saver group */}
            <div className="dp-group">
              <span className="dp-group-label">Screen Saver</span>
              <div className="dp-ss-row">
                <select
                  className="dp-ss-select"
                  value={pendingSs}
                  onChange={(e) => handleSsSelect(e.target.value)}
                >
                  {SCREENSAVERS.map((ss) => (
                    <option key={ss.id} value={ss.id}>
                      {ss.label}
                    </option>
                  ))}
                </select>
                <button className="dp-btn" disabled>
                  Settings...
                </button>
                <button className="dp-btn" onClick={handlePreview} disabled={pendingSs === 'none'}>
                  Preview
                </button>
              </div>
              <div className="dp-ss-password-row">
                <label className="dp-ss-check-label">
                  <input type="checkbox" disabled style={{ marginRight: 4 }} />
                  Password protected
                </label>
                <button className="dp-btn" disabled style={{ marginLeft: 8 }}>
                  Change...
                </button>
                <span className="dp-ss-wait-label">Wait:</span>
                <div className="dp-ss-spinner">
                  <input className="dp-ss-spinner-input" type="text" value={pendingWait} readOnly />
                  <div className="dp-ss-spinner-btns">
                    <button className="dp-ss-spin-btn" onClick={() => handleWaitChange(1)}>
                      ▲
                    </button>
                    <button className="dp-ss-spin-btn" onClick={() => handleWaitChange(-1)}>
                      ▼
                    </button>
                  </div>
                </div>
                <span className="dp-ss-wait-label">minutes</span>
              </div>
            </div>

            {/* Energy saving group */}
            <div className="dp-group">
              <span className="dp-group-label">Energy saving features of monitor</span>
              <div className="dp-ss-energy-row">
                <div className="dp-ss-energy-logo">
                  <svg width="48" height="48" viewBox="0 0 48 48">
                    <circle
                      cx="24"
                      cy="24"
                      r="22"
                      fill="#1a5c1a"
                      stroke="#0a3a0a"
                      strokeWidth="2"
                    />
                    <ellipse cx="24" cy="28" rx="14" ry="10" fill="#2a8a2a" />
                    <path d="M24 8 L20 20 L28 20 Z" fill="#f0d020" />
                    <path
                      d="M18 14 L22 22 L26 22 L30 14"
                      fill="none"
                      stroke="#f0d020"
                      strokeWidth="1.5"
                    />
                    <text
                      x="24"
                      y="40"
                      textAnchor="middle"
                      fontSize="7"
                      fill="#f0d020"
                      fontWeight="bold"
                    >
                      Energy
                    </text>
                  </svg>
                </div>
                <div className="dp-ss-energy-checks">
                  <label className="dp-ss-check-label">
                    <input type="checkbox" disabled style={{ marginRight: 4 }} />
                    Low-power standby
                  </label>
                  <span style={{ color: 'var(--win-dark)', marginLeft: 8 }}>1</span>
                  <span style={{ color: 'var(--win-dark)', marginLeft: 4 }}>minutes</span>
                  <br />
                  <label className="dp-ss-check-label" style={{ marginTop: 4 }}>
                    <input type="checkbox" disabled style={{ marginRight: 4 }} />
                    Shut off monitor
                  </label>
                  <span style={{ color: 'var(--win-dark)', marginLeft: 8 }}>1</span>
                  <span style={{ color: 'var(--win-dark)', marginLeft: 4 }}>minutes</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="dp-footer">
        <button className="dp-footer-btn default-btn" onClick={handleOk}>
          OK
        </button>
        <button className="dp-footer-btn" onClick={onClose}>
          Cancel
        </button>
        <button className="dp-footer-btn" onClick={handleApply} disabled={!applyIsEnabled}>
          Apply
        </button>
      </div>
    </div>
  );
}
