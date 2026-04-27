import React from 'react';
import { render, screen } from '@testing-library/react';
import { DesktopDestroyer } from '@retro-web/app-desktop-destroyer';
import { WindowManagerProvider, OsShellProvider } from '@retro-web/core/context';

// Mock canvas
beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    drawImage: jest.fn(),
    getImageData: jest.fn().mockReturnValue({ data: new Uint8ClampedArray(4) }),
    putImageData: jest.fn(),
    createImageData: jest.fn().mockReturnValue({ data: new Uint8ClampedArray(4) }),
    setTransform: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    stroke: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
  });
  HTMLCanvasElement.prototype.toDataURL = jest.fn().mockReturnValue('data:image/png;base64,');
});

describe('DesktopDestroyer (WinXP)', () => {
  test('renders desktop destroyer with winxp skin', () => {
    render(
      <OsShellProvider
        value={{
          osMode: 'multi-window',
          currentApp: 'desktop-destroyer',
          openApp: () => {},
          goHome: () => {},
          AppWindow: ({ children }) => <div>{children}</div>,
          TitleBar: () => null,
          MenuBar: () => null,
          writeFile: () => {},
        }}
      >
        <WindowManagerProvider
          registry={[
            { id: 'desktop-destroyer', label: 'Desktop Destroyer', icon: '', desktop: true },
          ]}
          initialOpenAppId="desktop-destroyer"
        >
          <DesktopDestroyer skin="winxp" />
        </WindowManagerProvider>
      </OsShellProvider>,
    );
    // Desktop destroyer doesn't have a window, it's a full-screen overlay
    expect(document.querySelector('.desktop-destroyer-overlay')).toBeInTheDocument();
    expect(document.querySelector('.desktop-destroyer-toolbar')).toBeInTheDocument();
  });
});
