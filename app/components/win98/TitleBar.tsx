'use client';

import React from 'react';

export interface TitleBarProps {
  /** Window title text */
  title: string;
  /** Optional icon (img or element) before the title */
  icon?: React.ReactNode;
  /** Show minimize button (default true) */
  showMin?: boolean;
  /** Show maximize button (default true) */
  showMax?: boolean;
  /** Show close button (default true) */
  showClose?: boolean;
  /** Extra class names for the title-bar container */
  className?: string;
}

/**
 * Win98 window title bar. AppWindow wires up drag/min/max/close by querying
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
    <div className={`title-bar ${className}`.trim()}>
      <div className="title-bar-text">
        {icon}
        <span className="title-text">{title}</span>
      </div>
      <div className="title-bar-controls">
        {showMin && (
          <button
            type="button"
            className="win-btn title-btn"
            data-win-min
            title="Minimize"
            aria-label="Minimize"
          >
            <span className="icon-min">_</span>
          </button>
        )}
        {showMax && (
          <button
            type="button"
            className="win-btn title-btn"
            data-win-max
            title="Maximize"
            aria-label="Maximize"
          >
            <span className="icon-max">❐</span>
          </button>
        )}
        {showClose && (
          <button
            type="button"
            className="win-btn title-btn"
            data-win-close
            title="Close"
            aria-label="Close"
          >
            <span className="icon-close">X</span>
          </button>
        )}
      </div>
    </div>
  );
}
