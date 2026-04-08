/**
 * Nebula Pinball — feature tests.
 *
 * Tests physics correctness, table geometry, plunger mechanics,
 * and game state transitions without a browser or canvas.
 */

import { createTable, TABLE_W, TABLE_H } from '../src/table/tableLayout';
import { stepWorld, launchBall, resetBall } from '../src/physics/PinballPhysics';
import type { PinballWorld } from '../src/physics/PinballPhysics';

/** Run the world for `frames` at 60fps. Returns accumulated events. */
function simulate(world: PinballWorld, frames: number): string[] {
  const events: string[] = [];
  const dt = 1 / 60;
  for (let i = 0; i < frames; i++) {
    events.push(...stepWorld(world, dt));
  }
  return events;
}

// ── Table creation ────────────────────────────────────────────────────────

describe('createTable', () => {
  test('returns a valid world with all required fields', () => {
    const world = createTable();
    expect(world.ball).toBeDefined();
    expect(world.flippers).toHaveLength(2);
    expect(world.bumpers.length).toBeGreaterThan(0);
    expect(world.walls.length).toBeGreaterThan(0);
    expect(world.slingshots.length).toBeGreaterThan(0);
    expect(world.lanes).toHaveLength(4);
    expect(world.bumpers).toHaveLength(6);
    expect(world.bumpers.filter((b) => b.radius >= 13)).toHaveLength(3);
    expect(world.slingshots).toHaveLength(6);
    expect(world.walls.some((w) => w.hidden)).toBe(true);
  });

  test('ball starts in plunger state at rest', () => {
    const world = createTable();
    expect(world.ballInPlunger).toBe(true);
    expect(world.ball.vel.x).toBe(0);
    expect(world.ball.vel.y).toBe(0);
    expect(world.ball.pos.x).toBe(world.plungerX);
    expect(world.ball.pos.y).toBe(world.plungerY);
  });

  test('score and multiplier start at 0 and 1', () => {
    const world = createTable();
    expect(world.score).toBe(0);
    expect(world.multiplier).toBe(1);
  });

  test('flippers have correct sides', () => {
    const world = createTable();
    expect(world.flippers[0].side).toBe('left');
    expect(world.flippers[1].side).toBe('right');
  });

  test('left flipper rest angle is positive (droop right-down)', () => {
    const world = createTable();
    const f = world.flippers[0];
    expect(f.restAngle).toBeGreaterThan(0); // positive = drooping in canvas coords
  });

  test('right flipper rest angle is > π/2 (droop left-down)', () => {
    const world = createTable();
    const f = world.flippers[1];
    expect(f.restAngle).toBeGreaterThan(Math.PI / 2);
  });

  test('left flipper active angle < rest angle (sweeps up)', () => {
    const world = createTable();
    const f = world.flippers[0];
    expect(f.activeAngle).toBeLessThan(f.restAngle);
  });

  test('right flipper active angle > rest angle (sweeps up on right side)', () => {
    const world = createTable();
    const f = world.flippers[1];
    expect(f.activeAngle).toBeGreaterThan(f.restAngle);
  });

  test('plunger position is within table bounds', () => {
    const world = createTable();
    expect(world.plungerX).toBeGreaterThan(0);
    expect(world.plungerX).toBeLessThan(TABLE_W);
    expect(world.plungerY).toBeGreaterThan(0);
    expect(world.plungerY).toBeLessThan(TABLE_H);
  });
});

// ── Plunger / launch mechanics ─────────────────────────────────────────────

describe('launchBall', () => {
  test('launch with no compression gives minimum upward velocity', () => {
    const world = createTable();
    world.plungerCompression = 0;
    launchBall(world);
    expect(world.ballInPlunger).toBe(false);
    expect(world.ball.vel.y).toBeLessThan(0); // negative Y = upward in canvas coords
    expect(world.ball.vel.y).toBeCloseTo(-19, 0);
  });

  test('launch with full compression gives maximum upward velocity', () => {
    const world = createTable();
    world.plungerCompression = 60;
    launchBall(world);
    expect(world.ball.vel.y).toBeLessThan(-20); // faster than minimum
    expect(world.ball.vel.x).toBe(-2.6); // slight drift into main field
  });

  test('velocity scales with compression between min and max', () => {
    const worldHalf = createTable();
    worldHalf.plungerCompression = 30;
    launchBall(worldHalf);
    const velHalf = worldHalf.ball.vel.y;

    const worldFull = createTable();
    worldFull.plungerCompression = 60;
    launchBall(worldFull);
    const velFull = worldFull.ball.vel.y;

    expect(velHalf).toBeGreaterThan(velFull); // velHalf is less negative = slower
  });

  test('launchBall is a no-op when ball is not in plunger', () => {
    const world = createTable();
    launchBall(world); // first launch — OK
    const velAfterFirst = world.ball.vel.y;

    world.ball.vel.y = -5; // manually change vel
    launchBall(world); // should do nothing
    expect(world.ball.vel.y).toBe(-5); // unchanged
  });

  test('ball position resets to plunger rest before launch', () => {
    const world = createTable();
    world.plungerCompression = 60;
    launchBall(world);
    expect(world.ball.pos.x).toBe(world.plungerX);
    expect(world.ball.pos.y).toBe(world.plungerY);
  });

  test('launched ball rises past plunger stub (lane not sealed upward)', () => {
    const world = createTable();
    world.plungerCompression = 60;
    launchBall(world);
    let minY = world.ball.pos.y;
    for (let i = 0; i < 120; i++) {
      simulate(world, 1);
      minY = Math.min(minY, world.ball.pos.y);
    }
    // Stub separator ends at y=440; sealed layout blocked the ball below ~y=95.
    expect(minY).toBeLessThan(420);
  });

  test('launched ball cannot escape past outer frame (hidden ceiling + walls)', () => {
    const world = createTable();
    world.plungerCompression = 60;
    launchBall(world);
    let minY = world.ball.pos.y;
    let minX = world.ball.pos.x;
    for (let i = 0; i < 300; i++) {
      simulate(world, 1);
      minY = Math.min(minY, world.ball.pos.y);
      minX = Math.min(minX, world.ball.pos.x);
    }
    // Left wall x=16; hidden ceiling only to x=284; y<48 clamp catches tunneling into HUD.
    expect(minX).toBeGreaterThan(9);
    expect(minY).toBeGreaterThan(45);
  });
});

describe('resetBall', () => {
  test('places ball back in plunger state', () => {
    const world = createTable();
    launchBall(world);
    simulate(world, 10);
    resetBall(world);

    expect(world.ballInPlunger).toBe(true);
    expect(world.ballLost).toBe(false);
    expect(world.ball.vel.x).toBe(0);
    expect(world.ball.vel.y).toBe(0);
    expect(world.ball.pos.x).toBe(world.plungerX);
    expect(world.ball.pos.y).toBe(world.plungerY);
  });

  test('clears all lit lane states', () => {
    const world = createTable();
    world.lanes.forEach((l) => (l.lit = true));
    resetBall(world);
    expect(world.lanes.every((l) => !l.lit)).toBe(true);
  });
});

// ── Physics integration ───────────────────────────────────────────────────

describe('stepWorld — gravity and motion', () => {
  test('ball does not move while in plunger state', () => {
    const world = createTable();
    const startPos = { ...world.ball.pos };
    simulate(world, 30);
    expect(world.ball.pos.x).toBe(startPos.x);
    expect(world.ball.pos.y).toBe(startPos.y);
  });

  test('ball accelerates downward after launch (gravity)', () => {
    const world = createTable();
    launchBall(world); // launches upward
    // After launch ball decelerates, then accelerates downward
    const velAtLaunch = world.ball.vel.y; // negative (upward)
    simulate(world, 30);
    // 30 frames later, gravity should have reduced upward velocity
    expect(world.ball.vel.y).toBeGreaterThan(velAtLaunch);
  });

  test('ball moves upward in first frames after launch', () => {
    const world = createTable();
    launchBall(world);
    const startY = world.ball.pos.y;
    simulate(world, 5);
    // Ball should have moved upward (decreasing Y)
    expect(world.ball.pos.y).toBeLessThan(startY);
  });

  test('speed is capped at MAX_SPEED', () => {
    const world = createTable();
    launchBall(world);
    // Give ball extreme velocity
    world.ball.vel.x = 1000;
    world.ball.vel.y = 1000;
    simulate(world, 1);
    const speed = Math.sqrt(world.ball.vel.x ** 2 + world.ball.vel.y ** 2);
    expect(speed).toBeLessThanOrEqual(31); // MAX_SPEED + small tolerance
  });
});

describe('stepWorld — drain detection', () => {
  test('ball_lost event fires when ball falls below drain line', () => {
    const world = createTable();
    launchBall(world);
    // Force ball past drain threshold
    world.ball.pos.y = 474;
    world.ball.vel.y = 5;
    const events = simulate(world, 2);
    expect(events).toContain('ball_lost');
    expect(world.ballLost).toBe(true);
  });

  test('no physics after ballLost is set', () => {
    const world = createTable();
    launchBall(world);
    world.ball.pos.y = 474;
    world.ball.vel.y = 5;
    simulate(world, 2);

    const posAfterLost = { ...world.ball.pos };
    simulate(world, 30);
    // Position must not change
    expect(world.ball.pos.y).toBe(posAfterLost.y);
  });
});

// ── Flipper mechanics ─────────────────────────────────────────────────────

describe('flippers', () => {
  test('flipper angle moves toward activeAngle when active=true', () => {
    const world = createTable();
    const f = world.flippers[0]; // left flipper
    f.active = true;
    const startAngle = f.angle;
    simulate(world, 3);
    // Angle should have moved toward activeAngle (which is < restAngle for left flipper)
    expect(f.angle).toBeLessThan(startAngle);
  });

  test('flipper angle moves toward restAngle when active=false', () => {
    const world = createTable();
    const f = world.flippers[0];
    f.active = true;
    simulate(world, 10); // move to active position
    f.active = false;
    const midAngle = f.angle;
    simulate(world, 10); // move back
    expect(f.angle).toBeGreaterThan(midAngle);
  });

  test('flipper reaches activeAngle after sufficient frames', () => {
    const world = createTable();
    const f = world.flippers[0];
    f.active = true;
    simulate(world, 20); // plenty of time for full flip
    expect(f.angle).toBeCloseTo(f.activeAngle, 2);
  });

  test('right flipper reaches activeAngle after sufficient frames', () => {
    const world = createTable();
    const f = world.flippers[1];
    f.active = true;
    simulate(world, 20);
    expect(f.angle).toBeCloseTo(f.activeAngle, 2);
  });
});

// ── Bumper collisions ─────────────────────────────────────────────────────

describe('bumpers', () => {
  test('collision with bumper emits event and scores points', () => {
    const world = createTable();
    launchBall(world);
    const bumper = world.bumpers[0];

    // Place ball directly on bumper surface
    world.ball.pos.x = bumper.pos.x + bumper.radius + world.ball.radius - 1;
    world.ball.pos.y = bumper.pos.y;
    world.ball.vel.x = -5; // heading toward bumper
    world.ball.vel.y = 0;

    const events = simulate(world, 5);
    expect(events.some((e) => e.startsWith('bumper:'))).toBe(true);
    expect(world.score).toBeGreaterThan(0);
  });

  test('bumper lights up on hit and resets after litTimer expires', () => {
    const world = createTable();
    launchBall(world);
    const bumper = world.bumpers[0];

    world.ball.pos.x = bumper.pos.x + bumper.radius + world.ball.radius - 1;
    world.ball.pos.y = bumper.pos.y;
    world.ball.vel.x = -5;
    world.ball.vel.y = 0;

    simulate(world, 3);
    expect(bumper.lit).toBe(true);

    // Run enough frames for litTimer to expire (LIT_DURATION = 0.25s → 15 frames)
    simulate(world, 20);
    expect(bumper.lit).toBe(false);
  });

  test('bumper reflects ball away (speed increases due to restitution > 1)', () => {
    const world = createTable();
    launchBall(world);
    const bumper = world.bumpers[0];

    world.ball.pos.x = bumper.pos.x + bumper.radius + world.ball.radius - 0.5;
    world.ball.pos.y = bumper.pos.y;
    world.ball.vel.x = -8;
    world.ball.vel.y = 0;

    const speedBefore = Math.abs(world.ball.vel.x);
    simulate(world, 1);
    const speedAfter = Math.sqrt(world.ball.vel.x ** 2 + world.ball.vel.y ** 2);

    // Pop bumper restitution > 1 means ball leaves faster than it arrived
    expect(speedAfter).toBeGreaterThanOrEqual(speedBefore);
  });
});

// ── Scoring & multiplier ──────────────────────────────────────────────────

describe('scoring', () => {
  test('multiplier is applied to bumper score', () => {
    const world = createTable();
    launchBall(world);
    world.multiplier = 3;

    const bumper = world.bumpers[0];
    world.ball.pos.x = bumper.pos.x + bumper.radius + world.ball.radius - 1;
    world.ball.pos.y = bumper.pos.y;
    world.ball.vel.x = -5;
    world.ball.vel.y = 0;

    simulate(world, 3);
    // Should have scored bumper.points * 3
    expect(world.score).toBe(bumper.points * 3);
  });

  test('mission event fires after 3 lane hits', () => {
    const world = createTable();
    launchBall(world);

    const events: string[] = [];
    for (let i = 0; i < 4; i++) {
      const lane = world.lanes[i % world.lanes.length];
      // Reset lane state to allow re-scoring
      lane.lit = false;
      world.ball.pos.x = (lane.a.x + lane.b.x) / 2;
      world.ball.pos.y = lane.a.y;
      world.ball.vel.y = -1;
      events.push(...simulate(world, 2));
      // Move ball away from lane to allow re-trigger
      world.ball.pos.y = lane.a.y + 20;
    }

    expect(world.missionHits).toBeGreaterThanOrEqual(3);
    expect(events).toContain('mission');
  });
});
