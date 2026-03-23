'use client';

import React from 'react';

export interface ToolbarRowProps {
  children: React.ReactNode;
  /** Show the draggable gripper on the left. Default true. */
  showGripper?: boolean;
  className?: string;
}

/** A single row containing an optional gripper and toolbar content. */
export function ToolbarRow({ children, showGripper = true, className = '' }: ToolbarRowProps) {
  return (
    <div className={`toolbar-row${className ? ` ${className}` : ''}`}>
      {showGripper && <div className="toolbar-gripper" />}
      {children}
    </div>
  );
}

export interface ToolbarProps {
  children: React.ReactNode;
  /** Extra class names (e.g. "standard-toolbar", "formatting-toolbar"). */
  className?: string;
}

/** Container for toolbar buttons, separators, and selects. */
export function Toolbar({ children, className = '' }: ToolbarProps) {
  return <div className={`toolbar${className ? ` ${className}` : ''}`}>{children}</div>;
}

export interface ToolbarButtonProps {
  children: React.ReactNode;
  title?: string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /** Toggle/pressed state (e.g. Bold, Italic). */
  active?: boolean;
  className?: string;
  type?: 'button' | 'submit';
  style?: React.CSSProperties;
}

/** A single toolbar button (icon or text). Use .icon span for icon content. */
export function ToolbarButton({
  children,
  title,
  onClick,
  active = false,
  className = '',
  type = 'button',
  style,
}: ToolbarButtonProps) {
  return (
    <button
      type={type}
      className={`tb-btn${active ? ' active' : ''}${className ? ` ${className}` : ''}`}
      title={title}
      onClick={onClick}
      style={style}
    >
      {children}
    </button>
  );
}

/** Vertical separator between toolbar groups. */
export function ToolbarSeparator() {
  return <div className="tb-sep" />;
}

export interface ToolbarSelectProps {
  children: React.ReactNode;
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  title?: string;
  className?: string;
}

/** Dropdown select in a toolbar (e.g. zoom, font, style). */
export function ToolbarSelect({
  children,
  value,
  defaultValue,
  onChange,
  title,
  className = '',
}: ToolbarSelectProps) {
  return (
    <select
      className={`tb-select${className ? ` ${className}` : ''}`}
      title={title}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
    >
      {children}
    </select>
  );
}
