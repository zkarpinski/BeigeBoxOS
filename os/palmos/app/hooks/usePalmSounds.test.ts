import { renderHook, act } from '@testing-library/react';
import { usePalmSounds } from './usePalmSounds';

// Mock AudioContext
const mockOscillator = {
  connect: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  type: '',
  frequency: {
    setValueAtTime: jest.fn(),
  },
};

const mockGain = {
  connect: jest.fn(),
  gain: {
    setValueAtTime: jest.fn(),
    exponentialRampToValueAtTime: jest.fn(),
  },
};

const mockAudioContext = {
  createOscillator: jest.fn(() => mockOscillator),
  createGain: jest.fn(() => mockGain),
  destination: {},
  currentTime: 0,
};

describe('usePalmSounds Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (window as any).AudioContext = jest.fn(() => mockAudioContext);
  });

  afterEach(() => {
    delete (window as any).AudioContext;
  });

  it('initializes AudioContext on first play', () => {
    const { result } = renderHook(() => usePalmSounds());

    act(() => {
      result.current.playClick();
    });

    expect(window.AudioContext).toHaveBeenCalled();
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
  });

  it('triggers playClick with correct frequency (1200)', () => {
    const { result } = renderHook(() => usePalmSounds());

    act(() => {
      result.current.playClick();
    });

    expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(1200, expect.any(Number));
  });

  it('triggers playSuccess with two beeps', () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => usePalmSounds());

    act(() => {
      result.current.playSuccess();
    });

    expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(880, expect.any(Number));

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(1320, expect.any(Number));
    jest.useRealTimers();
  });

  it('triggers playError with two beeps', () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => usePalmSounds());

    act(() => {
      result.current.playError();
    });

    expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(440, expect.any(Number));

    act(() => {
      jest.advanceTimersByTime(150);
    });

    expect(mockOscillator.frequency.setValueAtTime).toHaveBeenCalledWith(220, expect.any(Number));
    jest.useRealTimers();
  });
});
