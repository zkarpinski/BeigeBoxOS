'use client';

import React from 'react';

export type ViewMode = 'normal' | 'web' | 'print' | 'outline';

interface WordStatusBarProps {
  statusLine: number;
  statusCol: number;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  modeToggles: Record<string, boolean>;
  toggleMode: (id: string) => void;
}

export function WordStatusBar({
  statusLine,
  statusCol,
  viewMode,
  setViewMode,
  modeToggles,
  toggleMode,
}: WordStatusBarProps) {
  return (
    <>
      <div className="bottom-bar">
        <div className="view-buttons">
          <button
            className={`view-btn ${viewMode === 'normal' ? 'active' : ''}`}
            title="Normal View"
            onClick={() => setViewMode('normal')}
          >
            <span className="icon">≡</span>
          </button>
          <button
            className={`view-btn ${viewMode === 'web' ? 'active' : ''}`}
            title="Online Layout View"
            onClick={() => setViewMode('web')}
          >
            <span className="icon">🌐</span>
          </button>
          <button
            className={`view-btn ${viewMode === 'print' ? 'active' : ''}`}
            title="Page Layout View"
            onClick={() => setViewMode('print')}
          >
            <span className="icon">📄</span>
          </button>
          <button
            className={`view-btn ${viewMode === 'outline' ? 'active' : ''}`}
            title="Outline View"
            onClick={() => setViewMode('outline')}
          >
            <span className="icon">≣</span>
          </button>
        </div>
        <div className="scrollbar-h">
          <button className="scroll-btn left">◀</button>
          <div className="scroll-track-h">
            <div className="scroll-thumb-h" />
          </div>
          <button className="scroll-btn right">▶</button>
        </div>
      </div>
      <div className="status-bar">
        <div className="status-panel w-page">Page 1</div>
        <div className="status-panel w-sec">Sec 1</div>
        <div className="status-panel w-frac">1/1</div>
        <div className="status-panel w-at">At 2.5cm</div>
        <div className="status-panel w-ln">Ln {statusLine}</div>
        <div className="status-panel w-col">Col {statusCol}</div>
        {(['mode-rec', 'mode-trk', 'mode-ext', 'mode-ovr', 'mode-wph'] as const).map((id) => (
          <div
            key={id}
            className={`status-panel right-panel ${modeToggles[id] ? 'active' : ''}`}
            id={id}
            onDoubleClick={() => toggleMode(id)}
          >
            {id === 'mode-rec' && 'REC'}
            {id === 'mode-trk' && 'TRK'}
            {id === 'mode-ext' && 'EXT'}
            {id === 'mode-ovr' && 'OVR'}
            {id === 'mode-wph' && 'WPH'}
          </div>
        ))}
        <div className="status-panel empty-panel" />
      </div>
    </>
  );
}
