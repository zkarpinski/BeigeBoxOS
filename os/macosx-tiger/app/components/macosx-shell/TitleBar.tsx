'use client';

import React from 'react';
import type { TitleBarProps } from '@retro-web/core/types/os-shell';

export type { TitleBarProps };

/**
 * Mac OS X Aqua title bar.
 * Traffic lights (close/min/zoom) on the left, title centered.
 * AppWindow wires chrome via [data-win-close], [data-win-min], [data-win-max].
 */
export function TitleBar({
  title,
  icon,
  showMin = true,
  showMax = true,
  showClose = true,
}: TitleBarProps) {
  return (
    <div className="title-bar">
      <div className="mac-traffic-lights title-bar-controls">
        {showClose && (
          <button
            type="button"
            className="mac-btn-close"
            data-win-close
            title="Close"
            aria-label="Close"
          >
            ×
          </button>
        )}
        {showMin && (
          <button
            type="button"
            className="mac-btn-min"
            data-win-min
            title="Minimize"
            aria-label="Minimize"
          >
            –
          </button>
        )}
        {showMax && (
          <button
            type="button"
            className="mac-btn-zoom"
            data-win-max
            title="Zoom"
            aria-label="Zoom"
          >
            +
          </button>
        )}
      </div>

      <div className="mac-title-text-wrap">
        {icon && (
          <span className="mac-title-icon">
            {typeof icon === 'string' ? <img src={icon} alt="" /> : icon}
          </span>
        )}
        <span className="mac-title-label">{title}</span>
      </div>
    </div>
  );
}
