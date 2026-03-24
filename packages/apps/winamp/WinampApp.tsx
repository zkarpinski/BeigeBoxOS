'use client';

// ── Winamp inner UI ────────────────────────────────────────────────────────────
// This component contains the Winamp logic and UI without any window chrome
// (no AppWindow wrapper, no shell-specific imports). Wrap it in an AppWindow in
// the os-specific layer.

import React, { useState, useRef, useEffect, useCallback } from 'react';
import './winamp.css';

const N = 75; // visualizer bars

export function WinampApp() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeStr, setTimeStr] = useState('00:00');
  const [marquee, setMarquee] = useState("WINAMP: IT REALLY WHIPS THE LLAMA'S ASS");

  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animIdRef = useRef<number | null>(null);
  const vizActiveRef = useRef(false);
  const frameRef = useRef(0);
  const barsRef = useRef(new Float32Array(N));
  const peaksRef = useRef(new Float32Array(N));
  const peakVelRef = useRef(new Float32Array(N));
  const bandsRef = useRef(new Float32Array(6));
  const bandsTgtRef = useRef(new Float32Array(6));
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gradRef = useRef<CanvasGradient | null>(null);

  function getGrad(): CanvasGradient | null {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return null;
    if (!gradRef.current) {
      const g = ctx.createLinearGradient(0, 0, 0, canvas!.height);
      g.addColorStop(0.0, '#00FF00');
      g.addColorStop(0.5, '#00CC00');
      g.addColorStop(1.0, '#004400');
      gradRef.current = g;
    }
    return gradRef.current;
  }

  function vizStep() {
    frameRef.current++;
    const bars = barsRef.current;
    const peaks = peaksRef.current;
    const peakVel = peakVelRef.current;
    const bands = bandsRef.current;
    const bandsTgt = bandsTgtRef.current;

    if (vizActiveRef.current) {
      if (frameRef.current % 6 === 0) {
        for (let b = 0; b < 6; b++) {
          const base = b < 2 ? 0.65 : b < 4 ? 0.45 : 0.28;
          bandsTgt[b] = Math.max(0.02, Math.min(0.98, base + (Math.random() - 0.5) * 0.7));
        }
      }
      for (let b = 0; b < 6; b++) bands[b] += (bandsTgt[b] - bands[b]) * 0.28;
      for (let i = 0; i < N; i++) {
        const bIdx = Math.min(5, Math.floor((i / N) * 6));
        const tgt = Math.max(0, Math.min(1, bands[bIdx] * (0.72 + Math.random() * 0.56)));
        bars[i] += (tgt - bars[i]) * 0.38;
      }
    } else {
      for (let i = 0; i < N; i++) {
        bars[i] *= 0.84;
        if (bars[i] < 0.004) bars[i] = 0;
      }
    }

    for (let i = 0; i < N; i++) {
      if (bars[i] >= peaks[i]) {
        peaks[i] = bars[i];
        peakVel[i] = 0;
      } else {
        peakVel[i] += 0.0025;
        peaks[i] = Math.max(0, peaks[i] - peakVel[i]);
      }
    }
  }

  function vizDraw() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    const W = canvas.width,
      H = canvas.height;
    const bars = barsRef.current;
    const peaks = peaksRef.current;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);
    const grad = getGrad();

    for (let i = 0; i < N; i++) {
      const x1 = Math.round((i * W) / N);
      const x2 = Math.round(((i + 1) * W) / N) - 1;
      const bw = Math.max(1, x2 - x1);
      const h = Math.round(bars[i] * H);
      if (h > 0 && grad) {
        ctx.fillStyle = grad;
        ctx.fillRect(x1, H - h, bw, h);
      }
      if (peaks[i] > 0.004) {
        const py = Math.round(peaks[i] * H);
        ctx.fillStyle = '#00FF00';
        ctx.fillRect(x1, H - py, bw, 2);
      }
    }
  }

  const vizLoop = useCallback(() => {
    vizStep();
    vizDraw();
    const bars = barsRef.current;
    const peaks = peaksRef.current;
    let stillMoving = vizActiveRef.current;
    if (!stillMoving) {
      for (let i = 0; i < N; i++) {
        if (bars[i] > 0.004 || peaks[i] > 0.004) {
          stillMoving = true;
          break;
        }
      }
    }
    if (stillMoving) {
      animIdRef.current = requestAnimationFrame(vizLoop);
    } else {
      animIdRef.current = null;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx && canvas) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function vizStart() {
    vizActiveRef.current = true;
    if (!animIdRef.current) vizLoop();
  }

  function vizStop() {
    vizActiveRef.current = false;
    if (!animIdRef.current) vizLoop();
  }

  function updateTime() {
    const audio = audioRef.current;
    if (!audio) return;
    const secs = Math.floor(audio.currentTime);
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    setTimeStr((m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s);
  }

  function handlePlay() {
    audioRef.current?.play().catch((e) => console.log('Audio play error', e));
    setIsPlaying(true);
    setMarquee("WINAMP: IT REALLY WHIPS THE LLAMA'S ASS *** ");
    timerRef.current = setInterval(updateTime, 1000);
    vizStart();
  }

  function handlePause() {
    audioRef.current?.pause();
    setIsPlaying(false);
    setMarquee('WINAMP [PAUSED]');
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    vizStop();
  }

  function handleStop() {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIsPlaying(false);
    setMarquee('WINAMP [STOPPED]');
    setTimeStr('00:00');
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    vizStop();
  }

  void isPlaying; // referenced via setIsPlaying

  // Cleanup on unmount
  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animIdRef.current) cancelAnimationFrame(animIdRef.current);
    },
    [],
  );

  return (
    <div className="winamp-body">
      <div className="winamp-display">
        <div className="winamp-time">{timeStr}</div>
        <div className="winamp-marquee">{marquee}</div>
      </div>
      <canvas ref={canvasRef} className="winamp-viz" width="255" height="36" />
      <div className="winamp-controls">
        <button className="winamp-btn" title="Previous">
          ⏮
        </button>
        <button className="winamp-btn" title="Play" onClick={handlePlay}>
          ▶
        </button>
        <button className="winamp-btn" title="Pause" onClick={handlePause}>
          ⏸
        </button>
        <button className="winamp-btn" title="Stop" onClick={handleStop}>
          ⏹
        </button>
        <button className="winamp-btn" title="Next">
          ⏭
        </button>
      </div>
      <audio ref={audioRef} src="apps/winamp/llama.mp3" preload="auto" onEnded={handleStop} />
    </div>
  );
}
