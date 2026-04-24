'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Shortcut {
  label: string;
  onClick: () => void;
}

export type LauncherCategory = 'All' | 'Main' | 'Games' | 'Unfiled';
const CATEGORIES: LauncherCategory[] = ['All', 'Main', 'Games', 'Unfiled'];

interface PalmStatusBarProps {
  appTitle?: string;
  showCategory?: boolean;
  shortcuts?: Shortcut[];
  onTitleClick?: () => void;
  launcherCategory?: LauncherCategory;
  onLauncherCategoryChange?: (cat: LauncherCategory) => void;
  batteryLevel?: number;
}

export function PalmStatusBar({
  appTitle,
  showCategory,
  shortcuts,
  onTitleClick,
  launcherCategory = 'All',
  onLauncherCategoryChange,
  batteryLevel = 75,
}: PalmStatusBarProps = {}) {
  const [time, setTime] = useState<Date | null>(null);
  const [catOpen, setCatOpen] = useState(false);
  const catRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!catOpen) return;
    const close = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) setCatOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [catOpen]);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = time
    ? time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toLowerCase()
    : '--:--';

  // App mode: title pill left + white space + bordered shortcut boxes right
  if (appTitle) {
    return (
      <div
        style={{
          display: 'flex',
          height: '22px',
          width: '100%',
          alignItems: 'stretch',
          borderBottom: '2px solid #000',
          background: 'white',
          fontWeight: 'bold',
          flexShrink: 0,
        }}
      >
        {/* Title pill */}
        <div
          onClick={onTitleClick}
          style={{
            backgroundColor: '#1A1A8C',
            color: 'white',
            padding: '0 8px',
            display: 'flex',
            alignItems: 'center',
            fontSize: '15px',
            borderBottomRightRadius: '6px',
            whiteSpace: 'nowrap',
            cursor: onTitleClick ? 'pointer' : 'default',
          }}
        >
          {appTitle}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Shortcut boxes */}
        {shortcuts && shortcuts.length > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'stretch',
              border: '1px solid #000',
              borderBottom: 'none',
            }}
          >
            {shortcuts.map(({ label, onClick }) => (
              <button
                key={label}
                onClick={onClick}
                style={{
                  width: '20px',
                  background: 'white',
                  border: 'none',
                  borderLeft: '1px solid #000',
                  color: '#000',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Category picker for list apps */}
        {showCategory && (
          <div
            style={{
              color: '#000',
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              paddingRight: '6px',
              fontSize: '13px',
            }}
          >
            <span style={{ fontSize: '8px' }}>▼</span>
            <span>All</span>
          </div>
        )}
      </div>
    );
  }

  // Launcher mode: navy time pill on left, white center with battery, black category right
  const isLow = batteryLevel <= 20;
  const batteryFill = isLow
    ? '#cc0000'
    : 'linear-gradient(to bottom, #e8ecf8 0%, #c8d0e8 40%, #b8c0dc 60%, #a8b0cc 100%)';

  return (
    <div
      style={{
        display: 'flex',
        height: '26px',
        width: '100%',
        alignItems: 'stretch',
        borderBottom: '2px solid #000',
        background: 'white',
        fontSize: '14px',
        fontWeight: 'bold',
        flexShrink: 0,
      }}
    >
      {/* Time pill */}
      <div
        style={{
          backgroundColor: '#1A1A8C',
          color: 'white',
          padding: '0 8px',
          display: 'flex',
          alignItems: 'center',
          whiteSpace: 'nowrap',
          borderBottomRightRadius: '4px',
          flexShrink: 0,
        }}
      >
        {timeStr}
      </div>

      {/* Battery — centered in the remaining white space */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Fixed-width wrapper so the nub doesn't affect centering */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            position: 'relative',
            width: '60px',
            height: '18px',
          }}
        >
          {/* Body */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '54px',
              height: '18px',
              border: '1.5px solid #999',
              background: '#e0e4f0',
              boxSizing: 'border-box',
              overflow: 'hidden',
            }}
          >
            {/* Fill */}
            <div
              style={{
                position: 'absolute',
                left: '1px',
                top: '1px',
                bottom: '1px',
                width: `calc(${batteryLevel}% - 2px)`,
                background: batteryFill,
                transition: 'width 1s ease',
              }}
            />
            {/* Top sheen */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                right: 0,
                height: '5px',
                background: 'rgba(255,255,255,0.45)',
                pointerEvents: 'none',
              }}
            />
          </div>
          {/* Positive terminal nub */}
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: '5px',
              width: '6px',
              height: '8px',
              background: '#999',
              borderRadius: '0 2px 2px 0',
            }}
          />
        </div>
        {isLow && (
          <span
            style={{
              fontSize: '9px',
              color: '#cc0000',
              fontWeight: 'bold',
              marginLeft: '3px',
              lineHeight: 1,
            }}
          >
            !
          </span>
        )}
      </div>

      {/* Category picker */}
      <div ref={catRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setCatOpen((o) => !o)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            padding: '0 7px',
            height: '26px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#000',
            fontWeight: 'bold',
            fontSize: '14px',
          }}
        >
          <span style={{ fontSize: '8px' }}>▼</span>
          <span>{launcherCategory}</span>
        </button>
        {catOpen && (
          <div
            style={{
              position: 'absolute',
              top: '26px',
              right: 0,
              background: 'white',
              border: '2px solid #000',
              zIndex: 100,
              minWidth: '80px',
            }}
          >
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  onLauncherCategoryChange?.(cat);
                  setCatOpen(false);
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '3px 8px',
                  background: cat === launcherCategory ? '#1A1A8C' : 'white',
                  color: cat === launcherCategory ? 'white' : '#000',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  borderBottom: '1px solid #ccc',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
