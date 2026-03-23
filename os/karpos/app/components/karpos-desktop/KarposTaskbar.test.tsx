/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WindowManagerProvider } from '@retro-web/core/context';
import type { AppConfig } from '@retro-web/core/types/app-config';
import { KarposTaskbar } from './KarposTaskbar';

jest.mock('@win98/components/shell/taskbar/TaskbarTasks', () => ({
  TaskbarTasks: () => <div data-testid="taskbar-tasks" />,
}));

jest.mock('@win98/components/shell/taskbar/SystemTray', () => ({
  SystemTray: () => <div data-testid="system-tray" />,
}));

const testRegistry: AppConfig[] = [
  { id: 'word', label: 'Word', icon: '/apps/word/icon.png', startMenu: { path: ['Programs'] } },
  {
    id: 'calc',
    label: 'Calculator',
    icon: '/apps/calculator/calculator-icon.png',
    startMenu: { path: ['Programs', 'Accessories'] },
  },
];

describe('KarposTaskbar', () => {
  it('keeps the Applications menu open when a folder tile is clicked', async () => {
    const user = userEvent.setup();
    render(
      <WindowManagerProvider registry={testRegistry} applyOpenByDefault={false}>
        <KarposTaskbar registry={testRegistry} />
      </WindowManagerProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Applications' }));

    expect(document.getElementById('start-menu')).not.toHaveClass('hidden');

    await user.click(screen.getByRole('button', { name: /^Accessories$/ }));

    expect(document.getElementById('start-menu')).not.toHaveClass('hidden');
    expect(screen.getByRole('heading', { name: 'Accessories' })).toBeInTheDocument();
  });

  it('closes the menu when clicking the dimmed backdrop', async () => {
    const user = userEvent.setup();
    render(
      <WindowManagerProvider registry={testRegistry} applyOpenByDefault={false}>
        <KarposTaskbar registry={testRegistry} />
      </WindowManagerProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Applications' }));
    const backdrop = document.querySelector('.karpos-apps-backdrop');
    expect(backdrop).toBeTruthy();
    await user.click(backdrop!);

    expect(document.getElementById('start-menu')).toHaveClass('hidden');
  });
});
