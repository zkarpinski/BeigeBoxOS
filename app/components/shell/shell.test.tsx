/**
 * Unit tests for shell components: BootScreen, Taskbar, DesktopIcons, StartMenuTree, ShellOverlays.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BootScreen } from './BootScreen';
import { Taskbar } from './Taskbar';
import { DesktopIcons } from './DesktopIcons';
import { ShellOverlays } from './ShellOverlays';
import { WindowManagerProvider } from '../../context/WindowManagerContext';
import type { AppConfig } from '../../types/app-config';

const mockAppWithDesktop: AppConfig = {
  id: 'notepad',
  label: 'Notepad',
  icon: 'apps/notepad/notepad-icon.png',
  desktop: true,
  startMenu: { path: ['Programs', 'Accessories'] },
  taskbarLabel: 'Notepad',
};

const mockAppNoDesktop: AppConfig = {
  id: 'calculator',
  label: 'Calculator',
  icon: 'apps/calculator/calculator-icon.png',
  desktop: false,
  startMenu: { path: ['Programs', 'Accessories'] },
  taskbarLabel: 'Calculator',
};

const mockRegistry: AppConfig[] = [mockAppWithDesktop, mockAppNoDesktop];

function renderShell() {
  return render(
    <WindowManagerProvider registry={mockRegistry}>
      <BootScreen />
      <DesktopIcons registry={mockRegistry} />
      <Taskbar registry={mockRegistry} />
      <ShellOverlays />
    </WindowManagerProvider>,
  );
}

describe('BootScreen', () => {
  test('renders boot screen with splash and progress bar', () => {
    render(
      <WindowManagerProvider registry={[]}>
        <BootScreen />
      </WindowManagerProvider>,
    );
    const bootScreen = document.getElementById('boot-screen');
    expect(bootScreen).toBeInTheDocument();
    expect(bootScreen?.querySelector('.boot-splash')).toBeInTheDocument();
    expect(bootScreen?.querySelector('#boot-bar-fill')).toBeInTheDocument();
    expect(document.getElementById('boot-sound')).toBeInTheDocument();
  });

  test('has boot click prompt element', () => {
    render(
      <WindowManagerProvider registry={[]}>
        <BootScreen />
      </WindowManagerProvider>,
    );
    expect(document.getElementById('boot-click-prompt')).toBeInTheDocument();
  });
});

describe('Taskbar', () => {
  test('renders taskbar with start button and clock', () => {
    renderShell();
    expect(document.getElementById('taskbar')).toBeInTheDocument();
    expect(document.getElementById('start-button')).toBeInTheDocument();
    expect(document.getElementById('clock')).toBeInTheDocument();
  });

  test('renders task items for each app in registry', () => {
    renderShell();
    expect(document.getElementById('taskbar-notepad')).toBeInTheDocument();
    expect(document.getElementById('taskbar-calculator')).toBeInTheDocument();
  });

  test('start button toggles start menu', async () => {
    const user = userEvent.setup();
    renderShell();
    const startBtn = document.getElementById('start-button');
    expect(startBtn).toBeInTheDocument();
    const startMenu = document.getElementById('start-menu');
    expect(startMenu).toHaveClass('hidden');
    await user.click(startBtn!);
    expect(startMenu).not.toHaveClass('hidden');
    await user.click(startBtn!);
    expect(startMenu).toHaveClass('hidden');
  });

  test('volume tray icon and popup exist', () => {
    renderShell();
    expect(document.getElementById('tray-volume')).toBeInTheDocument();
    expect(document.getElementById('volume-popup')).toBeInTheDocument();
  });
});

describe('DesktopIcons', () => {
  test('renders desktop icons container', () => {
    renderShell();
    expect(document.getElementById('desktop-icons')).toBeInTheDocument();
  });

  test('shows icon only for apps with desktop enabled', () => {
    renderShell();
    expect(document.getElementById('notepad-desktop-icon')).toBeInTheDocument();
    expect(document.getElementById('calculator-desktop-icon')).not.toBeInTheDocument();
  });

  test('desktop icon has label and image', () => {
    renderShell();
    const icon = document.getElementById('notepad-desktop-icon');
    expect(icon).toHaveTextContent('Notepad');
    expect(icon?.querySelector('img')).toHaveAttribute('src', mockAppWithDesktop.icon);
  });
});

describe('StartMenuTree', () => {
  test('start menu has Windows 98 title when open', async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(document.getElementById('start-button')!);
    const startMenu = document.getElementById('start-menu');
    expect(startMenu?.querySelector('.start-menu-title')).toHaveTextContent(/Windows/);
    expect(startMenu?.querySelector('.start-menu-title')).toHaveTextContent(/98/);
  });

  test('start menu has Windows Update item', async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(document.getElementById('start-button')!);
    expect(document.getElementById('start-windows-update')).toBeInTheDocument();
    expect(screen.getByText('Windows Update')).toBeInTheDocument();
  });

  test('start menu has Programs, Documents, Settings, Find, Help, Run, Shut Down', async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(document.getElementById('start-button')!);
    expect(screen.getByText('Programs')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Find')).toBeInTheDocument();
    expect(screen.getByText('Help')).toBeInTheDocument();
    expect(screen.getByText(/Run/)).toBeInTheDocument();
    expect(screen.getByText(/Shut Down/)).toBeInTheDocument();
  });

  test('clicking Run opens run dialog', async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(document.getElementById('start-button')!);
    const runItem = document.getElementById('start-run');
    expect(runItem).toBeInTheDocument();
    await user.click(runItem!);
    expect(document.getElementById('run-dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/open/i)).toBeInTheDocument();
  });

  test('Shut Down menu item exists and opens shutdown overlay when clicked', async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(document.getElementById('start-button')!);
    const startMenu = document.getElementById('start-menu');
    const shutdownItem =
      startMenu?.querySelector('[id="start-shutdown"]') ?? screen.getByText('Shut Down...');
    expect(shutdownItem).toBeInTheDocument();
    await user.click(shutdownItem as HTMLElement);
    const overlay = document.querySelector('.shutdown-screen');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveTextContent(/safe to turn off/i);
  });

  test('Programs submenu has Accessories with registry apps', async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(document.getElementById('start-button')!);
    expect(screen.getByText('Accessories')).toBeInTheDocument();
    const notepadItem = document.getElementById('start-menu-notepad');
    expect(notepadItem).toBeInTheDocument();
    expect(notepadItem).toHaveTextContent('Notepad');
  });
});

describe('ShellOverlays', () => {
  test('Run dialog has OK and Cancel buttons when open', async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(document.getElementById('start-button')!);
    await user.click(document.getElementById('start-run')!);
    expect(screen.getByRole('button', { name: /ok/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  test('Run dialog close button hides dialog', async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(document.getElementById('start-button')!);
    await user.click(document.getElementById('start-run')!);
    expect(document.getElementById('run-dialog')).toBeInTheDocument();
    const closeBtn = document.querySelector('#run-dialog .run-titlebtn');
    await user.click(closeBtn as HTMLElement);
    expect(document.getElementById('run-dialog')).not.toBeInTheDocument();
  });

  test('Run dialog shows run icon and description', async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(document.getElementById('start-button')!);
    await user.click(document.getElementById('start-run')!);
    expect(screen.getByText(/type the name of a program/i)).toBeInTheDocument();
  });
});

describe('Shell integration', () => {
  test('full shell render without crash', () => {
    expect(() => renderShell()).not.toThrow();
  });

  test('clicking desktop icon launches app via context', async () => {
    const user = userEvent.setup();
    renderShell();
    const icon = document.getElementById('notepad-desktop-icon');
    expect(icon).toBeInTheDocument();
    await user.dblClick(icon!);
    const taskbarNotepad = document.getElementById('taskbar-notepad');
    expect(taskbarNotepad).not.toHaveClass('app-taskbar-hidden');
  });
});
