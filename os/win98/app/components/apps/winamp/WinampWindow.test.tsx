/**
 * Unit and functional tests for WinampWindow.
 * Covers rendering, transport controls (play/pause/stop), marquee text,
 * time display, and audio element integration.
 */
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WinampWindow, winampAppConfig } from './WinampWindow';
import { Win98TestProviders } from '../../../../test/test-utils';

// jsdom doesn't implement HTMLMediaElement or canvas 2d context — stub them out
beforeAll(() => {
  window.HTMLMediaElement.prototype.play = jest.fn().mockResolvedValue(undefined);
  window.HTMLMediaElement.prototype.pause = jest.fn();
  const noop = jest.fn();
  HTMLCanvasElement.prototype.getContext = jest.fn().mockImplementation((contextType: string) => {
    if (contextType === '2d') {
      return {
        fillStyle: '',
        fillRect: noop,
        getImageData: noop,
        putImageData: noop,
        createLinearGradient: () => ({ addColorStop: noop }),
      } as unknown as CanvasRenderingContext2D;
    }
    return null;
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

function renderWinamp() {
  const config = { ...winampAppConfig, openByDefault: true };
  return render(
    <Win98TestProviders registry={[config]}>
      <WinampWindow />
    </Win98TestProviders>,
  );
}

function getWindow(): HTMLElement {
  const win = document.getElementById('winamp-window');
  if (!win) throw new Error('winamp-window not found');
  return win;
}

function getMarquee(): string {
  return getWindow().querySelector('.winamp-marquee')!.textContent ?? '';
}

function getTimeDisplay(): string {
  return getWindow().querySelector('.winamp-time')!.textContent ?? '';
}

function getAudio(): HTMLAudioElement {
  return getWindow().querySelector('audio') as HTMLAudioElement;
}

describe('WinampWindow', () => {
  test('renders without crashing', () => {
    renderWinamp();
    expect(getWindow()).toBeInTheDocument();
  });

  test('shows initial time of 00:00', () => {
    renderWinamp();
    expect(getTimeDisplay()).toBe('00:00');
  });

  test('shows initial marquee text', () => {
    renderWinamp();
    expect(getMarquee()).toMatch(/IT REALLY WHIPS THE LLAMA'S ASS/i);
  });

  test('has all five transport buttons', () => {
    renderWinamp();
    expect(screen.getByTitle('Previous')).toBeInTheDocument();
    expect(screen.getByTitle('Play')).toBeInTheDocument();
    expect(screen.getByTitle('Pause')).toBeInTheDocument();
    expect(screen.getByTitle('Stop')).toBeInTheDocument();
    expect(screen.getByTitle('Next')).toBeInTheDocument();
  });

  test('has canvas visualizer element', () => {
    renderWinamp();
    const canvas = getWindow().querySelector('canvas.winamp-viz');
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveAttribute('width', '255');
    expect(canvas).toHaveAttribute('height', '36');
  });

  test('has audio element with correct src', () => {
    renderWinamp();
    const audio = getAudio();
    expect(audio).toBeInTheDocument();
    expect(audio.src).toMatch(/llama\.mp3/);
  });

  describe('Play button', () => {
    test('calls audio.play()', async () => {
      const user = userEvent.setup();
      renderWinamp();
      await user.click(screen.getByTitle('Play'));
      expect(window.HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
    });

    test('updates marquee to playing text', async () => {
      const user = userEvent.setup();
      renderWinamp();
      await user.click(screen.getByTitle('Play'));
      expect(getMarquee()).toMatch(/IT REALLY WHIPS THE LLAMA'S ASS/i);
      expect(getMarquee()).toMatch(/\*\*\*/);
    });
  });

  describe('Pause button', () => {
    test('calls audio.pause()', async () => {
      const user = userEvent.setup();
      renderWinamp();
      await user.click(screen.getByTitle('Play'));
      await user.click(screen.getByTitle('Pause'));
      expect(window.HTMLMediaElement.prototype.pause).toHaveBeenCalled();
    });

    test('shows PAUSED in marquee', async () => {
      const user = userEvent.setup();
      renderWinamp();
      await user.click(screen.getByTitle('Play'));
      await user.click(screen.getByTitle('Pause'));
      expect(getMarquee()).toMatch(/PAUSED/);
    });
  });

  describe('Stop button', () => {
    test('calls audio.pause()', async () => {
      const user = userEvent.setup();
      renderWinamp();
      await user.click(screen.getByTitle('Play'));
      await user.click(screen.getByTitle('Stop'));
      expect(window.HTMLMediaElement.prototype.pause).toHaveBeenCalled();
    });

    test('shows STOPPED in marquee', async () => {
      const user = userEvent.setup();
      renderWinamp();
      await user.click(screen.getByTitle('Play'));
      await user.click(screen.getByTitle('Stop'));
      expect(getMarquee()).toMatch(/STOPPED/);
    });

    test('resets time display to 00:00', async () => {
      const user = userEvent.setup();
      renderWinamp();
      await user.click(screen.getByTitle('Play'));
      await user.click(screen.getByTitle('Stop'));
      expect(getTimeDisplay()).toBe('00:00');
    });

    test('resets audio currentTime to 0', async () => {
      const user = userEvent.setup();
      renderWinamp();
      const audio = getAudio();
      await user.click(screen.getByTitle('Play'));
      await user.click(screen.getByTitle('Stop'));
      expect(audio.currentTime).toBe(0);
    });
  });

  describe('audio onEnded', () => {
    test('fires stop behavior when track ends', async () => {
      renderWinamp();
      const audio = getAudio();
      // Simulate play first so marquee is in playing state
      await userEvent.click(screen.getByTitle('Play'));
      // Fire the ended event
      act(() => {
        audio.dispatchEvent(new Event('ended'));
      });
      expect(getMarquee()).toMatch(/STOPPED/);
      expect(getTimeDisplay()).toBe('00:00');
    });
  });
});
