import React, { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WindowManagerProvider, useWindowManager } from '@retro-web/core/context';
import type { AppConfig } from '@retro-web/core/types/app-config';
import { KarposApplicationsMenu } from './KarposApplicationsMenu';

const testRegistry: AppConfig[] = [
  { id: 'word', label: 'Word', icon: '/apps/word/icon.png', startMenu: { path: ['Programs'] } },
  {
    id: 'calc',
    label: 'Calculator',
    icon: '/apps/calculator/calculator-icon.png',
    startMenu: { path: ['Programs', 'Accessories'] },
  },
];

function MenuHarness({ registry }: { registry: AppConfig[] }) {
  const [menuOpen, setMenuOpen] = useState(true);
  return (
    <KarposApplicationsMenu registry={registry} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
  );
}

/** Reads shell dialog flags for assertions (Shut Down). */
function DialogFlags() {
  const { shutdownOpen } = useWindowManager();
  return <span data-testid="dialog-flags" data-shutdown={shutdownOpen ? '1' : '0'} />;
}

describe('KarposApplicationsMenu', () => {
  beforeEach(() => {
    try {
      sessionStorage.clear();
    } catch {
      /* ignore */
    }
  });

  it('opens a folder view when a folder tile is clicked (menu stays open)', async () => {
    const user = userEvent.setup();
    render(
      <WindowManagerProvider registry={testRegistry} applyOpenByDefault={false}>
        <MenuHarness registry={testRegistry} />
      </WindowManagerProvider>,
    );

    expect(screen.getByRole('dialog', { name: 'Applications' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^Accessories$/ }));

    expect(screen.getByRole('heading', { name: 'Accessories' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Calculator/ })).toBeInTheDocument();
  });

  it('closes the menu when Escape is pressed at the root view', async () => {
    const user = userEvent.setup();
    render(
      <WindowManagerProvider registry={testRegistry} applyOpenByDefault={false}>
        <MenuHarness registry={testRegistry} />
      </WindowManagerProvider>,
    );

    expect(document.getElementById('start-menu')).not.toHaveClass('hidden');
    await user.keyboard('{Escape}');
    expect(document.getElementById('start-menu')).toHaveClass('hidden');
  });

  it('returns to the root grid from a folder on Escape (or back button)', async () => {
    const user = userEvent.setup();
    render(
      <WindowManagerProvider registry={testRegistry} applyOpenByDefault={false}>
        <MenuHarness registry={testRegistry} />
      </WindowManagerProvider>,
    );

    await user.click(screen.getByRole('button', { name: /^Accessories$/ }));
    expect(screen.getByRole('heading', { name: 'Accessories' })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.getByRole('heading', { name: 'Applications' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Accessories$/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^Accessories$/ }));
    await user.click(screen.getByRole('button', { name: /‹ Applications/ }));
    expect(screen.getByRole('heading', { name: 'Applications' })).toBeInTheDocument();
  });

  it('opens Shut Down and closes the menu when Shut Down… is clicked', async () => {
    const user = userEvent.setup();
    render(
      <WindowManagerProvider registry={testRegistry} applyOpenByDefault={false}>
        <DialogFlags />
        <MenuHarness registry={testRegistry} />
      </WindowManagerProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Shut Down…' }));
    expect(document.getElementById('start-menu')).toHaveClass('hidden');
    expect(screen.getByTestId('dialog-flags')).toHaveAttribute('data-shutdown', '1');
  });

  it('sets sessionStorage when launching Word from the menu', async () => {
    const user = userEvent.setup();
    render(
      <WindowManagerProvider registry={testRegistry} applyOpenByDefault={false}>
        <MenuHarness registry={testRegistry} />
      </WindowManagerProvider>,
    );

    await user.click(screen.getByRole('button', { name: /^Word$/ }));
    expect(sessionStorage.getItem('word-open-new-doc')).toBe('1');
  });
});
