/**
 * Unit tests for Ie5Window, focusing on Windows Update integration.
 */
import React from 'react';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Ie5Window, ie5AppConfig } from './Ie5Window';
import { Taskbar } from '../../shell/Taskbar';
import { WindowManagerProvider } from '../../../context/WindowManagerContext';
import type { AppConfig } from '../../../types/app-config';

const registry: AppConfig[] = [ie5AppConfig];

function renderWithIe5() {
  return render(
    <WindowManagerProvider registry={registry}>
      <Taskbar registry={registry} />
      <Ie5Window />
    </WindowManagerProvider>,
  );
}

describe('Ie5Window', () => {
  test('IE5 window is initially hidden', () => {
    renderWithIe5();
    const win = document.getElementById('ie5-window');
    expect(win).toBeInTheDocument();
    expect(win).toHaveClass('app-window-hidden');
  });

  test('clicking Windows Update in Start Menu shows IE5 window', async () => {
    const user = userEvent.setup();
    renderWithIe5();

    await user.click(document.getElementById('start-button')!);
    await user.click(document.getElementById('start-windows-update')!);

    const win = document.getElementById('ie5-window');
    expect(win).not.toHaveClass('app-window-hidden');
  });

  test('clicking Windows Update sets URL bar to windowsupdate.microsoft.com', async () => {
    const user = userEvent.setup();
    renderWithIe5();

    await user.click(document.getElementById('start-button')!);
    await user.click(document.getElementById('start-windows-update')!);

    const urlInput = document.querySelector('.ie5-url-input') as HTMLInputElement | null;
    expect(urlInput?.value).toBe('http://windowsupdate.microsoft.com/');
  });

  test('clicking Windows Update loads update page srcdoc in iframe', async () => {
    const user = userEvent.setup();
    renderWithIe5();

    await user.click(document.getElementById('start-button')!);
    await user.click(document.getElementById('start-windows-update')!);

    const iframe = document.querySelector('#ie5-window iframe') as HTMLIFrameElement | null;
    expect(iframe).toBeInTheDocument();
    expect(iframe?.getAttribute('srcdoc')).toContain('Windows Update');
  });

  test('clicking Windows Update closes start menu', async () => {
    const user = userEvent.setup();
    renderWithIe5();

    await user.click(document.getElementById('start-button')!);
    expect(document.getElementById('start-menu')).not.toHaveClass('hidden');

    await user.click(document.getElementById('start-windows-update')!);
    expect(document.getElementById('start-menu')).toHaveClass('hidden');
  });
});
