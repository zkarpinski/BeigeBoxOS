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

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  world: PinballWorld,
  time: number,
  lives: number,
  ballsTotal: number
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

  // Table surface
  ctx.fillStyle = COLORS.tableBg;
  ctx.fillRect(14, 60, 286, 420);

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
    // Outer ring
    ctx.beginPath();
    ctx.arc(b.pos.x, b.pos.y, b.radius + 3, 0, Math.PI * 2);
    ctx.strokeStyle = b.lit ? COLORS.bumperOn : COLORS.bumperRing;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = b.lit ? COLORS.bumperOn : 'transparent';
    ctx.shadowBlur = b.lit ? 16 : 0;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Fill
    const grad = ctx.createRadialGradient(
      b.pos.x - b.radius * 0.3, b.pos.y - b.radius * 0.3, 1,
      b.pos.x, b.pos.y, b.radius
    );
    grad.addColorStop(0, b.lit ? '#ff88ff' : '#220033');
    grad.addColorStop(1, b.lit ? '#cc00cc' : '#110022');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(b.pos.x, b.pos.y, b.radius, 0, Math.PI * 2);
    ctx.fill();

    // Point label
    ctx.fillStyle = b.lit ? '#ffffff' : '#886699';
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
  if (world.ballInPlunger || world.plungerCompression > 0) {
    const px = world.plungerX;
    const py = world.plungerY;
    const comp = world.plungerCompression;
    // Lane fill (charge indicator)
    if (comp > 0) {
      const pct = Math.min(comp / 60, 1);
      ctx.fillStyle = `hsl(${60 - pct * 60}, 100%, 50%)`;
      ctx.fillRect(px - 6, py - comp * 0.4, 12, comp * 0.4);
    }
    // Rod
    ctx.fillStyle = COLORS.plunger;
    ctx.fillRect(px - 5, py, 10, 20);
    ctx.fillStyle = COLORS.plungerFill;
    ctx.fillRect(px - 3, py + 2, 6, 14);
  }

  // ── Ball ─────────────────────────────────────────────────────────────────
  if (!world.ballLost) {
    const { pos, radius } = world.ball;
    const grad = ctx.createRadialGradient(
      pos.x - radius * 0.35, pos.y - radius * 0.35, 1,
      pos.x, pos.y, radius
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
  ctx.fillRect(14, 0, 286, 58);

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
