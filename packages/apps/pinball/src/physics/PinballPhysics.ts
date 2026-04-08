/**
 * PinballPhysics — 2D pinball physics engine.
 *
 * Velocity units: pixels per frame at 60fps ("px/f").
 * Integration: pos += vel * scale / SUB_STEPS per sub-step,
 *   where scale = dt * 60 (= 1.0 at 60fps, 2.0 at 30fps, etc.).
 * Gravity is applied once per full frame call, not per sub-step.
 * This matches original Space Cadet "floaty" feel at low gravity.
 *
 * Coordinate system: X right, Y down (canvas convention).
 * Table gravity = g·sin(7°) ≈ 0.12; we use 0.38 for more responsive feel.
 */

export interface Vec2 {
  x: number;
  y: number;
}

export interface Ball {
  pos: Vec2;
  vel: Vec2;
  radius: number;
  restitution: number;
  friction: number;
  onTable: boolean;
}

export type FlipperSide = 'left' | 'right';

export interface Flipper {
  side: FlipperSide;
  pivot: Vec2;
  length: number;
  angle: number;
  restAngle: number;
  activeAngle: number;
  active: boolean;
}

export interface Bumper {
  pos: Vec2;
  radius: number;
  restitution: number;
  lit: boolean;
  litTimer: number;
  points: number;
}

export interface Wall {
  a: Vec2;
  b: Vec2;
  restitution: number;
  /** If true, physics only — not drawn (e.g. full-width ceiling so the shooter cannot leave the table). */
  hidden?: boolean;
}

export interface Slingshot {
  a: Vec2;
  b: Vec2;
  restitution: number;
  lit: boolean;
  litTimer: number;
  points: number;
}

export interface Lane {
  a: Vec2;
  b: Vec2;
  lit: boolean;
}

export interface PinballWorld {
  ball: Ball;
  flippers: Flipper[];
  bumpers: Bumper[];
  walls: Wall[];
  slingshots: Slingshot[];
  lanes: Lane[];
  plungerCompression: number;
  plungerActive: boolean;
  score: number;
  multiplier: number;
  ballInPlunger: boolean;
  plungerX: number;
  plungerY: number;
  ballLost: boolean;
  missionHits: number;
}

// ── Tuning constants (all in px/frame units at 60fps) ──────────────────────
/** Gravity added to vel.y per frame (once per stepWorld call, not per sub-step). */
const GRAVITY = 0.22;
const SUB_STEPS = 4;
/** Flipper angular speed in radians per frame at 60fps. */
const FLIPPER_SPEED = 0.32;
/** Hard speed cap to prevent tunnelling. */
const MAX_SPEED = 18;
/** Duration a bumper/slingshot stays lit, seconds. */
const LIT_DURATION = 0.25;

// ── Math helpers ──────────────────────────────────────────────────────────

function dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

function len(v: Vec2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

function norm(v: Vec2): Vec2 {
  const l = len(v);
  return l < 0.0001 ? { x: 0, y: 0 } : { x: v.x / l, y: v.y / l };
}

function sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

function scaleVec(v: Vec2, s: number): Vec2 {
  return { x: v.x * s, y: v.y * s };
}

function closestPointOnSegment(p: Vec2, a: Vec2, b: Vec2): Vec2 {
  const ab = sub(b, a);
  const ap = sub(p, a);
  const t = Math.max(0, Math.min(1, dot(ap, ab) / (dot(ab, ab) || 1)));
  return add(a, scaleVec(ab, t));
}

function flipperTip(f: Flipper): Vec2 {
  return {
    x: f.pivot.x + Math.cos(f.angle) * f.length,
    y: f.pivot.y + Math.sin(f.angle) * f.length,
  };
}

/**
 * Surface velocity of a rotating flipper at `point`.
 * omega is in radians-per-frame (at 60fps); scale normalises for actual dt.
 * v = omega × r  →  2D: { -r.y * omega, r.x * omega }
 */
function flipperSurfaceVelocity(f: Flipper, point: Vec2, scale: number): Vec2 {
  const r = sub(point, f.pivot);
  // Direction of rotation: toward active angle when active, toward rest when not.
  const sign = f.active
    ? Math.sign(f.activeAngle - f.restAngle)
    : Math.sign(f.restAngle - f.activeAngle);
  const omega = sign * FLIPPER_SPEED * scale;
  return { x: -r.y * omega, y: r.x * omega };
}

// ── Collision resolution ──────────────────────────────────────────────────

function resolveSegmentCollision(
  ball: Ball,
  a: Vec2,
  b: Vec2,
  restitution: number,
  surfaceVel?: Vec2,
): boolean {
  const closest = closestPointOnSegment(ball.pos, a, b);
  const diff = sub(ball.pos, closest);
  const dist = len(diff);
  if (dist >= ball.radius || dist < 0.0001) return false;

  const n = norm(diff);
  // Depenetrate
  const pen = ball.radius - dist;
  ball.pos.x += n.x * pen;
  ball.pos.y += n.y * pen;

  // Velocity impulse in relative frame
  const relVel = surfaceVel ? sub(ball.vel, surfaceVel) : ball.vel;
  const vn = dot(relVel, n);
  if (vn < 0) {
    const impulse = -(1 + restitution) * vn;
    ball.vel.x += impulse * n.x;
    ball.vel.y += impulse * n.y;
    // Tiny friction on tangential component (pinball is nearly frictionless)
    const t = { x: -n.y, y: n.x };
    const vt = dot(ball.vel, t);
    ball.vel.x -= vt * ball.friction;
    ball.vel.y -= vt * ball.friction;
  }
  return true;
}

function resolveCircleCollision(
  ball: Ball,
  center: Vec2,
  radius: number,
  restitution: number,
): boolean {
  const diff = sub(ball.pos, center);
  const dist = len(diff);
  const minDist = ball.radius + radius;
  if (dist >= minDist || dist < 0.0001) return false;

  const n = norm(diff);
  ball.pos.x = center.x + n.x * minDist;
  ball.pos.y = center.y + n.y * minDist;
  const vn = dot(ball.vel, n);
  if (vn < 0) {
    const impulse = -(1 + restitution) * vn;
    ball.vel.x += impulse * n.x;
    ball.vel.y += impulse * n.y;
  }
  return true;
}

// ── Main step ──────────────────────────────────────────────────────────────

export function stepWorld(world: PinballWorld, dt: number): string[] {
  const events: string[] = [];
  // Normalise to 60fps; cap at 2.5× to avoid tunnelling on tab-freeze resume.
  const scale = Math.min(dt * 60, 2.5);
  const ball = world.ball;

  // ── Flipper animation (always runs, even in plunger state) ───────────────
  for (const f of world.flippers) {
    const target = f.active ? f.activeAngle : f.restAngle;
    const diff = target - f.angle;
    const maxMove = FLIPPER_SPEED * scale;
    f.angle = Math.abs(diff) <= maxMove ? target : f.angle + Math.sign(diff) * maxMove;
  }

  // ── Lit timers ───────────────────────────────────────────────────────────
  for (const b of world.bumpers) {
    if (b.lit && (b.litTimer -= dt) <= 0) b.lit = false;
  }
  for (const ss of world.slingshots) {
    if (ss.lit && (ss.litTimer -= dt) <= 0) ss.lit = false;
  }

  if (world.ballInPlunger || world.ballLost) return events;

  // ── Gravity (once per frame, not per sub-step) ───────────────────────────
  ball.vel.y += GRAVITY * scale;

  // ── Sub-step integration + collision ────────────────────────────────────
  for (let step = 0; step < SUB_STEPS; step++) {
    ball.pos.x += (ball.vel.x * scale) / SUB_STEPS;
    ball.pos.y += (ball.vel.y * scale) / SUB_STEPS;

    // Walls
    for (const w of world.walls) {
      resolveSegmentCollision(ball, w.a, w.b, w.restitution);
    }

    // Flippers
    for (const f of world.flippers) {
      const tip = flipperTip(f);
      const sv = flipperSurfaceVelocity(f, ball.pos, scale);
      resolveSegmentCollision(ball, f.pivot, tip, 0.65, sv);
    }

    // Pop bumpers
    for (const b of world.bumpers) {
      if (resolveCircleCollision(ball, b.pos, b.radius, b.restitution) && !b.lit) {
        world.score += b.points * world.multiplier;
        b.lit = true;
        b.litTimer = LIT_DURATION;
        events.push(`bumper:${b.points}`);
      }
    }

    // Slingshots
    for (const ss of world.slingshots) {
      if (resolveSegmentCollision(ball, ss.a, ss.b, ss.restitution) && !ss.lit) {
        world.score += ss.points * world.multiplier;
        ss.lit = true;
        ss.litTimer = LIT_DURATION;
        events.push(`slingshot:${ss.points}`);
      }
    }

    // Rollover lanes (sensors — no physics response, just scoring)
    for (const lane of world.lanes) {
      const closest = closestPointOnSegment(ball.pos, lane.a, lane.b);
      const d = len(sub(ball.pos, closest));
      if (d < ball.radius + 3) {
        if (!lane.lit) {
          lane.lit = true;
          world.score += 500 * world.multiplier;
          world.missionHits++;
          events.push('lane');
          if (world.missionHits % 3 === 0) events.push('mission');
        }
      } else {
        lane.lit = false;
      }
    }

    // Drain detection — below table bottom
    if (ball.pos.y > 475) {
      world.ballLost = true;
      events.push('ball_lost');
      break;
    }
  }

  // Hard top clamp (HUD / off-table): hidden ceiling does not cover the shooter; this
  // only fires if the ball would tunnel above the playfield strip.
  if (!world.ballLost && ball.pos.y < 48) {
    ball.pos.y = 48;
    if (ball.vel.y < 0) ball.vel.y *= -0.35;
  }

  // ── Speed cap ────────────────────────────────────────────────────────────
  const spd = len(ball.vel);
  if (spd > MAX_SPEED) {
    ball.vel.x = (ball.vel.x / spd) * MAX_SPEED;
    ball.vel.y = (ball.vel.y / spd) * MAX_SPEED;
  }

  return events;
}

// ── Plunger actions ───────────────────────────────────────────────────────

/**
 * Launch ball from plunger.
 * force = 12 px/f (no compression) … 18 px/f (full compression).
 * Small -X drift sends the ball into the main field once the plunger lane is
 * open above the bottom separator (purely vertical motion would ping-pong).
 */
export function launchBall(world: PinballWorld): void {
  if (!world.ballInPlunger) return;
  const pct = Math.min(world.plungerCompression / 60, 1);
  const force = 12 + pct * 6;
  // Reset to rest position before applying velocity
  world.ball.pos.x = world.plungerX;
  world.ball.pos.y = world.plungerY;
  world.ball.vel.x = -2.6;
  world.ball.vel.y = -force;
  world.ballInPlunger = false;
  world.plungerCompression = 0;
}

export function resetBall(world: PinballWorld): void {
  world.ball.pos.x = world.plungerX;
  world.ball.pos.y = world.plungerY;
  world.ball.vel.x = 0;
  world.ball.vel.y = 0;
  world.ballInPlunger = true;
  world.ballLost = false;
  for (const lane of world.lanes) lane.lit = false;
}
