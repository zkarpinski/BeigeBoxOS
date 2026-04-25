import React from 'react';
import { render, screen } from '@testing-library/react';
import { PaintWindow } from '../app/components/apps/paint/PaintWindow';
import { WindowManagerProvider, OsShellProvider } from '@retro-web/core/context';
import { TitleBar } from '../app/components/winxp/TitleBar';
import { AppWindow } from '../app/components/winxp/AppWindow';

// Mock OsShellProvider to use WinXP components
const mockOsShell = {
  AppWindow,
  TitleBar,
  MenuBar: () => <div data-testid="mock-menubar" />,
};

// Mock canvas for PaintContent
beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = jest.fn().mockReturnValue({
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    drawImage: jest.fn(),
    getImageData: jest.fn().mockReturnValue({ data: new Uint8ClampedArray(4) }),
    putImageData: jest.fn(),
    createImageData: jest.fn().mockReturnValue({ data: new Uint8ClampedArray(4) }),
    setTransform: jest.fn(),
    drawFocusIfNeeded: jest.fn(),
    save: jest.fn(),
    restore: jest.fn(),
  });
  HTMLCanvasElement.prototype.toDataURL = jest.fn().mockReturnValue('data:image/png;base64,');
});

describe('PaintWindow', () => {
  test('renders Paint wrapper', () => {
    render(
      <OsShellProvider value={mockOsShell}>
        <WindowManagerProvider
          registry={[{ id: 'paint', label: 'Paint', icon: '', desktop: true }]}
          initialOpenAppId="paint"
        >
          <PaintWindow />
        </WindowManagerProvider>
      </OsShellProvider>,
    );
    expect(screen.getByText('untitled - Paint')).toBeInTheDocument();
    // Check for some paint-specific element from core
    expect(document.querySelector('.paint-canvas-container')).toBeInTheDocument();
  });
});
