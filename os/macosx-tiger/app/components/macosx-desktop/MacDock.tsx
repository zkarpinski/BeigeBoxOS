'use client';

import React from 'react';
import type { AppConfig } from '@retro-web/core/types/app-config';
import { useWindowManager } from '@retro-web/core/context';

export function MacDock({ registry }: { registry: AppConfig[] }) {
  const { apps, showApp, focusApp, isMinimized } = useWindowManager();

  const handleClick = (appId: string) => {
    const state = apps[appId];
    if (state?.visible && !isMinimized(appId)) {
      focusApp(appId);
    } else {
      showApp(appId);
    }
  };

  return (
    <div id="mac-dock">
      <div className="mac-dock-inner">
        {registry.map((app) => {
          const state = apps[app.id];
          const running = state?.visible && !state.minimized;
          return (
            <button
              key={app.id}
              type="button"
              className={`mac-dock-icon${running ? ' mac-dock-icon--running' : ''}`}
              onClick={() => handleClick(app.id)}
              aria-label={app.label}
            >
              <img src={app.icon} alt={app.label} draggable={false} />
              <span className="mac-dock-label">{app.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
