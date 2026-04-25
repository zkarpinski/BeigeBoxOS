/**
 * Unit tests for Netscape Navigator.
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { NavigatorWindow, navigatorAppConfig } from './NavigatorWindow';
import { Win98TestProviders } from '../../../../test/test-utils';

const registry = [navigatorAppConfig];

describe('NavigatorWindow', () => {
  beforeEach(() => {
    // Reset fetch mock
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('<html><head></head><body>Hello</body></html>'),
    });
  });

  test('renders home page by default', () => {
    render(
      <Win98TestProviders registry={registry}>
        <NavigatorWindow />
      </Win98TestProviders>,
    );

    expect(screen.getByDisplayValue('about:home')).toBeInTheDocument();
  });

  test('navigates to normalized URL when Enter is pressed', async () => {
    render(
      <Win98TestProviders registry={registry}>
        <NavigatorWindow />
      </Win98TestProviders>,
    );

    const input = screen.getByDisplayValue('about:home');
    fireEvent.change(input, { target: { value: 'google.com' } });

    await act(async () => {
      fireEvent.keyDown(input, { key: 'Enter' });
    });

    expect(input).toHaveValue('https://google.com');
  });

  test('back button is initially disabled', () => {
    render(
      <Win98TestProviders registry={registry}>
        <NavigatorWindow />
      </Win98TestProviders>,
    );

    const backBtn = screen.getByTitle('Back');
    expect(backBtn).toBeDisabled();
  });

  test('menu items work (e.g. Help -> About)', () => {
    window.alert = jest.fn();
    render(
      <Win98TestProviders registry={registry}>
        <NavigatorWindow />
      </Win98TestProviders>,
    );

    // Use a matcher that ignores the <u> tags
    const helpMenu = screen.getByText((content, element) => {
      return element?.classList.contains('nav-menu-item') && element.textContent === 'Help';
    });
    fireEvent.click(helpMenu);

    const aboutItem = screen.getByText((content, element) => {
      return (
        element?.classList.contains('nav-menu-dropdown-item') &&
        element.textContent?.includes('About Netscape')
      );
    });
    fireEvent.click(aboutItem);

    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Netscape Navigator'));
  });
});
