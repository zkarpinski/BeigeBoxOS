/**
 * Unit tests for Karpos AppWindow.
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AppWindow } from '../app/components/karpos-shell/app-window';
import { WindowManagerProvider } from '@retro-web/core/context';

describe('Karpos AppWindow', () => {
  const mockRegistry = [
    { id: 'test-app', label: 'Test App', icon: '', component: () => null, openByDefault: true },
  ];

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders children when visible', () => {
    render(
      <WindowManagerProvider registry={mockRegistry} applyOpenByDefault={true}>
        <AppWindow id="test-window" appId="test-app" titleBar={<div>Title</div>}>
          <div>Content</div>
        </AppWindow>
      </WindowManagerProvider>,
    );

    const content = screen.getByText('Content');
    expect(content).toBeInTheDocument();

    const win = document.getElementById('test-window');
    expect(win).not.toHaveClass('app-window-hidden');
    expect(win).toHaveStyle('display: flex');
  });

  test('hides when minimized', async () => {
    const Title = () => (
      <div>
        <button data-win-min>Min</button>
      </div>
    );

    render(
      <WindowManagerProvider registry={mockRegistry} applyOpenByDefault={true}>
        <AppWindow id="test-window" appId="test-app" titleBar={<Title />}>
          <div>Content</div>
        </AppWindow>
      </WindowManagerProvider>,
    );

    const win = document.getElementById('test-window');
    expect(win).not.toHaveClass('app-window-hidden');

    fireEvent.click(screen.getByText('Min'));

    // Fast-forward timers
    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(win).toHaveClass('app-window-hidden');
    expect(win).toHaveStyle('display: none');
  });

  test('closes when close button clicked', () => {
    const Title = () => (
      <div>
        <button data-win-close>Close</button>
      </div>
    );

    render(
      <WindowManagerProvider registry={mockRegistry} applyOpenByDefault={true}>
        <AppWindow id="test-window" appId="test-app" titleBar={<Title />}>
          <div>Content</div>
        </AppWindow>
      </WindowManagerProvider>,
    );

    const win = document.getElementById('test-window');
    expect(win).toBeInTheDocument();
    expect(win).not.toHaveClass('app-window-hidden');

    fireEvent.click(screen.getByText('Close'));

    expect(win).toHaveClass('app-window-hidden');
  });
});
