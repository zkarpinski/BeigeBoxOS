import React from 'react';
import { render, screen } from '@testing-library/react';
import { TitleBar } from '../app/components/winxp/TitleBar';

// Minimal mock for useWindowManager
jest.mock('@retro-web/core/context', () => ({
  useWindowManager: () => ({
    apps: {},
    hideApp: jest.fn(),
    focusApp: jest.fn(),
    minimizeApp: jest.fn(),
    setBounds: jest.fn(),
  }),
}));

describe('WinXP TitleBar', () => {
  it('renders winxp-title-bar class', () => {
    const { container } = render(
      <TitleBar title="Test Window" showMin showMax showClose />
    );
    const titleBar = container.querySelector('.winxp-title-bar');
    expect(titleBar).toBeTruthy();
  });

  it('renders color-coded close button with xp-btn-close class', () => {
    const { container } = render(
      <TitleBar title="Test Window" showMin showMax showClose />
    );
    const closeBtn = container.querySelector('.xp-btn-close');
    expect(closeBtn).toBeTruthy();
    expect(closeBtn).toHaveAttribute('data-win-close');
  });

  it('renders minimize button with xp-btn-min class', () => {
    const { container } = render(
      <TitleBar title="Test Window" showMin showMax showClose />
    );
    const minBtn = container.querySelector('.xp-btn-min');
    expect(minBtn).toBeTruthy();
    expect(minBtn).toHaveAttribute('data-win-min');
  });

  it('renders maximize button with xp-btn-max class', () => {
    const { container } = render(
      <TitleBar title="Test Window" showMin showMax showClose />
    );
    const maxBtn = container.querySelector('.xp-btn-max');
    expect(maxBtn).toBeTruthy();
    expect(maxBtn).toHaveAttribute('data-win-max');
  });

  it('renders the title text', () => {
    render(<TitleBar title="My Test App" showMin showMax showClose />);
    expect(screen.getByText('My Test App')).toBeTruthy();
  });
});
