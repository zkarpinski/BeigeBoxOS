import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { WindowManagerProvider, useWindowManager } from './WindowManagerContext';
import type { AppConfig } from '../types/app-config';

function Probe({ appId }: { appId: string }) {
  const { apps } = useWindowManager();
  const state = apps[appId];
  return (
    <div data-testid={`probe-${appId}`}>
      {state?.visible ? 'visible' : 'hidden'}:{state?.zIndex ?? 'n/a'}
    </div>
  );
}

describe('WindowManagerProvider initialOpenAppId', () => {
  const appCalculator: AppConfig = {
    id: 'calculator',
    label: 'Calculator',
    icon: 'apps/calculator/calculator-icon.png',
    openByDefault: false,
  };

  const appAim: AppConfig = {
    id: 'aim',
    label: 'AIM',
    icon: 'apps/aim/aim-icon.png',
    openByDefault: true,
  };

  test('opens only initialOpenAppId (ignores openByDefault for other apps)', () => {
    render(
      <WindowManagerProvider registry={[appCalculator, appAim]} initialOpenAppId="calculator">
        <Probe appId="calculator" />
        <Probe appId="aim" />
      </WindowManagerProvider>,
    );

    expect(screen.getByTestId('probe-calculator')).toHaveTextContent('visible:11');
    expect(screen.getByTestId('probe-aim')).toHaveTextContent('hidden:10');
  });

  test('when initialOpenAppId is set, mobile auto-hide does not hide that app', async () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 });

    const appNapster: AppConfig = {
      id: 'napster',
      label: 'Napster',
      icon: 'apps/napster/napster-icon.png',
      openByDefault: true,
    };

    render(
      <WindowManagerProvider registry={[appNapster, appAim]} initialOpenAppId="napster">
        <Probe appId="napster" />
      </WindowManagerProvider>,
    );

    // State should remain visible even after effects run.
    await waitFor(() => {
      expect(screen.getByTestId('probe-napster')).toHaveTextContent('visible:11');
    });
  });
});
