/**
 * PinballRenderer — Canvas 2D renderer for Nebula Pinball.
 * Generic "space" aesthetic using solid shapes + neon colors.
 * Designed to look like a top-down 3D table tilted toward viewer.
 */

import type { PinballWorld } from '../physics/PinballPhysics';

const COLORS = {
  bg: '#0a0a1a',
  tableBg: '#0d0d2b',
  wall: '#4444aa',
  wallGlow: '#6666ff',
  flipper: '#00ccff',
  flipperRest: '#005577',
  ball: '#e8e8ff',
  ballShine: '#ffffff',
  bumperOff: '#330066',
  bumperOn: '#ff00ff',
  bumperRing: '#cc00cc',
  slingshotOff: '#003344',
  slingshotOn: '#00ffcc',
  laneOff: '#222244',
  laneOn: '#ffff00',
  plunger: '#886600',
  plungerFill: '#ffaa00',
  scoreText: '#ffffff',
  rankText: '#aaaaff',
  starfield: '#ffffff',
  missionText: '#ff6600',
};

const RANKS = [
  'Cadet',
  'Ensign',
  'Lieutenant',
  'Captain',
  'Major',
  'Commander',
  'Commodore',
  'Admiral',
  'Fleet Admiral',
];

function rankForScore(score: number): string {
  const idx = Math.min(Math.floor(score / 50000), RANKS.length - 1);
  return RANKS[idx];
}

/** Pre-generated starfield positions (seeded deterministically) */
const STARS: Array<{ x: number; y: number; r: number; a: number }> = (() => {
  const out = [];
  // Simple LCG for deterministic positions
  let seed = 42;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0xffffffff;
  };
  for (let i = 0; i < 60; i++) {
    out.push({ x: rand() * 320, y: rand() * 480, r: rand() * 1.2 + 0.3, a: rand() * 0.7 + 0.3 });
  }
  return out;
})();

/** Non-physics art matching 3D Pinball: Space Cadet (ramps, wormholes, targets, mission ring). */
function drawSpaceCadetTableArt(ctx: CanvasRenderingContext2D, time: number): void {
  ctx.save();

  const g = ctx.createRadialGradient(100, 180, 30, 170, 240, 160);
  g.addColorStop(0, 'rgba(90, 50, 140, 0.14)');
  g.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(14, 60, 272, 400);

  // Outer orbit art — stop well left of x=284 so the shooter lane reads “open” at the top.
  ctx.strokeStyle = 'rgba(110, 150, 255, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(16, 66);
  ctx.bezierCurveTo(95, 58, 185, 58, 248, 72);
  ctx.stroke();

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(130, 55, 200, 0.5)';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(18, 292);
  ctx.lineTo(38, 242);
  ctx.lineTo(54, 192);
  ctx.lineTo(86, 142);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 210, 80, 0.45)';
  ctx.lineWidth = 2;
  ctx.stroke();

  for (const [wx, wy, wr] of [
    [32, 92, 10],
    [52, 118, 8],
  ] as const) {
    ctx.fillStyle = 'rgba(4, 4, 40, 0.9)';
    ctx.beginPath();
    ctx.arc(wx, wy, wr, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(130, 200, 255, 0.55)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(200, 55, 75, 0.8)';
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(24, 246 + i * 18, 10, 14);
  }
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(278, 246 + i * 18, 10, 14);
  }

  const mcx = 155;
  const mcy = 312;
  const mr = 36;
  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const lx = mcx + Math.cos(ang) * mr;
    const ly = mcy + Math.sin(ang) * mr;
    const hue = (i * 28 + time * 35) % 360;
    ctx.fillStyle = `hsla(${hue}, 72%, 52%, 0.7)`;
    ctx.beginPath();
    ctx.arc(lx, ly, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(220, 35, 35, 0.9)';
  ctx.beginPath();
  ctx.arc(mcx, mcy, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(150, 70, 200, 0.22)';
  ctx.lineWidth = 1;
  const drainY = 438;
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(mcx, drainY);
    ctx.lineTo(mcx + Math.cos(ang) * 42, drainY + Math.sin(ang) * 28);
    ctx.stroke();
  }

  ctx.restore();
}

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  world: PinballWorld,
  time: number,
  lives: number,
  ballsTotal: number,
): void {
  const W = ctx.canvas.width;
  const H = ctx.canvas.height;

  // Scale from reference 320×480 to actual canvas size
  const scaleX = W / 320;
  const scaleY = H / 480;

  ctx.save();
  ctx.scale(scaleX, scaleY);

  // ── Background ──────────────────────────────────────────────────────────
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, 320, 480);

  // Table surface (includes shooter lane to x=314; was 286w and left lane visually “outside”)
  ctx.fillStyle = COLORS.tableBg;
  ctx.fillRect(14, 60, 300, 420);

  // Starfield
  for (const s of STARS) {
    const twinkle = 0.6 + 0.4 * Math.sin(time * 2 + s.x);
    ctx.globalAlpha = s.a * twinkle;
    ctx.fillStyle = COLORS.starfield;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  drawSpaceCadetTableArt(ctx, time);

  // ── Lanes ───────────────────────────────────────────────────────────────
  for (const lane of world.lanes) {
    ctx.strokeStyle = lane.lit ? COLORS.laneOn : COLORS.laneOff;
    ctx.lineWidth = 4;
    ctx.shadowColor = lane.lit ? COLORS.laneOn : 'transparent';
    ctx.shadowBlur = lane.lit ? 8 : 0;
    ctx.beginPath();
    ctx.moveTo(lane.a.x, lane.a.y);
    ctx.lineTo(lane.b.x, lane.b.y);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;

  // ── Walls ────────────────────────────────────────────────────────────────
  for (const w of world.walls) {
    if (w.hidden) continue;
    ctx.strokeStyle = COLORS.wallGlow;
    ctx.lineWidth = 3;
    ctx.shadowColor = COLORS.wallGlow;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(w.a.x, w.a.y);
    ctx.lineTo(w.b.x, w.b.y);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Cosmetic “shooter exit” (Space Cadet) — not in physics; top wall ends at x=284.
  ctx.strokeStyle = COLORS.wallGlow;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(284, 62);
  ctx.lineTo(310, 90);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;

  // ── Slingshots ───────────────────────────────────────────────────────────
  for (const ss of world.slingshots) {
    const c = ss.lit ? COLORS.slingshotOn : COLORS.slingshotOff;
    ctx.strokeStyle = c;
    ctx.lineWidth = 5;
    ctx.shadowColor = ss.lit ? COLORS.slingshotOn : 'transparent';
    ctx.shadowBlur = ss.lit ? 12 : 0;
    ctx.beginPath();
    ctx.moveTo(ss.a.x, ss.a.y);
    ctx.lineTo(ss.b.x, ss.b.y);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // ── Bumpers ──────────────────────────────────────────────────────────────
  for (const b of world.bumpers) {
    const isMainPop = b.radius >= 13;

    ctx.beginPath();
    ctx.arc(b.pos.x, b.pos.y, b.radius + 3, 0, Math.PI * 2);
    ctx.strokeStyle = b.lit ? COLORS.bumperOn : COLORS.bumperRing;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = b.lit ? COLORS.bumperOn : 'transparent';
    ctx.shadowBlur = b.lit ? 16 : 0;
    ctx.stroke();
    ctx.shadowBlur = 0;

    const grad = ctx.createRadialGradient(
      b.pos.x - b.radius * 0.3,
      b.pos.y - b.radius * 0.3,
      1,
      b.pos.x,
      b.pos.y,
      b.radius,
    );
    if (isMainPop) {
      grad.addColorStop(0, b.lit ? '#ffffff' : '#e8e8f0');
      grad.addColorStop(0.45, b.lit ? '#dde0ff' : '#b8b8d0');
      grad.addColorStop(1, b.lit ? '#a8a8c8' : '#707088');
    } else {
      grad.addColorStop(0, b.lit ? '#ff88ff' : '#220033');
      grad.addColorStop(1, b.lit ? '#cc00cc' : '#110022');
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(b.pos.x, b.pos.y, b.radius, 0, Math.PI * 2);
    ctx.fill();

    if (isMainPop) {
      ctx.save();
      ctx.translate(b.pos.x, b.pos.y);
      ctx.strokeStyle = b.lit ? '#ff4444' : '#cc2222';
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 2);
        ctx.beginPath();
        ctx.moveTo(0, -b.radius * 0.75);
        ctx.lineTo(0, b.radius * 0.75);
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.fillStyle = b.lit ? '#222244' : isMainPop ? '#333355' : '#886699';
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(b.points), b.pos.x, b.pos.y);
  }

  // ── Flippers ─────────────────────────────────────────────────────────────
  for (const f of world.flippers) {
    const tip = {
      x: f.pivot.x + Math.cos(f.angle) * f.length,
      y: f.pivot.y + Math.sin(f.angle) * f.length,
    };
    ctx.beginPath();
    ctx.moveTo(f.pivot.x, f.pivot.y);
    ctx.lineTo(tip.x, tip.y);
    ctx.strokeStyle = f.active ? COLORS.flipper : COLORS.flipperRest;
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.shadowColor = f.active ? COLORS.flipper : 'transparent';
    ctx.shadowBlur = f.active ? 10 : 0;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Pivot circle
    ctx.fillStyle = '#008899';
    ctx.beginPath();
    ctx.arc(f.pivot.x, f.pivot.y, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Plunger ───────────────────────────────────────────────────────────────
  // The plunger rod pulls DOWN (increasing Y) as the player compresses it.
  // The ball stays at its rest position; only the rod/spring moves down.
  if (world.ballInPlunger || world.plungerCompression > 0) {
    const px = world.plungerX;
    const py = world.plungerY;
    const comp = world.plungerCompression;
    const pct = Math.min(comp / 60, 1);

    // Power bar grows DOWNWARD from ball rest position (correct direction)
    if (comp > 0) {
      const barH = pct * 22;
      ctx.fillStyle = `hsl(${55 - pct * 55}, 100%, 50%)`;
      ctx.fillRect(px - 4, py + 8, 8, barH);
    }

    // Plunger rod: shifts down with compression
    const rodOffset = pct * 14;
    ctx.fillStyle = COLORS.plunger;
    ctx.fillRect(px - 4, py + 8 + rodOffset, 8, 18);
    ctx.fillStyle = COLORS.plungerFill;
    ctx.fillRect(px - 2, py + 10 + rodOffset, 4, 12);
  }

  // ── Ball ─────────────────────────────────────────────────────────────────
  if (!world.ballLost) {
    const { pos, radius } = world.ball;
    const grad = ctx.createRadialGradient(
      pos.x - radius * 0.35,
      pos.y - radius * 0.35,
      1,
      pos.x,
      pos.y,
      radius,
    );
    grad.addColorStop(0, COLORS.ballShine);
    grad.addColorStop(0.4, COLORS.ball);
    grad.addColorStop(1, '#888899');
    ctx.fillStyle = grad;
    ctx.shadowColor = '#aaaaff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // ── HUD ──────────────────────────────────────────────────────────────────
  // Score panel (top)
  ctx.fillStyle = 'rgba(0,0,20,0.75)';
  ctx.fillRect(14, 0, 300, 58);

  ctx.fillStyle = COLORS.scoreText;
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(world.score.toLocaleString().padStart(10, ' '), 160, 6);

  ctx.fillStyle = COLORS.rankText;
  ctx.font = '10px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(rankForScore(world.score), 18, 32);

  ctx.fillStyle = '#888888';
  ctx.font = '9px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`×${world.multiplier}`, 18, 44);

  // Lives
  for (let i = 0; i < ballsTotal; i++) {
    const ballX = 290 - i * 14;
    ctx.fillStyle = i < lives ? COLORS.ball : '#222233';
    ctx.beginPath();
    ctx.arc(ballX, 38, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Mission progress
  const mhMod = world.missionHits % 3;
  if (mhMod > 0) {
    ctx.fillStyle = COLORS.missionText;
    ctx.font = '8px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(`MISSION ${mhMod}/3`, 306, 32);
  }

  // Plunger charge bar (right side, when compressing)
  if (world.plungerCompression > 0) {
    const pct = Math.min(world.plungerCompression / 60, 1);
    ctx.fillStyle = `hsl(${60 - pct * 60}, 100%, 40%)`;
    ctx.fillRect(306, 480 - 80 * pct, 6, 80 * pct);
  }

  ctx.restore();
}

/** Draw "BALL LOST" / transition overlay */
export function renderBallLost(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = '#ff4444';
  ctx.font = `bold ${ctx.canvas.width / 10}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('BALL LOST', ctx.canvas.width / 2, ctx.canvas.height / 2);
  ctx.restore();
}

/** Draw "GAME OVER" screen */
export function renderGameOver(ctx: CanvasRenderingContext2D, score: number): void {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,10,0.88)';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  const cx = ctx.canvas.width / 2;
  const cy = ctx.canvas.height / 2;

  ctx.fillStyle = '#ff2222';
  ctx.font = `bold ${ctx.canvas.width / 8}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GAME OVER', cx, cy - 40);

  ctx.fillStyle = '#ffffff';
  ctx.font = `${ctx.canvas.width / 16}px monospace`;
  ctx.fillText(score.toLocaleString(), cx, cy + 10);

  ctx.fillStyle = '#888888';
  ctx.font = `${ctx.canvas.width / 22}px monospace`;
  ctx.fillText('Press F2 or click New Game', cx, cy + 50);

  ctx.fillStyle = '#aaaaff';
  ctx.font = `${ctx.canvas.width / 20}px monospace`;
  ctx.fillText(rankForScore(score), cx, cy + 80);

  ctx.restore();
}

/** Draw launch hint */
export function renderLaunchHint(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.font = `${ctx.canvas.width / 26}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Hold SPACE to charge', ctx.canvas.width / 2, ctx.canvas.height - 8);
  ctx.restore();
}
