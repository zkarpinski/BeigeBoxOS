/**
 * tableLayout.ts — 3D Pinball: Space Cadet–style table (320×480 reference).
 *
 * For RE source and browser ports to compare against, see ../../REFERENCE.md.
 *
 * Coordinate origin: top-left; Y increases downward.
 * Based on the Space Cadet Playfield Schematic (Diagram 001 Rev. C).
 *
 * Zone reference (top → bottom):
 *   y=0–62    : HUD / ceiling
 *   y=62–280  : bumper clusters + orbit arc
 *   y=280–390 : slingshot area
 *   y=390–430 : flipper zone + drain guards
 *   y=430–480 : drain / plunger lane
 *
 * Shooter lane: x=284–314 (right of main field wall x=284).
 *   Ball starts at (302, 460), launches up the lane, hits the angled exit
 *   wall(284,62)→(314,95), deflects LEFT into the main field.
 *   The gap in the inner wall (x=284) between y=62–95 is the exit — do not seal it.
 *
 * Left orbit: the top-left corner is angled; a sweeping arc of walls runs down
 *   the left side approximating the twisted ramp path from the schematic.
 */

import type { PinballWorld, Vec2, Wall } from '../physics/PinballPhysics';

export const TABLE_W = 320;
export const TABLE_H = 480;

/** Main-field mirror axis; used for right-side slingshot symmetry */
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

  // ── Left slingshot triangle ────────────────────────────────────────────────
  // Positioned at lower-left per schematic (diag, vertical, base)
  const slLeftA = { x: 42, y: 332 };
  const slLeftB = { x: 76, y: 298 };
  const slLeftC = { x: 42, y: 298 };
  const srA = mirrorSeg(slLeftA.x, slLeftA.y, slLeftB.x, slLeftB.y);
  const srB = mirrorSeg(slLeftA.x, slLeftA.y, slLeftC.x, slLeftC.y);
  const srC = mirrorSeg(slLeftB.x, slLeftB.y, slLeftC.x, slLeftC.y);

  const walls: ReturnType<typeof wall>[] = [
    // ── Outer boundary ─────────────────────────────────────────────────────
    // Hidden full-width ceiling (physics backstop only — not rendered)
    wall(16, 56, 284, 56, 0.48, true),

    // Top-left angled corner (matches schematic — not a right angle)
    wall(16, 112, 56, 62),
    // Left outer wall (below the angled corner)
    wall(16, 112, 16, 390),
    // Shooter lane outer right wall
    wall(314, 56, 314, 470),

    // Visible ceiling (from the angled corner to the main-field right wall)
    wall(56, 62, 284, 62, 0.5),

    // ── Shooter lane exit ──────────────────────────────────────────────────
    // Angled \ surface: ball going up deflects LEFT into the main field
    wall(284, 62, 314, 95, 0.6),
    // Main field right wall — gap at y=62–95 is the shooter exit opening
    wall(284, 95, 284, 390),
    wall(284, 440, 284, 470),
    wall(284, 470, 314, 470, 0.1),

    // ── Left orbit arc (twisted ramp path from schematic) ──────────────────
    // Sweeps from just under the top-left angle, down the left side,
    // and curves back rightward into the slingshot area.
    wall(56, 78, 38, 140, 0.42),
    wall(38, 140, 24, 215, 0.42),
    wall(24, 215, 36, 288, 0.42),
    wall(36, 288, 68, 316, 0.42),

    // ── Right-side guide rail (target bank area per schematic) ────────────
    wall(248, 140, 268, 250, 0.4),

    // ── Drain funnel guards ────────────────────────────────────────────────
    wall(16, 390, 66, 432, 0.35),
    wall(284, 390, 238, 432, 0.35),

    // ── Inlane divider posts ───────────────────────────────────────────────
    wall(72, 426, 72, 448, 0.3),
    wall(232, 426, 232, 448, 0.3),
  ];

  const leftPivot: Vec2 = { x: 80, y: 432 };
  const rightPivot: Vec2 = { x: 224, y: 432 };
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

  // ── Bumpers ───────────────────────────────────────────────────────────────
  // Two clusters per schematic:
  //   Left cluster  — upper-center (triangle formation)
  //   Right cluster — upper-right (two bumpers, labeled "Bumper Cluster" on schematic)
  const bumpers = [
    // Left cluster (triangle)
    { pos: { x: 138, y: 112 }, radius: 14, restitution: 1.5, lit: false, litTimer: 0, points: 100 },
    { pos: { x: 112, y: 158 }, radius: 14, restitution: 1.5, lit: false, litTimer: 0, points: 100 },
    { pos: { x: 168, y: 155 }, radius: 14, restitution: 1.5, lit: false, litTimer: 0, points: 100 },
    // Right cluster
    { pos: { x: 214, y: 118 }, radius: 14, restitution: 1.5, lit: false, litTimer: 0, points: 100 },
    { pos: { x: 238, y: 155 }, radius: 14, restitution: 1.5, lit: false, litTimer: 0, points: 100 },
  ];

  const sling = { restitution: 1.4, lit: false, litTimer: 0, points: 50 };

  const slingshots = [
    { a: slLeftA, b: slLeftB, ...sling },
    { a: slLeftA, b: slLeftC, ...sling },
    { a: slLeftB, b: slLeftC, ...sling, points: 25, restitution: 1.2 },
    { a: srA.a, b: srA.b, ...sling },
    { a: srB.a, b: srB.b, ...sling },
    { a: srC.a, b: srC.b, ...sling, points: 25, restitution: 1.2 },
  ];

  // Four top rollover lanes — shifted right to clear the top-left angled wall
  const laneY = 81;
  const lanes = [
    { a: { x: 72,  y: laneY }, b: { x: 94,  y: laneY }, lit: false },
    { a: { x: 120, y: laneY }, b: { x: 142, y: laneY }, lit: false },
    { a: { x: 168, y: laneY }, b: { x: 190, y: laneY }, lit: false },
    { a: { x: 216, y: laneY }, b: { x: 238, y: laneY }, lit: false },
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
