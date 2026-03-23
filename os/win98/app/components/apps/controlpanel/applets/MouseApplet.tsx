'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useDraggable, centerDialog } from './shared';

const MOUSE_ICON = 'apps/controlpanel/mouse.png';

export function MouseApplet({ onClose }: { onClose: () => void }) {
  const [mouseTab, setMouseTab] = useState<'buttons' | 'motion'>('buttons');
  const [handedness, setHandedness] = useState<'right' | 'left'>('right');
  const [dblclickSpeed, setDblclickSpeed] = useState(5);
  const [trailsEnabled, setTrailsEnabled] = useState(false);
  const [trailsLength, setTrailsLength] = useState(3);
  const [pointerSpeed, setPointerSpeed] = useState(5);
  const [hopKey, setHopKey] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleMouseDown = useDraggable(dialogRef);
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (dialogRef.current) centerDialog(dialogRef.current, 390, 300);
  }, []);

  function handleDblClickTest() {
    clickCountRef.current++;
    if (clickCountRef.current === 1) {
      const delay = Math.round(700 - dblclickSpeed * 55);
      clickTimerRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, delay);
    } else {
      if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
      clickCountRef.current = 0;
      setHopKey((k) => k + 1);
    }
  }

  const leftFill = handedness === 'right' ? '#1084d0' : '#e8e8e8';
  const rightFill = handedness === 'right' ? '#e8e8e8' : '#1084d0';

  return (
    <div id="mouse-dialog" ref={dialogRef}>
      <div className="dp-titlebar" onMouseDown={titleMouseDown}>
        <span className="dp-titlebar-text">
          <img
            src={MOUSE_ICON}
            alt=""
            style={{ width: 14, height: 14, imageRendering: 'pixelated' }}
          />
          {' Mouse Properties'}
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
          className={`dp-tab ms-tab-btn${mouseTab === 'buttons' ? ' active' : ''}`}
          onClick={() => setMouseTab('buttons')}
        >
          Buttons
        </button>
        <button
          className={`dp-tab ms-tab-btn${mouseTab === 'motion' ? ' active' : ''}`}
          onClick={() => setMouseTab('motion')}
        >
          Motion
        </button>
      </div>
      <div className="dp-panel-border" style={{ padding: 0 }}>
        <div
          id="ms-panel-buttons"
          className="ms-panel"
          style={{ display: mouseTab === 'buttons' ? '' : 'none' }}
        >
          <div className="ms-section">
            <div className="ms-section-label">Button configuration</div>
            <div className="ms-hand-row">
              <div className="ms-hand-radios">
                <label className="ms-radio-label">
                  <input
                    type="radio"
                    name="ms-hand"
                    value="right"
                    checked={handedness === 'right'}
                    onChange={() => setHandedness('right')}
                  />
                  Right-handed
                </label>
                <label className="ms-radio-label">
                  <input
                    type="radio"
                    name="ms-hand"
                    value="left"
                    checked={handedness === 'left'}
                    onChange={() => setHandedness('left')}
                  />
                  Left-handed
                </label>
              </div>
              <svg width="60" height="80" viewBox="0 0 60 80" className="ms-mouse-svg">
                <ellipse
                  cx="30"
                  cy="40"
                  rx="22"
                  ry="34"
                  fill="#ccc"
                  stroke="#888"
                  strokeWidth="1.5"
                />
                <line x1="30" y1="6" x2="30" y2="42" stroke="#888" strokeWidth="1" />
                <ellipse
                  cx="19"
                  cy="24"
                  rx="11"
                  ry="15"
                  fill={leftFill}
                  stroke="#888"
                  strokeWidth="1"
                />
                <ellipse
                  cx="41"
                  cy="24"
                  rx="11"
                  ry="15"
                  fill={rightFill}
                  stroke="#888"
                  strokeWidth="1"
                />
                <ellipse cx="30" cy="34" rx="5" ry="4" fill="#aaa" stroke="#888" strokeWidth="1" />
              </svg>
            </div>
          </div>
          <div className="ms-section">
            <div className="ms-section-label">Double-click speed</div>
            <div className="ms-slider-row">
              <span className="ms-slider-label">Slow</span>
              <input
                type="range"
                min={1}
                max={10}
                value={dblclickSpeed}
                className="ms-slider"
                onChange={(e) => setDblclickSpeed(parseInt(e.target.value, 10))}
              />
              <span className="ms-slider-label">Fast</span>
              <div
                key={`hop-${hopKey}`}
                className={`ms-dblclick-test${hopKey > 0 ? ' ms-hopping' : ''}`}
                title="Double-click to test"
                onClick={handleDblClickTest}
              >
                🐰
              </div>
            </div>
          </div>
        </div>
        <div
          id="ms-panel-motion"
          className="ms-panel"
          style={{ display: mouseTab === 'motion' ? '' : 'none' }}
        >
          <div className="ms-section">
            <div className="ms-section-label">Pointer speed</div>
            <div className="ms-slider-row">
              <span className="ms-slider-label">Slow</span>
              <input
                type="range"
                min={1}
                max={10}
                value={pointerSpeed}
                className="ms-slider"
                onChange={(e) => setPointerSpeed(parseInt(e.target.value, 10))}
              />
              <span className="ms-slider-label">Fast</span>
            </div>
          </div>
          <div className="ms-section">
            <div className="ms-section-label">Pointer trails</div>
            <label className="ms-radio-label">
              <input
                type="checkbox"
                checked={trailsEnabled}
                onChange={(e) => setTrailsEnabled(e.target.checked)}
              />
              Show pointer trails
            </label>
            <div className="ms-slider-row" style={{ marginTop: 6 }}>
              <span className="ms-slider-label">Short</span>
              <input
                type="range"
                min={1}
                max={10}
                value={trailsLength}
                className="ms-slider"
                disabled={!trailsEnabled}
                onChange={(e) => setTrailsLength(parseInt(e.target.value, 10))}
              />
              <span className="ms-slider-label">Long</span>
            </div>
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
        <button className="dp-footer-btn" disabled>
          Apply
        </button>
      </div>
    </div>
  );
}
