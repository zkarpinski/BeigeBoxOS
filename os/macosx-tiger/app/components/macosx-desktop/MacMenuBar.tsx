'use client';

import React, { useEffect, useState } from 'react';
import type { AppConfig } from '@retro-web/core/types/app-config';
import { useWindowManager, Z_FOCUSED } from '@retro-web/core/context';

function Clock() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const fmt = () => {
      const now = new Date();
      return now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    };
    setTime(fmt());
    const id = setInterval(() => setTime(fmt()), 10_000);
    return () => clearInterval(id);
  }, []);

  return <span className="mac-menubar-clock">{time}</span>;
}

export function MacMenuBar({ registry }: { registry: AppConfig[] }) {
  const { apps } = useWindowManager();

  // Determine the active app label for the bold "app name" slot
  const activeApp = Object.entries(apps).find(
    ([, s]) => s.visible && !s.minimized && s.zIndex === Z_FOCUSED,
  );
  const activeAppId = activeApp ? activeApp[0] : null;
  const activeAppLabel = registry.find((a) => a.id === activeAppId)?.label ?? 'Finder';

  return (
    <div id="mac-menubar">
      {/* Apple logo */}
      <div className="mac-menubar-item mac-menubar-item--apple">
        <span aria-label="Apple menu">&#63743;</span>
        <div className="mac-menubar-dropdown">
          <div className="mac-menubar-dropdown__item">About This Mac</div>
          <div className="mac-menubar-dropdown__divider" />
          <div className="mac-menubar-dropdown__item mac-menubar-dropdown__item--disabled">
            System Preferences…
          </div>
          <div className="mac-menubar-dropdown__item mac-menubar-dropdown__item--disabled">
            Dock
            <span className="mac-menubar-dropdown__arrow">▶</span>
          </div>
          <div className="mac-menubar-dropdown__divider" />
          <div className="mac-menubar-dropdown__item mac-menubar-dropdown__item--disabled">
            Recent Items
            <span className="mac-menubar-dropdown__arrow">▶</span>
          </div>
          <div className="mac-menubar-dropdown__divider" />
          <div className="mac-menubar-dropdown__item mac-menubar-dropdown__item--disabled">
            Force Quit…
          </div>
        </div>
      </div>

      {/* Active app name */}
      <div className="mac-menubar-item mac-menubar-item--appname">{activeAppLabel}</div>

      {/* Generic menus */}
      <div className="mac-menubar-item">
        File
        <div className="mac-menubar-dropdown">
          <div className="mac-menubar-dropdown__item mac-menubar-dropdown__item--disabled">
            New Window
          </div>
          <div className="mac-menubar-dropdown__divider" />
          <div className="mac-menubar-dropdown__item mac-menubar-dropdown__item--disabled">
            Close Window
          </div>
        </div>
      </div>

      <div className="mac-menubar-item">
        Edit
        <div className="mac-menubar-dropdown">
          <div className="mac-menubar-dropdown__item mac-menubar-dropdown__item--disabled">
            Undo<span className="mac-menubar-dropdown__arrow">⌘Z</span>
          </div>
          <div className="mac-menubar-dropdown__divider" />
          <div className="mac-menubar-dropdown__item mac-menubar-dropdown__item--disabled">
            Cut<span className="mac-menubar-dropdown__arrow">⌘X</span>
          </div>
          <div className="mac-menubar-dropdown__item mac-menubar-dropdown__item--disabled">
            Copy<span className="mac-menubar-dropdown__arrow">⌘C</span>
          </div>
          <div className="mac-menubar-dropdown__item mac-menubar-dropdown__item--disabled">
            Paste<span className="mac-menubar-dropdown__arrow">⌘V</span>
          </div>
        </div>
      </div>

      <div className="mac-menubar-item">
        Help
        <div className="mac-menubar-dropdown">
          <div className="mac-menubar-dropdown__item mac-menubar-dropdown__item--disabled">
            Mac Help
          </div>
        </div>
      </div>

      {/* Right side: clock */}
      <div className="mac-menubar-right">
        <Clock />
      </div>
    </div>
  );
}
