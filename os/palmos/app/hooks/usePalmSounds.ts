'use client';

import { useCallback, useRef } from 'react';

export function usePalmSounds() {
  const audioContext = useRef<AudioContext | null>(null);

  const initAudio = useCallback(() => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  const playBeep = useCallback(
    (frequency = 880, duration = 0.05, type: OscillatorType = 'square') => {
      initAudio();
      if (!audioContext.current) return;

      const osc = audioContext.current.createOscillator();
      const gain = audioContext.current.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, audioContext.current.currentTime);

      gain.gain.setValueAtTime(0.1, audioContext.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.current.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioContext.current.destination);

      osc.start();
      osc.stop(audioContext.current.currentTime + duration);
    },
    [initAudio],
  );

  const playClick = () => playBeep(1200, 0.02, 'sine');
  const playError = () => {
    playBeep(440, 0.1, 'square');
    setTimeout(() => playBeep(220, 0.1, 'square'), 100);
  };
  const playSuccess = () => {
    playBeep(880, 0.05, 'sine');
    setTimeout(() => playBeep(1320, 0.05, 'sine'), 50);
  };

  return { playClick, playError, playSuccess };
}
