'use client';

import React from 'react';
import type { AppConfig } from '@retro-web/core/types/app-config';
import { WinampApp } from '@retro-web/app-winamp';
import { useOsShell } from '@retro-web/core/context';
// Note: winamp.css is imported by WinampApp from @retro-web/app-winamp

export const winampAppConfig: AppConfig = {
  id: 'winamp',
  label: 'Winamp',
  icon: 'apps/winamp/winamp-icon.png',
  desktop: false,
  startMenu: { path: ['Programs', 'Entertainment'] },
  taskbarLabel: 'Winamp',
};

export function WinampWindow() {
  const { AppWindow, TitleBar } = useOsShell();
  return (
    <AppWindow
      id="winamp-window"
      appId="winamp"
      className="winamp-window app-window app-window-hidden"
      titleBar={
        <TitleBar title="WINAMP" className="winamp-title-bar" showMin showMax={false} showClose />
      }
    >
      <WinampApp />
    </AppWindow>
  );
}
