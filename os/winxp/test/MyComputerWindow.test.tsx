import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComputerWindow } from '../app/components/apps/mycomputer/MyComputerWindow';
import { WindowManagerProvider, OsShellProvider } from '@retro-web/core/context';
import { TitleBar } from '../app/components/winxp/TitleBar';
import { AppWindow } from '../app/components/winxp/AppWindow';

// Mock OsShellProvider to use WinXP components
const mockOsShell = {
  AppWindow,
  TitleBar,
  MenuBar: () => <div data-testid="mock-menubar" />,
  writeFile: jest.fn(),
  osMode: 'multi-window' as const,
};

import { initFileSystem } from '../app/fileSystem';

beforeAll(() => {
  initFileSystem([]);
});

describe('MyComputerWindow', () => {
  const renderMyComputer = () => {
    return render(
      <OsShellProvider value={mockOsShell}>
        <WindowManagerProvider
          registry={[{ id: 'mycomputer', label: 'My Computer', icon: '', desktop: true }]}
          initialOpenAppId="mycomputer"
        >
          <MyComputerWindow />
        </WindowManagerProvider>
      </OsShellProvider>,
    );
  };

  test('renders with drives initially', () => {
    renderMyComputer();
    expect(screen.getByText('3½ Floppy (A:)')).toBeInTheDocument();
    expect(screen.getByText('Local Disk (C:)')).toBeInTheDocument();
    expect(screen.getByText('CD-ROM Drive (D:)')).toBeInTheDocument();
  });

  test('navigates into C: drive on double click', () => {
    renderMyComputer();
    const driveC = screen.getByText('Local Disk (C:)');
    fireEvent.doubleClick(driveC);

    expect(screen.getByText(/Address/i)).toBeInTheDocument();
    expect(screen.getByText('C:\\')).toBeInTheDocument();
    expect(screen.getByText('Documents and Settings')).toBeInTheDocument();
    expect(screen.getByText('Windows')).toBeInTheDocument();
  });

  test('goes Up from C:\\ back to My Computer', () => {
    renderMyComputer();
    fireEvent.doubleClick(screen.getByText('Local Disk (C:)'));

    const upBtn = screen.getByTitle('Up');
    fireEvent.click(upBtn);

    expect(screen.getAllByText('My Computer').length).toBeGreaterThan(0);
    expect(screen.getByText('Local Disk (C:)')).toBeInTheDocument();
  });

  test('Back and Forward buttons work', () => {
    renderMyComputer();
    fireEvent.doubleClick(screen.getByText('Local Disk (C:)'));
    expect(screen.getByText('C:\\')).toBeInTheDocument();

    const backBtn = screen.getByTitle('Back');
    fireEvent.click(backBtn);
    expect(screen.getAllByText('My Computer').length).toBeGreaterThan(0);

    const fwdBtn = screen.getByTitle('Forward');
    fireEvent.click(fwdBtn);
    expect(screen.getByText('C:\\')).toBeInTheDocument();
  });

  test('selection shows name in status bar', () => {
    renderMyComputer();
    const driveC = screen.getByText('Local Disk (C:)');
    fireEvent.click(driveC);

    // Status bar should show selected item
    expect(screen.getAllByText('Local Disk (C:)').length).toBeGreaterThan(1);
  });
});
