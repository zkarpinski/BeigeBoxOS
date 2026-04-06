'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { createTable } from './table/tableLayout';
import { stepWorld, launchBall, resetBall } from './physics/PinballPhysics';
import type { PinballWorld } from './physics/PinballPhysics';
import {
  renderFrame,
  renderBallLost,
  renderGameOver,
  renderLaunchHint,
} from './renderer/PinballRenderer';

const TOTAL_BALLS = 3;
const BALL_LOST_DELAY = 1.8; // seconds to show "ball lost" before next ball
const MISSION_BONUS = 10000;

type GamePhase = 'playing' | 'ball_lost' | 'game_over';

export interface PinballGameState {
  score: number;
  lives: number;
  phase: GamePhase;
  rank: string;
}

const RANKS = [
  'Cadet', 'Ensign', 'Lieutenant', 'Captain', 'Major',
  'Commander', 'Commodore', 'Admiral', 'Fleet Admiral',
];

function rankForScore(score: number): string {
  return RANKS[Math.min(Math.floor(score / 50000), RANKS.length - 1)];
}

export function usePinballGame(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const worldRef = useRef<PinballWorld>(createTable());
  const livesRef = useRef(TOTAL_BALLS);
  const phaseRef = useRef<GamePhase>('playing');
  const phaseTimerRef = useRef(0);
  const lastTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const plungerHeldRef = useRef(false);

  const [gameState, setGameState] = useState<PinballGameState>({
    score: 0,
    lives: TOTAL_BALLS,
    phase: 'playing',
    rank: 'Cadet',
  });

  const syncState = useCallback(() => {
    const w = worldRef.current;
    setGameState({
      score: w.score,
      lives: livesRef.current,
      phase: phaseRef.current,
      rank: rankForScore(w.score),
    });
  }, []);

  const newGame = useCallback(() => {
    worldRef.current = createTable();
    livesRef.current = TOTAL_BALLS;
    phaseRef.current = 'playing';
    phaseTimerRef.current = 0;
    syncState();
  }, [syncState]);

  // ── Input handling ────────────────────────────────────────────────────────
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    keysRef.current.add(e.code);
    const world = worldRef.current;

    switch (e.code) {
      case 'KeyZ':
      case 'ShiftLeft':
        world.flippers[0].active = true;
        break;
      case 'Slash':
      case 'ShiftRight':
        world.flippers[1].active = true;
        break;
      case 'Space':
        e.preventDefault();
        if (world.ballInPlunger) plungerHeldRef.current = true;
        break;
      case 'KeyX':
      case 'Period': {
        // Nudge
        world.ball.vel.x += (Math.random() - 0.5) * 3;
        world.ball.vel.y -= 1;
        world.score -= 500;
        if (world.score < 0) world.score = 0;
        break;
      }
      case 'F2':
        newGame();
        break;
    }
  }, [newGame]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keysRef.current.delete(e.code);
    const world = worldRef.current;

    switch (e.code) {
      case 'KeyZ':
      case 'ShiftLeft':
        world.flippers[0].active = false;
        break;
      case 'Slash':
      case 'ShiftRight':
        world.flippers[1].active = false;
        break;
      case 'Space':
        if (world.ballInPlunger && plungerHeldRef.current) {
          launchBall(world);
          plungerHeldRef.current = false;
        }
        break;
    }
  }, []);

  // ── Game loop ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function loop(timestamp: number) {
      if (!ctx || !canvas) return;
      const dt = Math.min((timestamp - (lastTimeRef.current ?? timestamp)) / 1000, 0.05);
      lastTimeRef.current = timestamp;

      const world = worldRef.current;
      const phase = phaseRef.current;

      if (phase === 'playing') {
        // Plunger compression — ball stays at rest; only power bar fills.
        // Rate: full charge in ~0.75s at 60fps.
        if (plungerHeldRef.current && world.ballInPlunger) {
          world.plungerCompression = Math.min(world.plungerCompression + dt * 85, 60);
        }

        const events = stepWorld(world, dt);

        for (const ev of events) {
          if (ev === 'ball_lost') {
            livesRef.current--;
            phaseRef.current = 'ball_lost';
            phaseTimerRef.current = BALL_LOST_DELAY;
            syncState();
          }
          if (ev === 'mission') {
            world.score += MISSION_BONUS * world.multiplier;
            world.multiplier = Math.min(world.multiplier + 1, 8);
          }
        }
      } else if (phase === 'ball_lost') {
        phaseTimerRef.current -= dt;
        if (phaseTimerRef.current <= 0) {
          if (livesRef.current <= 0) {
            phaseRef.current = 'game_over';
          } else {
            phaseRef.current = 'playing';
            resetBall(worldRef.current);
          }
          syncState();
        }
      }
      // game_over: do nothing until newGame()

      // Render
      renderFrame(ctx, world, timestamp / 1000, livesRef.current, TOTAL_BALLS);
      if (phase === 'ball_lost') renderBallLost(ctx);
      if (phase === 'game_over') renderGameOver(ctx, world.score);
      if (world.ballInPlunger && phase === 'playing') renderLaunchHint(ctx);

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [canvasRef, syncState]);

  // Key listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  return { gameState, newGame };
}
