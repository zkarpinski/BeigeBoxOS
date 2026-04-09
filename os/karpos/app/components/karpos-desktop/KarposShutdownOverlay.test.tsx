import React from 'react';
import { render, act } from '@testing-library/react';
import { KarposShutdownOverlay } from './KarposShutdownOverlay';

describe('KarposShutdownOverlay', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 200 });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 100,
    });

    jest.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      return setTimeout(cb, 16) as unknown as number;
    });
    jest.spyOn(window, 'cancelAnimationFrame').mockImplementation((id: number) => {
      clearTimeout(id);
    });
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('renders the correct number of tiles before applying the started class to avoid race conditions', () => {
    const { container, rerender } = render(<KarposShutdownOverlay open={false} />);

    // Not in document initially
    expect(document.getElementById('karpos-shutdown-overlay')).not.toBeInTheDocument();

    // Rerender as open
    act(() => {
      rerender(<KarposShutdownOverlay open={true} />);
    });

    const overlay = document.getElementById('karpos-shutdown-overlay');
    expect(overlay).toBeInTheDocument();

    // Before RAF timeouts have resolved, it should NOT have the started class
    expect(overlay).not.toHaveClass('karpos-shutdown-overlay--started');

    // Given 200x100 browser size and PIXEL_SIZE=100, we expect 2 pixels generated
    const pixels = document.querySelectorAll('.karpos-shutdown-pixel');
    expect(pixels.length).toBe(2);

    // Fast-forward to run our double RAF
    act(() => {
      jest.advanceTimersByTime(50);
    });

    // The started class should now be successfully attached
    expect(overlay).toHaveClass('karpos-shutdown-overlay--started');
  });
});
