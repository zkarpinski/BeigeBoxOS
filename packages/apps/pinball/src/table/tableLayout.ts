/**
 * tableLayout.ts — 3D Pinball: Space Cadet–style table (320×480 reference).
 *
 * For RE source and browser ports to compare against, see ../../REFERENCE.md.
 *
 * Coordinate origin: top-left; Y increases downward.
 * Layout is tuned to mirror the Windows table: shooter far right, top rollovers,
 * three pop bumpers in a triangle, three rebound bumpers stacked mid-left
 * beside the hyperspace ramp, mirrored slingshots, flipper zone + drain.
 */

import type { PinballWorld, Vec2, Wall } from '../physics/PinballPhysics';

export const TABLE_W = 320;
export const TABLE_H = 480;

/** Main-field mirror axis (16…284); used for right-side symmetry */
const MIRROR_X = 300;

function wall(ax: number, ay: number, bx: number, by: number, r = 0.45, hidden?: boolean): Wall {
  const w: Wall = { a: { x: ax, y: ay }, b: { x: bx, y: by }, restitution: r };
  if (hidden) w.hidden = true;
  return w;
}

function mirrorSeg(ax: number, ay: number, bx: number, by: number) {
  return {
    a: { x: MIRROR_X - ax, y: ay },
    b: { x: MIRROR_X - bx, y: by },
  };
}

export function createTable(): PinballWorld {
  const plungerX = 302;
  const plungerY = 460;

  const ball = {
    pos: { x: plungerX, y: plungerY },
    vel: { x: 0, y: 0 },
    radius: 7,
    restitution: 0.55,
    friction: 0.01,
    onTable: true,
  };

  // ── Left slingshot triangle (outer diag, inner vertical, base) ────────────
  const slLeftA = { x: 38, y: 326 };
  const slLeftB = { x: 72, y: 292 };
  const slLeftC = { x: 38, y: 292 };
  const srA = mirrorSeg(slLeftA.x, slLeftA.y, slLeftB.x, slLeftB.y);
  const srB = mirrorSeg(slLeftA.x, slLeftA.y, slLeftC.x, slLeftC.y);
  const srC = mirrorSeg(slLeftB.x, slLeftB.y, slLeftC.x, slLeftC.y);

  const walls: ReturnType<typeof wall>[] = [
    // Hidden ceiling MAIN FIELD ONLY (16…284). Must not extend into the shooter lane —
    // a segment to x=314 seals the launch groove. Left/right walls start at y=56 so
    // there is no gap at the corners for the main field.
    wall(16, 56, 284, 56, 0.48, true),

    wall(16, 56, 16, 400),
    wall(314, 56, 314, 470),

    wall(16, 62, 284, 62, 0.5),

    wall(284, 62, 284, 390),
    wall(284, 440, 284, 470),
    wall(284, 470, 314, 470, 0.1),

    wall(16, 390, 62, 430, 0.35),
    wall(284, 390, 238, 430, 0.35),

    // Hyperspace ramp (left) — polyline approximation of purple ramp
    wall(20, 288, 40, 238, 0.42),
    wall(40, 238, 56, 188, 0.42),
    wall(56, 188, 88, 138, 0.42),

    // Inner guide below top rollovers (orbit path — must sit below laneY, not under y=62 ceiling)
    wall(22, 94, 252, 94, 0.38),

    wall(68, 425, 68, 448, 0.3),
    wall(236, 425, 236, 448, 0.3),
  ];

  const leftPivot: Vec2 = { x: 76, y: 430 };
  const rightPivot: Vec2 = { x: 228, y: 430 };
  const flipperLen = 52;

  const flippers = [
    {
      side: 'left' as const,
      pivot: leftPivot,
      length: flipperLen,
      angle: (28 * Math.PI) / 180,
      restAngle: (28 * Math.PI) / 180,
      activeAngle: (-26 * Math.PI) / 180,
      active: false,
    },
    {
      side: 'right' as const,
      pivot: rightPivot,
      length: flipperLen,
      angle: (152 * Math.PI) / 180,
      restAngle: (152 * Math.PI) / 180,
      activeAngle: (206 * Math.PI) / 180,
      active: false,
    },
  ];

  // Three main pop bumpers (triangle, upper-center like Space Cadet)
  const bumpers = [
    {
      pos: { x: 148, y: 122 },
      radius: 14,
      restitution: 1.5,
      lit: false,
      litTimer: 0,
      points: 100,
    },
    {
      pos: { x: 104, y: 172 },
      radius: 14,
      restitution: 1.5,
      lit: false,
      litTimer: 0,
      points: 100,
    },
    {
      pos: { x: 192, y: 172 },
      radius: 14,
      restitution: 1.5,
      lit: false,
      litTimer: 0,
      points: 100,
    },
    // Three rebound bumpers — vertical stack right of ramp (Cadet “Rebound” set)
    {
      pos: { x: 86, y: 186 },
      radius: 9,
      restitution: 1.28,
      lit: false,
      litTimer: 0,
      points: 50,
    },
    {
      pos: { x: 86, y: 216 },
      radius: 9,
      restitution: 1.28,
      lit: false,
      litTimer: 0,
      points: 50,
    },
    {
      pos: { x: 86, y: 246 },
      radius: 9,
      restitution: 1.28,
      lit: false,
      litTimer: 0,
      points: 50,
    },
  ];

  const sling = {
    restitution: 1.4,
    lit: false,
    litTimer: 0,
    points: 50,
  };

  const slingshots = [
    { a: slLeftA, b: slLeftB, ...sling },
    { a: slLeftA, b: slLeftC, ...sling },
    { a: slLeftB, b: slLeftC, ...sling, points: 25, restitution: 1.2 },
    { a: srA.a, b: srA.b, ...sling },
    { a: srB.a, b: srB.b, ...sling },
    { a: srC.a, b: srC.b, ...sling, points: 25, restitution: 1.2 },
  ];

  // Four top rollover lanes (skill shot strip), centered like the original
  const laneY = 81;
  const lanes = [
    { a: { x: 56, y: laneY }, b: { x: 78, y: laneY }, lit: false },
    { a: { x: 108, y: laneY }, b: { x: 130, y: laneY }, lit: false },
    { a: { x: 160, y: laneY }, b: { x: 182, y: laneY }, lit: false },
    { a: { x: 212, y: laneY }, b: { x: 234, y: laneY }, lit: false },
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
