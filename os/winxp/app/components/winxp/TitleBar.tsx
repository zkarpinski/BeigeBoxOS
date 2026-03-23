'use client';

import React from 'react';
import type { TitleBarProps } from '@retro-web/core/types/os-shell';

export type { TitleBarProps };

/**
 * WinXP Luna title bar with color-coded window control buttons.
 * AppWindow wires up drag/min/max/close by querying
 * [data-win-min], [data-win-max], [data-win-close] after mount.
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
    <div className={`title-bar winxp-title-bar ${className}`.trim()}>
      <div className="title-bar-text">
        {icon}
        <span className="title-text">{title}</span>
      </div>
      <div className="title-bar-controls">
        {showMin && (
          <button
            type="button"
            className="win-btn title-btn xp-btn-min"
            data-win-min
            title="Minimize"
            aria-label="Minimize"
          >
            <span className="icon-min" aria-hidden="true" />
          </button>
        )}
        {showMax && (
          <button
            type="button"
            className="win-btn title-btn xp-btn-max"
            data-win-max
            title="Maximize"
            aria-label="Maximize"
          >
            <span className="icon-max" aria-hidden="true" />
          </button>
        )}
        {showClose && (
          <button
            type="button"
            className="win-btn title-btn xp-btn-close"
            data-win-close
            title="Close"
            aria-label="Close"
          >
            <span className="icon-close" aria-hidden="true">
              ×
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
