import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ControlPanelWindow } from '../app/components/apps/controlpanel/ControlPanelWindow';
import { WindowManagerProvider, OsShellProvider } from '@retro-web/core/context';
import { TitleBar } from '../app/components/winxp/TitleBar';
import { AppWindow } from '../app/components/winxp/AppWindow';

// Mock OsShellProvider to use WinXP components
const mockOsShell = {
  AppWindow,
  TitleBar,
  MenuBar: () => <div data-testid="mock-menubar" />,
};

describe('ControlPanelWindow', () => {
  const renderControlPanel = () => {
    return render(
      <OsShellProvider value={mockOsShell}>
        <WindowManagerProvider
          registry={[{ id: 'controlpanel', label: 'Control Panel', icon: '', desktop: false }]}
          initialOpenAppId="controlpanel"
        >
          <ControlPanelWindow />
        </WindowManagerProvider>
      </OsShellProvider>,
    );
  };

  test('renders control panel with applets', () => {
    renderControlPanel();
    expect(screen.getByText('Display')).toBeInTheDocument();
    expect(screen.getByText('Date/Time')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
  });

  test('double clicking an applet opens its dialog', () => {
    renderControlPanel();
    const displayIcon = screen.getByText('Display');
    fireEvent.doubleClick(displayIcon);

    expect(screen.getByText('Display Properties')).toBeInTheDocument();
    expect(screen.getByText('Wallpaper')).toBeInTheDocument();
  });

  test('closing an applet dialog', () => {
    renderControlPanel();
    const displayIcon = screen.getByText('Display');
    fireEvent.doubleClick(displayIcon);

    const cancelBtn = screen.getByText('Cancel');
    fireEvent.click(cancelBtn);

    expect(screen.queryByText('Display Properties')).not.toBeInTheDocument();
  });

  test('switching between applets', () => {
    renderControlPanel();
    fireEvent.doubleClick(screen.getByText('Display'));
    expect(screen.getByText('Display Properties')).toBeInTheDocument();

    // Close it
    fireEvent.click(screen.getByText('Cancel'));

    fireEvent.doubleClick(screen.getByText('System'));
    expect(screen.getByText('System Properties')).toBeInTheDocument();
  });
});
