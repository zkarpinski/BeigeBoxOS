import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import {
  TaskManagerWindow,
  taskmanagerAppConfig,
} from '../app/components/apps/taskmanager/TaskManagerWindow';
import { WindowManagerProvider, OsShellProvider } from '@retro-web/core/context';
import { TitleBar } from '../app/components/winxp/TitleBar';
import { AppWindow } from '../app/components/winxp/AppWindow';
import { DialogModal } from '../app/components/shell/overlays/DialogModal';

// Mock OsShellProvider to use WinXP components
const mockOsShell = {
  AppWindow,
  TitleBar,
  MenuBar: () => <div data-testid="mock-menubar" />,
};

// Mock canvas
beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
    fillRect: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
  });
});

describe('TaskManagerWindow', () => {
  const registry = [
    taskmanagerAppConfig,
    { id: 'notepad', label: 'Notepad', icon: '', desktop: false },
  ];

  const renderTaskManager = (showNotepad = false) => {
    const testRegistry = [
      { ...taskmanagerAppConfig, openByDefault: true },
      { id: 'notepad', label: 'Notepad', icon: '', desktop: false, openByDefault: showNotepad },
    ];
    return render(
      <OsShellProvider value={mockOsShell}>
        <WindowManagerProvider registry={testRegistry}>
          <TaskManagerWindow registry={testRegistry} />
          <DialogModal />
        </WindowManagerProvider>
      </OsShellProvider>,
    );
  };

  test('renders with Processes tab by default', async () => {
    renderTaskManager();
    expect(await screen.findByText(/Image Name/i)).toBeInTheDocument();
    expect(screen.getByText(/taskmgr\.exe/i)).toBeInTheDocument();
  });

  test('switches to Applications tab', () => {
    renderTaskManager(true); // Show notepad

    fireEvent.click(screen.getByText('Applications'));

    expect(screen.getByText('Task')).toBeInTheDocument();
    expect(screen.getByText('Notepad')).toBeInTheDocument();
  });

  test('switches to Performance tab', () => {
    renderTaskManager();
    fireEvent.click(screen.getByText('Performance'));

    expect(screen.getByText('CPU Usage')).toBeInTheDocument();
    expect(screen.getByText('PF Usage')).toBeInTheDocument();
  });

  test('ending a process shows warning dialog', async () => {
    renderTaskManager(true);

    // Find notepad.exe in processes
    const notepadRow = screen.getByText('notepad.exe');
    fireEvent.click(notepadRow);

    const endBtn = screen.getByText('End Process');
    fireEvent.click(endBtn);

    // Should show dialog (provided by WindowManagerContext)
    // Since we are using a real WindowManagerProvider, it should open a dialog
    expect(
      await screen.findByText(/Are you sure you want to terminate the process/i),
    ).toBeInTheDocument();
  });

  test('sorting processes by memory', () => {
    renderTaskManager();
    const memHeader = screen.getByText(/Mem Usage/i);
    fireEvent.click(memHeader);

    // Sort logic is tested by seeing if it doesn't crash and potentially checking order
    const rows = document.querySelectorAll('.tm-proc-row');
    expect(rows.length).toBeGreaterThan(10);
  });
});
