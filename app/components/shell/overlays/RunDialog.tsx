'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useWindowManager } from '../../../context/WindowManagerContext';

const APP_COMMANDS: Record<string, string> = {
  winword: 'word',
  'winword.exe': 'word',
  word: 'word',
  notepad: 'notepad',
  'notepad.exe': 'notepad',
  calc: 'calculator',
  'calc.exe': 'calculator',
  calculator: 'calculator',
  mspaint: 'paint',
  'mspaint.exe': 'paint',
  paint: 'paint',
  winamp: 'winamp',
  'winamp.exe': 'winamp',
  napster: 'napster',
  'napster.exe': 'napster',
  aim: 'aim',
  'aim.exe': 'aim',
  navigator: 'navigator',
  netscape: 'navigator',
  'netscape.exe': 'navigator',
  iexplore: 'ie5',
  'iexplore.exe': 'ie5',
  ie5: 'ie5',
  winmine: 'minesweeper',
  'winmine.exe': 'minesweeper',
  minesweeper: 'minesweeper',
  vb6: 'vb6',
  'vb6.exe': 'vb6',
  thps2: 'thps2',
  'thps.exe': 'thps2',
  defrag: 'defrag',
  'defrag.exe': 'defrag',
  control: 'controlpanel',
  'control.exe': 'controlpanel',
  controlpanel: 'controlpanel',
  explorer: 'mycomputer',
  'explorer.exe': 'mycomputer',
  mycomputer: 'mycomputer',
};

export function RunDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { showApp } = useWindowManager();
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setValue('');
      requestAnimationFrame(() => {
        const el = dialogRef.current;
        if (el) {
          el.style.left = Math.round((window.innerWidth - 380) / 2) + 'px';
          el.style.top = Math.round((window.innerHeight - (el.offsetHeight || 160)) / 2) + 'px';
        }
        inputRef.current?.focus();
        inputRef.current?.select();
      });
    }
  }, [open]);

  const run = () => {
    const raw = value.trim();
    if (!raw) {
      onClose();
      return;
    }
    const cmd = raw.toLowerCase().replace(/\s+.*$/, '');

    if (/^https?:\/\//i.test(raw) || /^www\./i.test(raw)) {
      onClose();
      const url = /^https?:\/\//i.test(raw) ? raw : 'https://' + raw;
      showApp('navigator');
      window.dispatchEvent(new CustomEvent('win97:navigate', { detail: { url } }));
      return;
    }

    const appId = APP_COMMANDS[cmd];
    if (appId) {
      onClose();
      showApp(appId);
      return;
    }

    onClose();
    const w = window as unknown as {
      Windows97?: { alert?: (t: string, m: string, type: string) => void };
    };
    if (w.Windows97?.alert) {
      w.Windows97.alert(
        'Run',
        `Cannot find \u2018${raw}\u2019. Make sure you typed the name correctly, and then try again.`,
        'error',
      );
    }
  };

  useEffect(() => {
    if (!open) return;
    const dlg = dialogRef.current;
    if (!dlg) return;
    const titlebar = dlg.querySelector('.run-titlebar') as HTMLElement | null;
    if (!titlebar) return;
    let dragging = false,
      ox = 0,
      oy = 0;
    const onDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('.run-titlebtn')) return;
      dragging = true;
      const r = dlg.getBoundingClientRect();
      ox = e.clientX - r.left;
      oy = e.clientY - r.top;
      e.preventDefault();
    };
    const onMove = (e: MouseEvent) => {
      if (!dragging) return;
      const x = Math.max(0, Math.min(e.clientX - ox, window.innerWidth - dlg.offsetWidth));
      const y = Math.max(0, Math.min(e.clientY - oy, window.innerHeight - dlg.offsetHeight));
      dlg.style.left = x + 'px';
      dlg.style.top = y + 'px';
    };
    const onUp = () => {
      dragging = false;
    };
    titlebar.addEventListener('mousedown', onDown);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      titlebar.removeEventListener('mousedown', onDown);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div ref={dialogRef} id="run-dialog" className="run-dialog" style={{ position: 'fixed' }}>
      <div className="run-titlebar">
        <span className="run-titlebar-text">
          <img
            src="shell/icons/run.png"
            alt=""
            style={{ width: 14, height: 14, imageRendering: 'pixelated' }}
          />
          Run
        </span>
        <button className="run-titlebtn" id="run-close-btn" title="Close" onClick={onClose}>
          ✕
        </button>
      </div>
      <div className="run-body">
        <img className="run-icon" src="shell/icons/run.png" alt="" />
        <p className="run-desc">
          Type the name of a program, folder, document, or Internet resource, and Windows will open
          it for you.
        </p>
      </div>
      <div className="run-input-row">
        <label className="run-label" htmlFor="run-input">
          Open:
        </label>
        <input
          ref={inputRef}
          type="text"
          id="run-input"
          className="run-input"
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') run();
            if (e.key === 'Escape') onClose();
          }}
        />
      </div>
      <div className="run-footer">
        <button className="run-btn run-btn-default" onClick={run}>
          OK
        </button>
        <button className="run-btn" onClick={onClose}>
          Cancel
        </button>
        <button className="run-btn" disabled>
          Browse...
        </button>
      </div>
    </div>
  );
}
