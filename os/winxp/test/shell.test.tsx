/**
 * Unit tests for WinXP shell components: BootScreen, Taskbar, DesktopIcons, StartMenuTree, ShellOverlays.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BootScreen } from '../app/components/shell/BootScreen';
import { Taskbar } from '../app/components/shell/Taskbar';
import { DesktopIcons } from '../app/components/shell/DesktopIcons';
import { ShellOverlays } from '../app/components/shell/ShellOverlays';
import { WindowManagerProvider } from '@retro-web/core/context';
import type { AppConfig } from '../app/types/app-config';

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
    // Start menu is not in DOM when closed in XP implementation
    expect(document.getElementById('xp-start-menu')).not.toBeInTheDocument();
    await user.click(startBtn!);
    expect(document.getElementById('xp-start-menu')).toBeInTheDocument();
    await user.click(startBtn!);
    expect(document.getElementById('xp-start-menu')).not.toBeInTheDocument();
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
  test('start menu has username when open', async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(document.getElementById('start-button')!);
    const startMenu = document.getElementById('xp-start-menu');
    expect(startMenu?.querySelector('.xp-sm-username')).toHaveTextContent(/User/);
  });

  test('start menu has All Programs, My Documents, Control Panel, Run, Turn Off Computer', async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(document.getElementById('start-button')!);
    expect(screen.getByText('All Programs')).toBeInTheDocument();
    expect(screen.getByText('My Documents')).toBeInTheDocument();
    expect(screen.getByText('Control Panel')).toBeInTheDocument();
    expect(screen.getByText('Run...')).toBeInTheDocument();
    expect(screen.getByText('Turn Off Computer')).toBeInTheDocument();
  });

  test('clicking Run opens run dialog', async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(document.getElementById('start-button')!);
    const runItem = document.getElementById('xp-right-run');
    expect(runItem).toBeInTheDocument();
    await user.click(runItem!);
    expect(document.getElementById('run-dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/open/i)).toBeInTheDocument();
  });

  test('Turn Off Computer opens shutdown overlay when clicked', async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(document.getElementById('start-button')!);
    const shutdownBtn = screen.getByText('Turn Off Computer');
    await user.click(shutdownBtn);
    const overlay = document.querySelector('.shutdown-screen');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveTextContent(/Click anywhere to return/i);
  });
});

describe('ShellOverlays', () => {
  test('Run dialog has OK and Cancel buttons when open', async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(document.getElementById('start-button')!);
    await user.click(document.getElementById('xp-right-run')!);
    expect(screen.getByRole('button', { name: /ok/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  test('Run dialog close button hides dialog', async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(document.getElementById('start-button')!);
    await user.click(document.getElementById('xp-right-run')!);
    expect(document.getElementById('run-dialog')).toBeInTheDocument();
    const closeBtn = document.getElementById('run-close-btn');
    await user.click(closeBtn!);
    expect(document.getElementById('run-dialog')).not.toBeInTheDocument();
  });

  test('Run dialog shows run icon and description', async () => {
    const user = userEvent.setup();
    renderShell();
    await user.click(document.getElementById('start-button')!);
    await user.click(document.getElementById('xp-right-run')!);
    expect(screen.getByText(/Type the name of a program/i)).toBeInTheDocument();
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
