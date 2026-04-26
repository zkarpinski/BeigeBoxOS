'use client';

/**
 * Calculator shell: {@link useOsShell} chrome + {@link CalculatorContent} from core.
 * Skins: import `@retro-web/app-calculator/themes/win98.css` and optional `themes/karpos.css`.
 */
import React from 'react';
import type { AppConfig } from '@retro-web/core';
import { CalculatorContent } from '@retro-web/core/apps/calculator';
import { useOptionalWindowManager, useOsShell } from '@retro-web/core/context';

export const CALCULATOR_ICON_SRC = 'apps/calculator/calculator-icon.png';

export type CalculatorSkin = 'win98' | 'karpos' | (string & {});

export const calculatorAppConfig: AppConfig = {
  id: 'calculator',
  label: 'Calculator',
  icon: CALCULATOR_ICON_SRC,
  desktop: false,
  startMenu: { path: ['Programs', 'Accessories'] },
  taskbarLabel: 'Calculator',
};

export type CalculatorWindowProps = {
  skin?: CalculatorSkin;
};

export function CalculatorWindow({ skin = 'win98' }: CalculatorWindowProps) {
  const osShell = useOsShell();
  const { AppWindow, TitleBar, osMode, currentApp } = osShell;
  const wm = useOptionalWindowManager();

  // Fallback for single-app mode where WindowManagerContext is not present
  const isVisible =
    osMode === 'single-app'
      ? currentApp === 'calculator'
      : !!(wm?.apps.calculator?.visible && !wm?.apps.calculator?.minimized);

  return (
    <AppWindow
      id="calculator-window"
      appId="calculator"
      className="calculator-window app-window app-window-hidden"
      titleBar={
        <TitleBar
          title="Calculator"
          icon={
            <img
              src={CALCULATOR_ICON_SRC}
              alt="Calculator"
              style={{ width: 16, height: 16, marginRight: 4 }}
            />
          }
          showMin
          showMax={false}
          showClose
        />
      }
    >
      <div data-calculator-skin={skin} className="calculator-app-root">
        <CalculatorContent autoFocus={isVisible} />
      </div>
    </AppWindow>
  );
}
