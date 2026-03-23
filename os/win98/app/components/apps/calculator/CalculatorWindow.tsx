'use client';

import React, { useEffect } from 'react';
import { AppWindow, TitleBar } from '../../win98';
import type { AppConfig } from '@retro-web/core/types/app-config';
import { CalculatorContent } from '@retro-web/core/apps/calculator';
import { useWindowManager } from '@retro-web/core/context';
// Note: calculator.css is imported by CalculatorContent from @retro-web/core

const ICON = 'apps/calculator/calculator-icon.png';

export const calculatorAppConfig: AppConfig = {
  id: 'calculator',
  label: 'Calculator',
  icon: ICON,
  desktop: false,
  startMenu: { path: ['Programs', 'Accessories'] },
  taskbarLabel: 'Calculator',
};

export function CalculatorWindow() {
  const { apps } = useWindowManager();
  const isVisible = apps.calculator?.visible && !apps.calculator?.minimized;

  return (
    <AppWindow
      id="calculator-window"
      appId="calculator"
      className="calculator-window app-window app-window-hidden"
      titleBar={
        <TitleBar
          title="Calculator"
          icon={
            <img src={ICON} alt="Calculator" style={{ width: 16, height: 16, marginRight: 4 }} />
          }
          showMin
          showMax={false}
          showClose
        />
      }
    >
      <CalculatorContent autoFocus={isVisible} />
    </AppWindow>
  );
}
