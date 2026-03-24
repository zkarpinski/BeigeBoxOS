'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { AppConfig } from '@/app/types/app-config';
import { useOsShell } from '@retro-web/core/context';

const ICON = 'apps/defrag/defrag-icon.png';

const STATE_FREE = 0;
const STATE_UNOPT = 1;
const STATE_OPT = 2;
const STATE_READING = 3;

const COLS = 59;
const ROWS = 25;
const TOTAL_BLOCKS = COLS * ROWS;
const DEFRAG_INTERVAL = 30;
const BATCH_SIZE = 5;

/** Deterministic for SSR/hydration; same on server and client. */
function buildDeterministicBlocks(): number[] {
  const blocks: number[] = [];
  for (let i = 0; i < TOTAL_BLOCKS; i++) {
    blocks.push(i < TOTAL_BLOCKS * 0.4 ? STATE_OPT : STATE_UNOPT);
  }
  return blocks;
}

function buildInitialBlocks(): number[] {
  const blocks: number[] = [];
  for (let i = 0; i < TOTAL_BLOCKS; i++) {
    let state = i < TOTAL_BLOCKS * 0.4 ? STATE_OPT : STATE_UNOPT;
    if (Math.random() < 0.05) state = state === STATE_OPT ? STATE_UNOPT : STATE_OPT;
    blocks.push(state);
  }
  return blocks;
}

function blockClass(state: number): string {
  if (state === STATE_UNOPT) return 'defrag-block unoptimized';
  if (state === STATE_OPT) return 'defrag-block optimized';
  if (state === STATE_READING) return 'defrag-block reading';
  return 'defrag-block free';
}

export const defragAppConfig: AppConfig = {
  id: 'defrag',
  label: 'Disk Defragmenter',
  icon: ICON,
  desktop: false,
  startMenu: { path: ['Programs', 'System Tools'] },
  taskbarLabel: 'Disk Defragmenter',
};

export function DefragWindow() {
  const { AppWindow, TitleBar } = useOsShell();
  const [statusText, setStatusText] = useState('Ready to defragment.');
  const [percent, setPercent] = useState(40);
  const [pauseLabel, setPauseLabel] = useState('Pause');
  const [showDetails, setShowDetails] = useState(true);
  const [blocks, setBlocks] = useState<number[]>(buildDeterministicBlocks);

  const blocksRef = useRef<number[]>(blocks);
  const elementsRef = useRef<(HTMLDivElement | null)[]>([]);
  const timerIdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const runningRef = useRef(false);
  const pausedRef = useRef(false);
  const currentPosRef = useRef(Math.floor(TOTAL_BLOCKS * 0.4));

  blocksRef.current = blocks;

  function updateBlockEl(i: number, state: number) {
    const el = elementsRef.current[i];
    if (el) el.className = blockClass(state);
    blocksRef.current[i] = state;
  }

  const stopTimer = useCallback(() => {
    if (timerIdRef.current !== null) {
      clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }
  }, []);

  const step = useCallback(() => {
    const pos = currentPosRef.current;
    if (pos >= TOTAL_BLOCKS) {
      stopTimer();
      runningRef.current = false;
      currentPosRef.current = TOTAL_BLOCKS;
      setPercent(100);
      setStatusText('Defragmentation complete.');
      return;
    }

    // Revert previous batch
    const prevStart = pos - BATCH_SIZE;
    if (prevStart >= 0) {
      for (let i = prevStart; i < pos; i++) {
        updateBlockEl(i, STATE_OPT);
      }
    }

    // Animate current batch
    const end = Math.min(pos + BATCH_SIZE, TOTAL_BLOCKS);
    for (let i = pos; i < end; i++) {
      updateBlockEl(i, STATE_READING);
    }

    currentPosRef.current = pos + BATCH_SIZE;
    const pct = Math.floor((currentPosRef.current / TOTAL_BLOCKS) * 100);
    setPercent(pct);
  }, [stopTimer]);

  function reset() {
    stopTimer();
    runningRef.current = false;
    pausedRef.current = false;
    currentPosRef.current = Math.floor(TOTAL_BLOCKS * 0.4);
    setPauseLabel('Pause');

    const newBlocks = buildInitialBlocks();
    blocksRef.current = newBlocks;
    setBlocks(newBlocks);
    setPercent(Math.floor((currentPosRef.current / TOTAL_BLOCKS) * 100));
    setStatusText('Ready to defragment.');
  }

  function start() {
    if (runningRef.current && !pausedRef.current) return;
    if (currentPosRef.current >= TOTAL_BLOCKS) reset();
    runningRef.current = true;
    pausedRef.current = false;
    setPauseLabel('Pause');
    setStatusText('Defragmenting file system...');
    timerIdRef.current = setInterval(step, DEFRAG_INTERVAL);
  }

  function stop() {
    if (!runningRef.current) return;
    stopTimer();
    runningRef.current = false;
    pausedRef.current = false;
    setPauseLabel('Pause');
    setStatusText('Defragmentation stopped.');
    // Clean up reading blocks
    const pos = currentPosRef.current;
    const prevStart = pos - BATCH_SIZE;
    if (prevStart >= 0) {
      for (let i = prevStart; i < pos; i++) {
        if (blocksRef.current[i] === STATE_READING) {
          updateBlockEl(i, STATE_OPT);
        }
      }
    }
  }

  function togglePause() {
    if (!runningRef.current) {
      start();
      return;
    }
    if (pausedRef.current) {
      pausedRef.current = false;
      setPauseLabel('Pause');
      setStatusText('Defragmenting file system...');
      timerIdRef.current = setInterval(step, DEFRAG_INTERVAL);
    } else {
      pausedRef.current = true;
      stopTimer();
      setPauseLabel('Resume');
      setStatusText('Defragmentation paused.');
    }
  }

  function toggleDetails() {
    setShowDetails((v) => !v);
  }

  // Randomize block layout after mount so SSR and client initial render match (deterministic), then hydrate with random
  useEffect(() => {
    const next = buildInitialBlocks();
    blocksRef.current = next;
    setBlocks(next);
  }, []);

  // Cleanup on unmount
  useEffect(() => () => stopTimer(), [stopTimer]);

  return (
    <AppWindow
      id="defrag-window"
      appId="defrag"
      className={`defrag-window app-window app-window-hidden${showDetails ? '' : ' hide-details'}`}
      titleBar={
        <TitleBar
          title="Defragmenting Drive C"
          icon={<img src={ICON} alt="Defrag" style={{ width: 16, height: 16, marginRight: 4 }} />}
          showMin
          showMax
          showClose
        />
      }
    >
      <div className="defrag-body">
        <div className="defrag-details-area">
          <div className="defrag-grid">
            {Array.from({ length: TOTAL_BLOCKS }, (_, i) => (
              <div
                key={i}
                className={blockClass(blocks[i])}
                ref={(el) => {
                  elementsRef.current[i] = el;
                }}
              />
            ))}
          </div>
          <div className="defrag-scrollbar-wrap">
            <button className="scroll-btn up">▲</button>
            <div className="scroll-track-v">
              <div className="scroll-thumb-v" />
            </div>
            <button className="scroll-btn down">▼</button>
          </div>
        </div>
        <div className="defrag-controls">
          <div className="defrag-status-area">
            <div className="defrag-status-text">{statusText}</div>
            <div className="defrag-progress-bar-wrap">
              <div className="defrag-progress-bar" style={{ width: `${percent}%` }} />
            </div>
            <div className="defrag-percent-text">{percent}% Complete</div>
          </div>
          <div className="defrag-buttons">
            <div className="defrag-buttons-row">
              <button className="win-btn defrag-btn" onClick={start}>
                Start
              </button>
              <button className="win-btn defrag-btn" onClick={stop}>
                Stop
              </button>
            </div>
            <div className="defrag-buttons-row">
              <button className="win-btn defrag-btn" onClick={togglePause}>
                {pauseLabel}
              </button>
              <button className="win-btn defrag-btn" onClick={toggleDetails}>
                {showDetails ? 'Hide Details' : 'Show Details'}
              </button>
            </div>
            <div className="defrag-buttons-row">
              <button className="win-btn defrag-btn">Legend</button>
            </div>
          </div>
        </div>
      </div>
    </AppWindow>
  );
}
