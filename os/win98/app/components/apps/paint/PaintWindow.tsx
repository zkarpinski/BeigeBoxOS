'use client';

import React from 'react';
import { AppWindow, TitleBar } from '../../win98';
import type { AppConfig } from '@retro-web/core/types/app-config';
import { PaintContent } from '@retro-web/core/apps/paint';
// Note: paint.css is imported by PaintContent from @retro-web/core

const ICON = 'apps/paint/paint-icon.png';

export const paintAppConfig: AppConfig = {
  id: 'paint',
  label: 'Paint',
  icon: ICON,
  desktop: true,
  startMenu: { path: ['Programs', 'Accessories'] },
  taskbarLabel: 'untitled - Paint',
};

export function PaintWindow() {
  return (
    <AppWindow
      id="paint-window"
      appId="paint"
      allowResize
      className="paint-window app-window app-window-hidden"
      titleBar={
        <TitleBar
          title="untitled - Paint"
          icon={<img src={ICON} alt="Paint" style={{ width: 16, height: 16, marginRight: 4 }} />}
          showMin
          showMax
          showClose
        />
      }
    >
      <PaintContent />
    </AppWindow>
  );
}
