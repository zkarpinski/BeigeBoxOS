'use client';

import React from 'react';
import type { TitleBarProps } from '@retro-web/core/types/os-shell';

export type { TitleBarProps };

/**
 * Neo-brutalist title bar — keeps `.title-bar` for drag wiring.
 * Layout: icon tile + loud typographic title + chunky controls (not Win98 chrome).
 */
export function TitleBar({
  title,
  icon,
  showMin = true,
  showMax = true,
  showClose = true,
  className = '',
}: TitleBarProps) {
  return (
    <div className={`title-bar karp-title-bar ${className}`.trim()}>
      <div className="title-bar-text karp-title-bar__lead">
        {icon ? <span className="karp-title-bar__iconbox">{icon}</span> : null}
        <span className="title-text karp-title-bar__heading">{title}</span>
      </div>
      <div className="title-bar-controls karp-title-bar-controls" aria-label="Window controls">
        {showMin && (
          <button
            type="button"
            className="karp-chrome-btn karp-chrome-btn--min title-btn"
            data-win-min
            title="Minimize"
            aria-label="Minimize"
          >
            <span className="karp-chrome-btn__glyph icon-min">−</span>
          </button>
        )}
        {showMax && (
          <button
            type="button"
            className="karp-chrome-btn karp-chrome-btn--max title-btn"
            data-win-max
            title="Maximize"
            aria-label="Maximize"
          >
            <span className="karp-chrome-btn__glyph icon-max">▣</span>
          </button>
        )}
        {showClose && (
          <button
            type="button"
            className="karp-chrome-btn karp-chrome-btn--close title-btn"
            data-win-close
            title="Close"
            aria-label="Close"
          >
            <span className="karp-chrome-btn__glyph icon-close">✕</span>
          </button>
        )}
      </div>
    </div>
  );
}
