'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useDraggable, centerDialog, playSound } from './shared';

const SOUNDS_ICON = 'apps/controlpanel/sounds.png';

const SOUND_EVENTS = [
  { name: 'Asterisk', icon: 'ℹ️', sound: 'ding' },
  { name: 'Critical Stop', icon: '🛑', sound: 'exclamation' },
  { name: 'Default Beep', icon: '🔔', sound: 'ding' },
  { name: 'Exclamation', icon: '⚠️', sound: 'exclamation' },
  { name: 'Exit Windows', icon: '🪟', sound: 'chord' },
  { name: 'Maximize', icon: '🔳', sound: '' },
  { name: 'Minimize', icon: '🔲', sound: '' },
  { name: 'Open Program', icon: '📂', sound: '' },
  { name: 'Program Error', icon: '❌', sound: 'exclamation' },
  { name: 'Question', icon: '❓', sound: 'ding' },
  { name: 'Start Windows', icon: '🏁', sound: 'tada' },
  { name: 'Windows Logon', icon: '🔑', sound: 'notify' },
];

export function SoundsApplet({ onClose }: { onClose: () => void }) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [soundValue, setSoundValue] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleMouseDown = useDraggable(dialogRef);

  useEffect(() => {
    if (dialogRef.current) centerDialog(dialogRef.current, 360, 300);
  }, []);

  function handleEventClick(idx: number) {
    setSelectedIdx(idx);
    setSoundValue(SOUND_EVENTS[idx].sound || '');
  }

  return (
    <div id="sounds-dialog" ref={dialogRef}>
      <div className="dp-titlebar" onMouseDown={titleMouseDown}>
        <span className="dp-titlebar-text">
          <img
            src={SOUNDS_ICON}
            alt=""
            style={{ width: 14, height: 14, imageRendering: 'pixelated' }}
          />
          {' Sounds Properties'}
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
        <button className="dp-tab active">Sounds</button>
      </div>
      <div className="dp-panel-border">
        <div className="snd-scheme-row">
          <label className="snd-label">Sound Scheme:</label>
          <select className="snd-select">
            <option value="win98">Windows Default</option>
            <option value="none">No Sounds</option>
          </select>
          <button className="dp-btn snd-scheme-btn" disabled>
            Save As...
          </button>
          <button className="dp-btn snd-scheme-btn" disabled>
            Delete
          </button>
        </div>
        <div className="snd-events-label">Events:</div>
        <ul className="snd-events-list">
          {SOUND_EVENTS.map((ev, i) => (
            <li
              key={i}
              className={selectedIdx === i ? 'snd-selected' : ''}
              onClick={() => handleEventClick(i)}
            >
              <span className="snd-event-icon">{ev.icon}</span>
              <span>{ev.name}</span>
            </li>
          ))}
        </ul>
        <div className="snd-sound-row">
          <label className="snd-label">Name:</label>
          <select
            className="snd-select snd-sound-select"
            value={soundValue}
            onChange={(e) => setSoundValue(e.target.value)}
          >
            <option value="">(None)</option>
            <option value="chord">Chord</option>
            <option value="ding">Ding</option>
            <option value="tada">Tada</option>
            <option value="notify">Notify</option>
            <option value="exclamation">Exclamation</option>
          </select>
          <button
            className="dp-btn snd-preview-btn"
            onClick={() => playSound(soundValue)}
            disabled={!soundValue}
          >
            &#9654; Preview
          </button>
          <button className="dp-btn" disabled>
            Browse...
          </button>
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
