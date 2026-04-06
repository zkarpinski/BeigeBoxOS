/**
 * tableLayout.ts — Space Cadet-inspired table geometry.
 *
 * Reference resolution: 320×480 canvas pixels.
 * Coordinate origin: top-left.  Y increases downward.
 *
 * Layout overview (top → bottom):
 *   y=0–60    : score HUD (not physics)
 *   y=60–80   : top rollover lanes + top wall
 *   y=80–280  : bumper cluster + ramps
 *   y=280–380 : slingshot area
 *   y=380–430 : flipper zone + drain guards
 *   y=430–480 : drain / plunger lane
 *
 * Plunger lane: x=286–316 (right of main field right wall x=286).
 * Ball launches from (302, 460) upward through the right lane,
 * hits the top-right redirect diagonal, and enters the main field.
 */

import type { PinballWorld, Vec2 } from '../physics/PinballPhysics';

export const TABLE_W = 320;
export const TABLE_H = 480;

function wall(ax: number, ay: number, bx: number, by: number, r = 0.45) {
  return { a: { x: ax, y: ay }, b: { x: bx, y: by }, restitution: r };
}

export function createTable(): PinballWorld {
  // Plunger sits at bottom-right, ball rest position
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

  // ── Walls ─────────────────────────────────────────────────────────────────
  //
  //  LEFT outer wall
  //  RIGHT outer wall of main field  (x=284 — just inside plunger separator)
  //  PLUNGER right wall               (x=314)
  //  TOP wall of main field           (y=62)
  //  TOP-RIGHT redirect diagonal      curves ball from plunger lane → main field
  //  BOTTOM plunger lane floor
  //  DRAIN guard diagonals            funnel ball toward flippers
  //  INLANE dividers                  short posts beside flippers
  //
  const walls: ReturnType<typeof wall>[] = [
    // ── Outer boundary ───────────────────────────────────────────────────
    wall(16, 62, 16, 400),           // Left outer wall
    wall(314, 62, 314, 470),         // Plunger lane right wall (full height)

    // ── Top wall spans BOTH main field and plunger lane ───────────────────
    // Ball launched up the right lane hits this wall and bounces left into play.
    wall(16, 62, 314, 62, 0.5),

    // ── Main field right wall — stops at y=95, leaving opening at top ─────
    // The gap (y=62..95) is where the ball exits the plunger lane into the
    // main field. A short diagonal guides it left-ward.
    // Single wall at x=284 from the gap down to the drain — serves as both
    // the main field right wall AND the plunger lane separator.
    wall(284, 95, 284, 470),
    // Short diagonal at gap entry: guides ball leftward when exiting lane
    wall(284, 95, 310, 62, 0.55),

    // ── Plunger lane bottom ───────────────────────────────────────────────
    wall(284, 470, 314, 470, 0.1),   // Bottom of plunger lane (hard stop)

    // ── Drain funnel guards ───────────────────────────────────────────────
    // These diagonal walls angle inward from the outer walls toward the
    // flipper pivots, deflecting near-drain balls back toward the flippers.
    wall(16, 390, 62, 430, 0.35),    // Left drain guard (outer wall → left flipper area)
    wall(284, 390, 238, 430, 0.35),  // Right drain guard (right wall → right flipper area)

    // ── Inlane divider posts (short walls beside each flipper) ───────────
    wall(68, 425, 68, 445, 0.3),     // Left inlane post
    wall(236, 425, 236, 445, 0.3),   // Right inlane post
  ];

  // ── Flippers ──────────────────────────────────────────────────────────────
  //
  // Space Cadet geometry:
  //   Left flipper:  pivot (76, 430), rest 28° (drooping right-down), active -26° (up-right)
  //   Right flipper: pivot (228, 430), rest 152° (drooping left-down), active 206° (up-left)
  //   Length: 52px
  //
  // In canvas coords (Y-down, angles clockwise from +X):
  //   Left active angle < rest angle (rotates counter-clockwise = up)
  //   Right active angle > rest angle (rotates clockwise = up)
  //
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

  // ── Pop bumpers ───────────────────────────────────────────────────────────
  // Triangle cluster in upper-middle, matching Space Cadet's cluster.
  const bumpers = [
    { pos: { x: 118, y: 148 }, radius: 14, restitution: 1.5, lit: false, litTimer: 0, points: 100 },
    { pos: { x: 182, y: 136 }, radius: 14, restitution: 1.5, lit: false, litTimer: 0, points: 100 },
    { pos: { x: 152, y: 192 }, radius: 14, restitution: 1.5, lit: false, litTimer: 0, points: 100 },
    // Two smaller bumpers flanking the cluster
    { pos: { x: 90,  y: 220 }, radius: 10, restitution: 1.3, lit: false, litTimer: 0, points: 50 },
    { pos: { x: 214, y: 210 }, radius: 10, restitution: 1.3, lit: false, litTimer: 0, points: 50 },
  ];

  // ── Slingshots ────────────────────────────────────────────────────────────
  // Space Cadet has kicker triangles on both sides of the lower field.
  const slingshots = [
    {
      a: { x: 38,  y: 330 },
      b: { x: 72,  y: 295 },
      restitution: 1.4,
      lit: false,
      litTimer: 0,
      points: 50,
    },
    {
      a: { x: 246, y: 295 },
      b: { x: 246, y: 330 },
      restitution: 1.4,
      lit: false,
      litTimer: 0,
      points: 50,
    },
    // Extra bottom-side walls that complete the slingshot triangle shape
    {
      a: { x: 38,  y: 330 },
      b: { x: 38,  y: 295 },
      restitution: 1.2,
      lit: false,
      litTimer: 0,
      points: 25,
    },
    {
      a: { x: 246, y: 330 },
      b: { x: 210, y: 295 },
      restitution: 1.2,
      lit: false,
      litTimer: 0,
      points: 25,
    },
  ];

  // ── Top rollover lanes ────────────────────────────────────────────────────
  // Four short horizontal sensors just below the top wall.
  const laneY = 82;
  const lanes = [
    { a: { x: 40,  y: laneY }, b: { x: 60,  y: laneY }, lit: false },
    { a: { x: 90,  y: laneY }, b: { x: 110, y: laneY }, lit: false },
    { a: { x: 140, y: laneY }, b: { x: 160, y: laneY }, lit: false },
    { a: { x: 190, y: laneY }, b: { x: 210, y: laneY }, lit: false },
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
