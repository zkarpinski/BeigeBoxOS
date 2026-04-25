import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Ie6Window } from '../app/components/apps/ie6/Ie5Window'; // Note: filename is Ie5Window.tsx
import { WindowManagerProvider, OsShellProvider } from '@retro-web/core/context';
import { TitleBar } from '../app/components/winxp/TitleBar';
import { AppWindow } from '../app/components/winxp/AppWindow';

// Mock OsShellProvider to use WinXP components
const mockOsShell = {
  AppWindow,
  TitleBar,
  MenuBar: () => <div data-testid="mock-menubar" />,
};

describe('Ie6Window', () => {
  const renderIe6 = () => {
    return render(
      <OsShellProvider value={mockOsShell}>
        <WindowManagerProvider
          registry={[{ id: 'ie6', label: 'Internet Explorer', icon: '', desktop: true }]}
          initialOpenAppId="ie6"
        >
          <Ie6Window />
        </WindowManagerProvider>
      </OsShellProvider>,
    );
  };

  test('renders IE window with address bar', () => {
    renderIe6();
    expect(screen.getByText(/Microsoft Internet Explorer/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('http://www.msn.com/')).toBeInTheDocument();
  });

  test('navigates to a new URL', () => {
    renderIe6();
    const addressInput = screen.getByDisplayValue('http://www.msn.com/');
    fireEvent.change(addressInput, { target: { value: 'google.com' } });
    fireEvent.keyDown(addressInput, { key: 'Enter' });

    expect(screen.getByDisplayValue('https://www.google.com')).toBeInTheDocument();
    expect(screen.getByText(/Opening page https:\/\/www\.google\.com/i)).toBeInTheDocument();
  });

  test('clicking favorites navigates', () => {
    renderIe6();
    const ebayFav = screen.getByText('Ebay');
    fireEvent.click(ebayFav);

    expect(screen.getByDisplayValue('http://www.ebay.com/')).toBeInTheDocument();
  });

  test('about dialog can be opened and closed', async () => {
    const { container } = renderIe6();
    const menuItems = container.querySelectorAll('.ie5-menu-item');
    const helpMenu = Array.from(menuItems).find((el) => el.textContent?.includes('Help'));
    if (!helpMenu) throw new Error('Help menu not found');
    fireEvent.click(helpMenu);

    const aboutItem = await screen.findByText(
      (content, node) => node?.textContent === 'About Internet Explorer',
    );
    fireEvent.click(aboutItem);

    expect(await screen.findByText(/Version: 5\.00\.2314\.1003/)).toBeInTheDocument();

    const okBtn = screen.getByText('OK');
    fireEvent.click(okBtn);

    await waitFor(() => {
      expect(screen.queryByText('Version: 5.00.2314.1003')).not.toBeInTheDocument();
    });
  });

  test('sidebar can be closed', () => {
    const { container } = renderIe6();
    // Use getAllByText and pick the one in the sidebar header
    const favoritesHeader = screen
      .getAllByText('Favorites')
      .find((el) => el.closest('.ie5-sidebar-header'));
    expect(favoritesHeader).toBeInTheDocument();

    const closeSidebarBtn = container.querySelector('.ie5-sidebar-close');
    if (!closeSidebarBtn) throw new Error('Close sidebar button not found');
    fireEvent.click(closeSidebarBtn);

    expect(
      screen.queryByText('Favorites', { selector: '.ie5-sidebar-header span' }),
    ).not.toBeInTheDocument();
  });
});
