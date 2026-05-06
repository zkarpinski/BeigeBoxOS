'use client';

import { useEffect, useRef } from 'react';

// ─── Dimensions ──────────────────────────────────────────────────────────────
const MW = 13; // maze cells wide
const MH = 13; // maze cells tall
const GW = MW * 2 + 1; // wall grid width
const GH = MH * 2 + 1; // wall grid height
const RW = 320; // render buffer width
const RH = 200; // render buffer height
const TEX = 64; // texture size (power of 2), must be power of 2

const MOVE_SPEED = 0.055; // world units per frame
const TURN_SPEED = 0.045; // radians per frame
const WAYPOINT_REACH = 0.3; // distance to consider waypoint reached
const PLANE_LEN = Math.tan(Math.PI / 6); // camera plane len for 60° FOV
const FOG_DIST = 9.0; // distance at which walls are fully dark
const PAUSE_TICKS = 90; // frames to pause at goal
const FADE_TICKS = 60; // frames for fade-to-black

// ─── Wall cell types ─────────────────────────────────────────────────────────
const OPEN = 0;
const WALL = 1;
const GOAL_WALL = 2; // special-coloured walls around the goal cell

// ─── Maze generation (iterative DFS / recursive backtracker) ─────────────────
function buildMaze(): Uint8Array {
  const g = new Uint8Array(GW * GH).fill(WALL);
  const vis = new Uint8Array(MW * MH);

  const stack: [number, number][] = [[0, 0]];
  vis[0] = 1;
  g[1 * GW + 1] = OPEN;

  while (stack.length > 0) {
    const [cx, cy] = stack[stack.length - 1];

    const nbrs: [number, number][] = [];
    for (const [dx, dy] of [
      [0, -1],
      [0, 1],
      [1, 0],
      [-1, 0],
    ] as [number, number][]) {
      const nx = cx + dx,
        ny = cy + dy;
      if (nx >= 0 && nx < MW && ny >= 0 && ny < MH && !vis[ny * MW + nx]) {
        nbrs.push([nx, ny]);
      }
    }

    if (nbrs.length === 0) {
      stack.pop();
      continue;
    }

    const [nx, ny] = nbrs[Math.floor(Math.random() * nbrs.length)];
    vis[ny * MW + nx] = 1;
    g[(cy * 2 + 1 + (ny - cy)) * GW + (cx * 2 + 1 + (nx - cx))] = OPEN;
    g[(ny * 2 + 1) * GW + (nx * 2 + 1)] = OPEN;
    stack.push([nx, ny]);
  }

  // Mark walls around the goal cell as GOAL_WALL (yellow)
  const ggx = (MW - 1) * 2 + 1;
  const ggy = (MH - 1) * 2 + 1;
  for (const [dx, dy] of [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ] as [number, number][]) {
    const wx = ggx + dx,
      wy = ggy + dy;
    if (wx >= 0 && wx < GW && wy >= 0 && wy < GH && g[wy * GW + wx] === WALL) {
      g[wy * GW + wx] = GOAL_WALL;
    }
  }

  return g;
}

// ─── BFS pathfinding on the wall grid ────────────────────────────────────────
function bfsPath(
  g: Uint8Array,
  sx: number,
  sy: number,
  ex: number,
  ey: number,
): [number, number][] {
  const par = new Int32Array(GW * GH).fill(-1);
  const vis = new Uint8Array(GW * GH);

  const start = sy * GW + sx;
  const end = ey * GW + ex;
  vis[start] = 1;

  const q = [start];
  let qi = 0;

  while (qi < q.length) {
    const cur = q[qi++];
    if (cur === end) break;
    const cx = cur % GW,
      cy = (cur / GW) | 0;

    for (const [dx, dy] of [
      [0, -1],
      [0, 1],
      [1, 0],
      [-1, 0],
    ] as [number, number][]) {
      const nx = cx + dx,
        ny = cy + dy;
      if (nx < 0 || nx >= GW || ny < 0 || ny >= GH) continue;
      const ni = ny * GW + nx;
      if (g[ni] !== OPEN || vis[ni]) continue;
      vis[ni] = 1;
      par[ni] = cur;
      q.push(ni);
    }
  }

  const path: [number, number][] = [];
  let c = end;
  while (c !== -1) {
    path.unshift([c % GW, (c / GW) | 0]);
    c = par[c];
  }
  return path.length > 1 ? path : [[sx, sy]];
}

// ─── Procedural textures ──────────────────────────────────────────────────────

// Deep red bricks with white/light-gray mortar — matches the original Win98 look
function makeBrickTex(): Uint8Array {
  const d = new Uint8Array(TEX * TEX * 4);
  const BH = 10,
    BW = 20,
    MT = 2; // brick height, width, mortar thickness

  for (let y = 0; y < TEX; y++) {
    const row = (y / BH) | 0;
    const off = row & 1 ? BW >> 1 : 0;
    const mortarY = y % BH < MT;

    for (let x = 0; x < TEX; x++) {
      const bxm = (x + off) % BW;
      const mortarX = bxm < MT;
      const i = (y * TEX + x) * 4;

      if (mortarY || mortarX) {
        // White/off-white mortar joints
        d[i] = 215;
        d[i + 1] = 215;
        d[i + 2] = 212;
        d[i + 3] = 255;
      } else {
        // Crimson-red brick body with per-brick tonal variation
        const br = row,
          bc = ((x + off) / BW) | 0;
        const hn = Math.sin(br * 31.41 + bc * 17.83) * 0.5 + 0.5;
        const noise = (Math.sin(x * 0.39 + y * 1.17) * 0.5 + 0.5) * 16;
        d[i] = Math.min(255, 118 + hn * 44 + noise) | 0; // R: 118–178
        d[i + 1] = Math.min(255, 12 + hn * 8 + noise * 0.15) | 0; // G: very low
        d[i + 2] = Math.min(255, 8 + hn * 6) | 0; // B: near zero
        d[i + 3] = 255;
      }
    }
  }
  return d;
}

// Light-gray acoustic ceiling tiles with thin darker grout lines
function makeCeilingTex(): Uint8Array {
  const d = new Uint8Array(TEX * TEX * 4);
  const TILE = 16; // tile size in pixels

  for (let y = 0; y < TEX; y++) {
    for (let x = 0; x < TEX; x++) {
      const i = (y * TEX + x) * 4;
      const isGrout = x % TILE === 0 || y % TILE === 0;

      if (isGrout) {
        d[i] = 170;
        d[i + 1] = 170;
        d[i + 2] = 168;
        d[i + 3] = 255;
      } else {
        // Slight noise on tile face
        const noise = (Math.sin(x * 0.21 + y * 0.43) * 0.5 + 0.5) * 8;
        const v = (218 + noise) | 0;
        d[i] = v;
        d[i + 1] = v;
        d[i + 2] = v - 2;
        d[i + 3] = 255;
      }
    }
  }
  return d;
}

// Sandy tan floor — warm earthy colour matching the original
function makeFloorTex(): Uint8Array {
  const d = new Uint8Array(TEX * TEX * 4);

  for (let y = 0; y < TEX; y++) {
    for (let x = 0; x < TEX; x++) {
      const i = (y * TEX + x) * 4;
      const noise = (Math.sin(x * 0.31 + y * 0.79) * 0.5 + 0.5) * 14;
      d[i] = Math.min(255, 182 + noise) | 0; // R
      d[i + 1] = Math.min(255, 128 + noise) | 0; // G
      d[i + 2] = Math.min(255, 48 + noise * 0.4) | 0; // B
      d[i + 3] = 255;
    }
  }
  return d;
}

// Bright yellow/gold goal-indicator walls
function makeGoalTex(): Uint8Array {
  const d = new Uint8Array(TEX * TEX * 4);

  for (let y = 0; y < TEX; y++) {
    for (let x = 0; x < TEX; x++) {
      const i = (y * TEX + x) * 4;
      // Horizontal banner stripes: gold and darker gold
      const stripe = Math.floor(y / 8) % 2;
      const noise = (Math.sin(x * 0.53 + y * 0.71) * 0.5 + 0.5) * 18;
      if (stripe === 0) {
        d[i] = Math.min(255, 220 + noise) | 0;
        d[i + 1] = Math.min(255, 180 + noise) | 0;
        d[i + 2] = 20;
      } else {
        d[i] = Math.min(255, 160 + noise) | 0;
        d[i + 1] = Math.min(255, 120 + noise) | 0;
        d[i + 2] = 10;
      }
      d[i + 3] = 255;
    }
  }
  return d;
}

// ─── Main component ───────────────────────────────────────────────────────────
export function MazeScreensaver() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId = 0;
    let alive = true;

    // Pre-compute textures once
    const brickTex = makeBrickTex();
    const ceilingTex = makeCeilingTex();
    const floorTex = makeFloorTex();
    const goalTex = makeGoalTex();

    // Pixel buffer (RW × RH, RGBA)
    const buf = new Uint8ClampedArray(RW * RH * 4);

    // ── Canvas sizing ─────────────────────────────────────────────────────────
    function resize() {
      const w = canvas!.offsetWidth || window.innerWidth;
      const h = canvas!.offsetHeight || window.innerHeight;
      if (canvas!.width !== w || canvas!.height !== h) {
        canvas!.width = w;
        canvas!.height = h;
      }
    }
    resize();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    ro?.observe(canvas);

    // Offscreen render target at low resolution
    const offCanvas = document.createElement('canvas');
    offCanvas.width = RW;
    offCanvas.height = RH;
    const offCtx = offCanvas.getContext('2d')!;

    // ── World state ───────────────────────────────────────────────────────────
    let walls = buildMaze();

    let posX = 1.5,
      posY = 1.5;
    let dirX = 1.0,
      dirY = 0.0;
    let planeX = 0.0,
      planeY = PLANE_LEN;

    const goalGx = (MW - 1) * 2 + 1;
    const goalGy = (MH - 1) * 2 + 1;

    let path: [number, number][] = bfsPath(walls, 1, 1, goalGx, goalGy);
    let pathIdx = 1;

    let phase: 'run' | 'pause' | 'fade' = 'run';
    let phaseTick = 0;
    let fadeAlpha = 0;

    // ── Helpers ───────────────────────────────────────────────────────────────
    function updatePlane() {
      planeX = -dirY * PLANE_LEN;
      planeY = dirX * PLANE_LEN;
    }

    function rotate(a: number) {
      const cos = Math.cos(a),
        sin = Math.sin(a);
      const nx = dirX * cos - dirY * sin;
      const ny = dirX * sin + dirY * cos;
      dirX = nx;
      dirY = ny;
      updatePlane();
    }

    // ── Navigation ────────────────────────────────────────────────────────────
    function navigate() {
      if (phase !== 'run' || pathIdx >= path.length) return;

      const [wpGx, wpGy] = path[pathIdx];
      const wpX = wpGx + 0.5,
        wpY = wpGy + 0.5;
      const dx = wpX - posX,
        dy = wpY - posY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < WAYPOINT_REACH) {
        pathIdx++;
        if (pathIdx >= path.length) {
          phase = 'pause';
          phaseTick = 0;
        }
        return;
      }

      const targetAngle = Math.atan2(dy, dx);
      const currentAngle = Math.atan2(dirY, dirX);
      let diff = targetAngle - currentAngle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;

      if (Math.abs(diff) > 0.015) {
        rotate(Math.min(TURN_SPEED, Math.abs(diff)) * Math.sign(diff));
      }

      if (Math.abs(diff) < 0.7) {
        const step = Math.min(MOVE_SPEED, dist);
        const nx = posX + dirX * step;
        const ny = posY + dirY * step;
        if (walls[(posY | 0) * GW + (nx | 0)] !== WALL) posX = nx;
        if (walls[(ny | 0) * GW + (posX | 0)] !== WALL) posY = ny;
      }
    }

    function tickPhase() {
      if (phase === 'pause') {
        phaseTick++;
        rotate(TURN_SPEED * 0.6);
        if (phaseTick >= PAUSE_TICKS) {
          phase = 'fade';
          phaseTick = 0;
          fadeAlpha = 0;
        }
      } else if (phase === 'fade') {
        phaseTick++;
        fadeAlpha = phaseTick / FADE_TICKS;
        if (phaseTick >= FADE_TICKS) {
          walls = buildMaze();
          posX = 1.5;
          posY = 1.5;
          dirX = 1.0;
          dirY = 0.0;
          updatePlane();
          path = bfsPath(walls, 1, 1, goalGx, goalGy);
          pathIdx = 1;
          phase = 'run';
          phaseTick = 0;
          fadeAlpha = 0;
        }
      }
    }

    // ── Raycaster ─────────────────────────────────────────────────────────────
    function renderFrame() {
      const halfH = RH >> 1;

      // Pre-compute ray directions at the left and right screen edges
      const rdx0 = dirX - planeX,
        rdy0 = dirY - planeY; // left edge
      const rdx1 = dirX + planeX,
        rdy1 = dirY + planeY; // right edge

      // ── Ceiling and floor (perspective-correct floor-casting) ─────────────
      for (let y = 0; y < RH; y++) {
        const isCeiling = y < halfH;
        const p = isCeiling ? halfH - y : y - halfH + 1;
        const rowDist = halfH / p; // world units to this row

        const fsX = (rowDist * (rdx1 - rdx0)) / RW;
        const fsY = (rowDist * (rdy1 - rdy0)) / RW;

        let flX = posX + rowDist * rdx0;
        let flY = posY + rowDist * rdy0;

        // Fog: ceiling barely darkens; floor darkens more
        const fog = Math.min(1.0, rowDist / FOG_DIST);
        const bright = isCeiling ? 1.0 - fog * 0.55 : 1.0 - fog * 0.72;

        const tex = isCeiling ? ceilingTex : floorTex;

        for (let x = 0; x < RW; x++) {
          const tx = Math.abs(((flX - (flX | 0)) * TEX) | 0) & (TEX - 1);
          const ty = Math.abs(((flY - (flY | 0)) * TEX) | 0) & (TEX - 1);
          flX += fsX;
          flY += fsY;

          const ti = (ty * TEX + tx) * 4;
          const pi = (y * RW + x) * 4;
          buf[pi] = (tex[ti] * bright) | 0;
          buf[pi + 1] = (tex[ti + 1] * bright) | 0;
          buf[pi + 2] = (tex[ti + 2] * bright) | 0;
          buf[pi + 3] = 255;
        }
      }

      // ── Walls (DDA raycaster) ─────────────────────────────────────────────
      for (let x = 0; x < RW; x++) {
        const camX = (2 * x) / RW - 1; // -1 (left) … +1 (right)

        const rayDX = dirX + planeX * camX;
        const rayDY = dirY + planeY * camX;

        let mapX = posX | 0;
        let mapY = posY | 0;

        const ddx = Math.abs(rayDX) < 1e-10 ? 1e10 : Math.abs(1 / rayDX);
        const ddy = Math.abs(rayDY) < 1e-10 ? 1e10 : Math.abs(1 / rayDY);

        let stepX: number, stepY: number;
        let sideDistX: number, sideDistY: number;

        if (rayDX < 0) {
          stepX = -1;
          sideDistX = (posX - mapX) * ddx;
        } else {
          stepX = 1;
          sideDistX = (mapX + 1 - posX) * ddx;
        }
        if (rayDY < 0) {
          stepY = -1;
          sideDistY = (posY - mapY) * ddy;
        } else {
          stepY = 1;
          sideDistY = (mapY + 1 - posY) * ddy;
        }

        let side = 0;
        let hitType = WALL;

        for (let s = 0; s < 200; s++) {
          if (sideDistX < sideDistY) {
            sideDistX += ddx;
            mapX += stepX;
            side = 0;
          } else {
            sideDistY += ddy;
            mapY += stepY;
            side = 1;
          }
          if (mapX < 0 || mapX >= GW || mapY < 0 || mapY >= GH) break;
          hitType = walls[mapY * GW + mapX];
          if (hitType !== OPEN) break;
        }

        const perpDist = side === 0 ? sideDistX - ddx : sideDistY - ddy;

        const lineH = (RH / perpDist) | 0;
        const drawTop = Math.max(0, (RH - lineH) >> 1);
        const drawBot = Math.min(RH - 1, (RH + lineH) >> 1);

        // Texture X
        let wallX = side === 0 ? posY + perpDist * rayDY : posX + perpDist * rayDX;
        wallX -= wallX | 0;
        let texX = (wallX * TEX) | 0;
        if (side === 0 && rayDX > 0) texX = TEX - texX - 1;
        if (side === 1 && rayDY < 0) texX = TEX - texX - 1;
        texX = Math.max(0, Math.min(TEX - 1, texX));

        const fog = Math.min(1.0, perpDist / FOG_DIST);
        const sideDark = side === 1 ? 0.7 : 1.0; // y-side walls darker
        const wallBright = (1.0 - fog * 0.9) * sideDark;

        const tex = hitType === GOAL_WALL ? goalTex : brickTex;

        // Texture step and starting position (handles clipping)
        const wallTopF = (RH - lineH) * 0.5;
        const texStep = TEX / lineH;
        let texPos = (drawTop - wallTopF) * texStep;

        for (let y = drawTop; y <= drawBot; y++) {
          const tY = Math.max(0, Math.min(TEX - 1, texPos | 0));
          texPos += texStep;

          const ti = (tY * TEX + texX) * 4;
          const pi = (y * RW + x) * 4;
          buf[pi] = (tex[ti] * wallBright) | 0;
          buf[pi + 1] = (tex[ti + 1] * wallBright) | 0;
          buf[pi + 2] = (tex[ti + 2] * wallBright) | 0;
          buf[pi + 3] = 255;
        }
      }

      // Upload to offscreen canvas, then scale to full display
      offCtx.putImageData(new ImageData(buf, RW, RH), 0, 0);

      const w = canvas!.width,
        h = canvas!.height;
      ctx!.imageSmoothingEnabled = false;
      ctx!.drawImage(offCanvas, 0, 0, w, h);

      // Fade overlay for maze transition
      if (phase === 'fade' && fadeAlpha > 0) {
        ctx!.fillStyle = `rgba(0,0,0,${Math.min(1, fadeAlpha)})`;
        ctx!.fillRect(0, 0, w, h);
      }
    }

    // ── Main loop ─────────────────────────────────────────────────────────────
    function tick() {
      if (!alive) return;
      navigate();
      tickPhase();
      renderFrame();
      frameId = requestAnimationFrame(tick);
    }

    frameId = requestAnimationFrame(tick);

    return () => {
      alive = false;
      cancelAnimationFrame(frameId);
      ro?.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block', background: '#000' }}
    />
  );
}
