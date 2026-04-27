'use client';

/**
 * Calculator shell: {@link useOsShell} chrome + {@link CalculatorContent} from core.
 * Skins: import `@retro-web/app-calculator/themes/win98.css` and optional `themes/karpos.css`.
 */
import React from 'react';
import type { AppConfig } from '@retro-web/core';
import { CalculatorContent } from '@retro-web/core/apps/calculator';
import { useOsShell } from '@retro-web/core/context';
import { useAppVisibility } from '@retro-web/core';

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
  const { AppWindow, TitleBar } = useOsShell();
  const isVisible = useAppVisibility('calculator');

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
