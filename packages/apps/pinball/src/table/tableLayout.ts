/**
 * tableLayout.ts — builds the initial PinballWorld for a 320×480 (4:3 scaled) table.
 *
 * Coordinate origin is top-left of the canvas.
 * All measurements are in canvas pixels at the reference resolution.
 */

import type { PinballWorld, Vec2 } from '../physics/PinballPhysics';

const W = 320;
const H = 480;

/** Wall segment helper */
function wall(ax: number, ay: number, bx: number, by: number, r = 0.4) {
  return { a: { x: ax, y: ay }, b: { x: bx, y: by }, restitution: r };
}

export function createTable(): PinballWorld {
  // Plunger lane is on the right side
  const plungerX = W - 18;
  const plungerY = H - 40;

  // Ball starts on plunger
  const ball = {
    pos: { x: plungerX, y: plungerY - 10 },
    vel: { x: 0, y: 0 },
    radius: 7,
    restitution: 0.5,
    friction: 0.01,
    onTable: true,
  };

  // ── Outer walls ──────────────────────────────────────────────────────────
  const walls = [
    // Left wall
    wall(14, 60, 14, H - 80),
    // Right wall (main field)
    wall(W - 34, 60, W - 34, H - 80),
    // Plunger lane right wall
    wall(W - 4, 60, W - 4, H - 20),
    // Top arc (flat top for now)
    wall(14, 60, W - 34, 60, 0.5),
    // Bottom-left diagonal (drain guard left)
    wall(14, H - 80, 70, H - 30, 0.3),
    // Bottom-right diagonal (drain guard right)
    wall(W - 34, H - 80, W - 90, H - 30, 0.3),
    // Plunger lane separator (left edge of plunger lane)
    wall(W - 34, H - 100, W - 34, H - 20),
    // Bottom plunger lane
    wall(W - 34, H - 20, W - 4, H - 20, 0.1),
  ];

  // ── Flippers ─────────────────────────────────────────────────────────────
  // Left flipper pivot
  const leftPivot: Vec2 = { x: 80, y: H - 55 };
  // Right flipper pivot
  const rightPivot: Vec2 = { x: W - 114, y: H - 55 };

  const flippers = [
    {
      side: 'left' as const,
      pivot: leftPivot,
      length: 48,
      angle: (30 * Math.PI) / 180,
      restAngle: (30 * Math.PI) / 180,
      activeAngle: (-25 * Math.PI) / 180,
      angularSpeed: Math.PI * 6,
      active: false,
    },
    {
      side: 'right' as const,
      pivot: rightPivot,
      length: 48,
      angle: (150 * Math.PI) / 180,
      restAngle: (150 * Math.PI) / 180,
      activeAngle: (205 * Math.PI) / 180,
      angularSpeed: Math.PI * 6,
      active: false,
    },
  ];

  // ── Bumpers (pop bumpers) ─────────────────────────────────────────────────
  const bumpers = [
    { pos: { x: 120, y: 150 }, radius: 14, restitution: 1.4, lit: false, litTimer: 0, points: 100 },
    { pos: { x: 185, y: 130 }, radius: 14, restitution: 1.4, lit: false, litTimer: 0, points: 100 },
    { pos: { x: 155, y: 195 }, radius: 14, restitution: 1.4, lit: false, litTimer: 0, points: 100 },
    { pos: { x: 100, y: 230 }, radius: 10, restitution: 1.2, lit: false, litTimer: 0, points: 50 },
    { pos: { x: 210, y: 200 }, radius: 10, restitution: 1.2, lit: false, litTimer: 0, points: 50 },
  ];

  // ── Slingshots ────────────────────────────────────────────────────────────
  const slingshots = [
    // Left slingshot
    {
      a: { x: 40, y: H - 130 },
      b: { x: 70, y: H - 95 },
      restitution: 1.3,
      lit: false,
      litTimer: 0,
      points: 50,
    },
    // Right slingshot
    {
      a: { x: W - 74, y: H - 130 },
      b: { x: W - 104, y: H - 95 },
      restitution: 1.3,
      lit: false,
      litTimer: 0,
      points: 50,
    },
  ];

  // ── Lanes (top rollover lanes) ────────────────────────────────────────────
  const laneY = 80;
  const lanes = [
    { a: { x: 50, y: laneY }, b: { x: 70, y: laneY }, lit: false },
    { a: { x: 90, y: laneY }, b: { x: 110, y: laneY }, lit: false },
    { a: { x: 130, y: laneY }, b: { x: 150, y: laneY }, lit: false },
    { a: { x: 170, y: laneY }, b: { x: 190, y: laneY }, lit: false },
  ];

  return {
    ball,
    flippers,
    bumpers,
    walls,
    slingshots,
    lanes,
    plungerCompression: 0,
    plungerActive: false,
    score: 0,
    multiplier: 1,
    ballInPlunger: true,
    plungerX,
    plungerY,
    ballLost: false,
    missionHits: 0,
  };
}
