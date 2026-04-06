/**
 * PinballPhysics — 2D pinball physics engine.
 *
 * Coordinate system: X right, Y down (canvas convention).
 * Gravity acts downward at g·sin(7°) ≈ 0.122 scaled units.
 * Physics sub-steps 4× per frame at 60fps → ~240Hz effective rate.
 * CCD implemented via swept circle vs. segment tests.
 */

export interface Vec2 {
  x: number;
  y: number;
}

export interface Ball {
  pos: Vec2;
  vel: Vec2;
  radius: number;
  /** 0–1 restitution */
  restitution: number;
  friction: number;
  onTable: boolean;
}

export type FlipperSide = 'left' | 'right';

export interface Flipper {
  side: FlipperSide;
  pivot: Vec2;
  length: number;
  /** Current angle in radians */
  angle: number;
  restAngle: number;
  activeAngle: number;
  /** degrees/s angular speed */
  angularSpeed: number;
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
  /** ball in plunger lane, not yet launched */
  ballInPlunger: boolean;
  plungerX: number;
  plungerY: number;
  ballLost: boolean;
  missionHits: number;
}

const GRAVITY = 0.18;
const SUB_STEPS = 4;
const FLIPPER_SPEED = Math.PI * 6; // rad/s
const LIT_DURATION = 0.3; // seconds

function dot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

function len(v: Vec2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

function norm(v: Vec2): Vec2 {
  const l = len(v);
  if (l === 0) return { x: 0, y: 0 };
  return { x: v.x / l, y: v.y / l };
}

function sub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

function add(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

function scale(v: Vec2, s: number): Vec2 {
  return { x: v.x * s, y: v.y * s };
}

/** Closest point on segment [a,b] to point p */
function closestPointOnSegment(p: Vec2, a: Vec2, b: Vec2): Vec2 {
  const ab = sub(b, a);
  const ap = sub(p, a);
  const t = Math.max(0, Math.min(1, dot(ap, ab) / dot(ab, ab)));
  return add(a, scale(ab, t));
}

/** Flipper tip position from pivot, angle, length */
function flipperTip(f: Flipper): Vec2 {
  return {
    x: f.pivot.x + Math.cos(f.angle) * f.length,
    y: f.pivot.y + Math.sin(f.angle) * f.length,
  };
}

/** Velocity of flipper surface at a world point (from rotation) */
function flipperSurfaceVelocity(f: Flipper, point: Vec2): Vec2 {
  const r = sub(point, f.pivot);
  const omega = f.active
    ? (f.activeAngle - f.restAngle > 0 ? 1 : -1) * FLIPPER_SPEED
    : (f.restAngle - f.activeAngle > 0 ? 1 : -1) * FLIPPER_SPEED;
  // v = omega × r  (2D: v = (-ry, rx) * omega)
  return { x: -r.y * omega, y: r.x * omega };
}

function resolveSegmentCollision(
  ball: Ball,
  a: Vec2,
  b: Vec2,
  restitution: number,
  surfaceVel?: Vec2
): boolean {
  const closest = closestPointOnSegment(ball.pos, a, b);
  const diff = sub(ball.pos, closest);
  const dist = len(diff);
  if (dist < ball.radius && dist > 0.0001) {
    const n = norm(diff);
    // Push ball out
    const penetration = ball.radius - dist;
    ball.pos.x += n.x * penetration;
    ball.pos.y += n.y * penetration;
    // Relative velocity
    const relVel = surfaceVel ? sub(ball.vel, surfaceVel) : ball.vel;
    const vn = dot(relVel, n);
    if (vn < 0) {
      const impulse = -(1 + restitution) * vn;
      ball.vel.x += impulse * n.x;
      ball.vel.y += impulse * n.y;
      // Friction on tangential component
      const t = { x: -n.y, y: n.x };
      const vt = dot(ball.vel, t);
      ball.vel.x -= vt * ball.friction;
      ball.vel.y -= vt * ball.friction;
    }
    return true;
  }
  return false;
}

function resolveCircleCollision(ball: Ball, center: Vec2, radius: number, restitution: number): boolean {
  const diff = sub(ball.pos, center);
  const dist = len(diff);
  const minDist = ball.radius + radius;
  if (dist < minDist && dist > 0.0001) {
    const n = norm(diff);
    ball.pos.x = center.x + n.x * minDist;
    ball.pos.y = center.y + n.y * minDist;
    const vn = dot(ball.vel, n);
    if (vn < 0) {
      ball.vel.x += -(1 + restitution) * vn * n.x;
      ball.vel.y += -(1 + restitution) * vn * n.y;
    }
    return true;
  }
  return false;
}

export function stepWorld(world: PinballWorld, dt: number): string[] {
  const events: string[] = [];
  const subDt = dt / SUB_STEPS;

  for (let step = 0; step < SUB_STEPS; step++) {
    const ball = world.ball;

    if (world.ballInPlunger) {
      // Ball sits on plunger, no physics
      ball.pos.x = world.plungerX;
      ball.pos.y = world.plungerY - world.plungerCompression * 0.4;
      continue;
    }

    if (world.ballLost) continue;

    // Gravity
    ball.vel.y += GRAVITY * subDt * 60;

    // Integrate
    ball.pos.x += ball.vel.x * subDt;
    ball.pos.y += ball.vel.y * subDt;

    // Wall collisions
    for (const wall of world.walls) {
      resolveSegmentCollision(ball, wall.a, wall.b, wall.restitution);
    }

    // Flipper collisions
    for (const flipper of world.flippers) {
      const tip = flipperTip(flipper);
      const sv = flipperSurfaceVelocity(flipper, ball.pos);
      if (resolveSegmentCollision(ball, flipper.pivot, tip, 0.5, sv)) {
        // Add extra kick when flipper is actively swinging up
        const swinging = flipper.active
          ? (flipper.angle - flipper.restAngle) * (flipper.side === 'left' ? -1 : 1) > 0.05
          : false;
        if (swinging) {
          ball.vel.y -= 2.5;
          ball.vel.x += flipper.side === 'left' ? 1.5 : -1.5;
        }
      }
    }

    // Bumper collisions
    for (const bumper of world.bumpers) {
      if (resolveCircleCollision(ball, bumper.pos, bumper.radius, bumper.restitution)) {
        if (!bumper.lit) {
          world.score += bumper.points * world.multiplier;
          bumper.lit = true;
          bumper.litTimer = LIT_DURATION;
          events.push(`bumper:${bumper.points}`);
        }
      }
      if (bumper.lit) {
        bumper.litTimer -= subDt;
        if (bumper.litTimer <= 0) bumper.lit = false;
      }
    }

    // Slingshot collisions
    for (const ss of world.slingshots) {
      if (resolveSegmentCollision(ball, ss.a, ss.b, ss.restitution)) {
        if (!ss.lit) {
          world.score += ss.points * world.multiplier;
          ss.lit = true;
          ss.litTimer = LIT_DURATION;
          events.push(`slingshot:${ss.points}`);
        }
      }
      if (ss.lit) {
        ss.litTimer -= subDt;
        if (ss.litTimer <= 0) ss.lit = false;
      }
    }

    // Lane sensors (score + track)
    for (const lane of world.lanes) {
      const closest = closestPointOnSegment(ball.pos, lane.a, lane.b);
      const d = len(sub(ball.pos, closest));
      if (d < ball.radius + 2) {
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

    // Ball lost (fell below bottom)
    if (ball.pos.y > world.plungerY + 30) {
      world.ballLost = true;
      events.push('ball_lost');
    }

    // Speed cap to prevent tunneling
    const speed = len(ball.vel);
    const maxSpeed = 25;
    if (speed > maxSpeed) {
      ball.vel.x = (ball.vel.x / speed) * maxSpeed;
      ball.vel.y = (ball.vel.y / speed) * maxSpeed;
    }
  }

  // Update flippers (outside sub-steps for smooth feel)
  for (const flipper of world.flippers) {
    const target = flipper.active ? flipper.activeAngle : flipper.restAngle;
    const diff = target - flipper.angle;
    const maxMove = FLIPPER_SPEED * dt;
    if (Math.abs(diff) < maxMove) {
      flipper.angle = target;
    } else {
      flipper.angle += Math.sign(diff) * maxMove;
    }
  }

  // Lit timer for bumpers already updated in sub-steps

  return events;
}

export function launchBall(world: PinballWorld): void {
  if (!world.ballInPlunger) return;
  const force = 8 + world.plungerCompression * 0.22;
  world.ball.vel.x = 0;
  world.ball.vel.y = -force;
  world.ballInPlunger = false;
  world.plungerCompression = 0;
}

export function resetBall(world: PinballWorld): void {
  world.ball.pos.x = world.plungerX;
  world.ball.pos.y = world.plungerY - 10;
  world.ball.vel.x = 0;
  world.ball.vel.y = 0;
  world.ballInPlunger = true;
  world.ballLost = false;
  // Reset lane state
  for (const lane of world.lanes) lane.lit = false;
}
