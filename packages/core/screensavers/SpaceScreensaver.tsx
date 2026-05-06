'use client';

import { useEffect, useRef } from 'react';

// ── Sprite sheet definitions ───────────────────────────────────────────────────
const BASE = 'shell/screensaver/space/';

const SPRITES = {
  starfield: `${BASE}starfield.png`, // 175×175, seamless tile
  nebula: `${BASE}nebula.png`, // 320×240, nebula cloud overlay
  moon: `${BASE}moon.png`, // 273×296, lunar surface corner
  ufo: `${BASE}ufo.png`, // 2790×193, 15 frames × 186px — animated UFO
  astronautLg: `${BASE}astronaut_large.png`, // 144×174, single frame
  astronautMd: `${BASE}astronaut_medium.png`, // 108×88,  single frame
  astronautSm: `${BASE}astronaut_small.png`, // 49×60,   single frame
  satellite: `${BASE}satellite.png`, // 110×133, single frame
  sparkle: `${BASE}sparkle.png`, // 84×21,   4 frames × 21px
} as const;

type SpriteKey = keyof typeof SPRITES;

const UFO_FRAMES = 15;
const UFO_FRAME_W = 186;
const UFO_FRAME_H = 193;
const SPARKLE_FRAMES = 4;
const SPARKLE_FRAME_W = 21;
const SPARKLE_FRAME_H = 21;

// Magenta chroma-key transparency: #FF00FF ± tolerance
function applyChromaKey(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = id.data;
  for (let i = 0; i < px.length; i += 4) {
    if (px[i] > 200 && px[i + 1] < 60 && px[i + 2] > 200) {
      px[i + 3] = 0;
    }
  }
  ctx.putImageData(id, 0, 0);
}

function loadSprite(url: string): Promise<HTMLCanvasElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      c.getContext('2d')?.drawImage(img, 0, 0);
      applyChromaKey(c);
      resolve(c);
    };
    img.onerror = () => resolve(null);
    img.src = url.startsWith('/') ? url : `/${url}`;
  });
}

// ── Object state ───────────────────────────────────────────────────────────────
interface Floater {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  angularV: number;
  sprite: SpriteKey;
  srcW: number;
  srcH: number;
  scale: number;
}

interface SparklePoint {
  x: number;
  y: number;
  frameIdx: number;
  frameTick: number;
  frameRate: number;
}

// ── Initial object definitions (created on each resize) ───────────────────────
function makeFloaters(w: number, h: number): Floater[] {
  const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
  const sign = () => (Math.random() < 0.5 ? 1 : -1);

  return [
    {
      x: rand(0, w),
      y: rand(h * 0.1, h * 0.7),
      vx: rand(0.2, 0.45) * sign(),
      vy: rand(0.1, 0.22) * sign(),
      angle: rand(0, Math.PI * 2),
      angularV: rand(0.001, 0.003) * sign(),
      sprite: 'astronautLg',
      srcW: 144,
      srcH: 174,
      scale: 0.75,
    },
    {
      x: rand(0, w),
      y: rand(h * 0.15, h * 0.75),
      vx: rand(0.3, 0.55) * sign(),
      vy: rand(0.12, 0.28) * sign(),
      angle: rand(0, Math.PI * 2),
      angularV: rand(0.002, 0.005) * sign(),
      sprite: 'astronautMd',
      srcW: 108,
      srcH: 88,
      scale: 0.9,
    },
    {
      x: rand(0, w),
      y: rand(h * 0.1, h * 0.8),
      vx: rand(0.35, 0.65) * sign(),
      vy: rand(0.15, 0.3) * sign(),
      angle: rand(0, Math.PI * 2),
      angularV: rand(0.003, 0.006) * sign(),
      sprite: 'astronautSm',
      srcW: 49,
      srcH: 60,
      scale: 1.0,
    },
    {
      x: rand(w * 0.6, w),
      y: rand(0, h * 0.3),
      vx: rand(-0.5, -0.2),
      vy: rand(0.15, 0.35),
      angle: Math.PI / 5,
      angularV: 0.004,
      sprite: 'satellite',
      srcW: 110,
      srcH: 133,
      scale: 0.65,
    },
  ];
}

function makeSparkles(w: number, h: number): SparklePoint[] {
  return Array.from({ length: 14 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    frameIdx: Math.floor(Math.random() * SPARKLE_FRAMES),
    frameTick: 0,
    frameRate: Math.floor(Math.random() * 10 + 5),
  }));
}

export function SpaceScreensaver() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId = 0;
    let alive = true;
    let loaded = false;
    const sprites: Partial<Record<SpriteKey, HTMLCanvasElement | null>> = {};
    let starfieldPattern: CanvasPattern | null = null;

    // ── UFO state ──────────────────────────────────────────────────────────────
    let ufoX = 0;
    let ufoBaseY = 0;
    let ufoFrameIdx = 0;
    let ufoFrameTick = 0;

    // ── Floaters & sparkles ────────────────────────────────────────────────────
    let floaters: Floater[] = [];
    let sparkles: SparklePoint[] = [];

    function reinit(w: number, h: number) {
      const sc = h / 600;
      ufoX = w + UFO_FRAME_W * sc * 0.5;
      ufoBaseY = h * 0.15;
      floaters = makeFloaters(w, h);
      sparkles = makeSparkles(w, h);
      // Rebuild pattern on resize (ctx may have different transform)
      if (sprites.starfield && ctx) {
        starfieldPattern = ctx.createPattern(sprites.starfield, 'repeat');
      }
    }

    // ── Canvas sizing ──────────────────────────────────────────────────────────
    function resize() {
      const w = canvas!.offsetWidth || window.innerWidth;
      const h = canvas!.offsetHeight || window.innerHeight;
      if (canvas!.width !== w || canvas!.height !== h) {
        canvas!.width = w;
        canvas!.height = h;
        reinit(w, h);
      }
    }

    resize();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    ro?.observe(canvas);

    // ── Load sprites then start ────────────────────────────────────────────────
    Promise.all(
      (Object.keys(SPRITES) as SpriteKey[]).map(async (key) => {
        sprites[key] = await loadSprite(SPRITES[key]);
      }),
    ).then(() => {
      if (!alive) return;
      loaded = true;
      if (sprites.starfield && ctx) {
        starfieldPattern = ctx.createPattern(sprites.starfield, 'repeat');
      }
      reinit(canvas!.width, canvas!.height);
      if (!frameId) frameId = requestAnimationFrame(tick);
    });

    // Start loop immediately so there's no blank screen while loading
    frameId = requestAnimationFrame(tick);

    // ── Main render loop ───────────────────────────────────────────────────────
    let t = 0;

    function tick() {
      if (!canvas || !ctx) return;
      t++;
      const w = canvas.width;
      const h = canvas.height;
      const sc = h / 600;

      // Background
      ctx.fillStyle = '#000010';
      ctx.fillRect(0, 0, w, h);

      if (!loaded) {
        frameId = requestAnimationFrame(tick);
        return;
      }

      // ── Starfield tile ────────────────────────────────────────────────────
      if (starfieldPattern) {
        ctx.fillStyle = starfieldPattern;
        ctx.fillRect(0, 0, w, h);
      }

      // ── Nebula overlay (gently drifting, semi-transparent) ────────────────
      const nebulaSprite = sprites.nebula;
      if (nebulaSprite) {
        const nScale = (h * 0.52) / nebulaSprite.height;
        const nw = nebulaSprite.width * nScale;
        const nh = nebulaSprite.height * nScale;
        const nx = w * 0.5 - nw * 0.5 + Math.sin(t * 0.0015) * w * 0.04;
        const ny = h * 0.28 - nh * 0.5;
        ctx.globalAlpha = 0.5;
        ctx.drawImage(nebulaSprite, nx, ny, nw, nh);
        ctx.globalAlpha = 1;
      }

      // ── Moon — bottom-right corner, partially cropped ─────────────────────
      const moonSprite = sprites.moon;
      if (moonSprite) {
        const mScale = (h * 0.6) / moonSprite.height;
        const mw = moonSprite.width * mScale;
        const mh = moonSprite.height * mScale;
        ctx.drawImage(moonSprite, w - mw * 0.62, h - mh * 0.55, mw, mh);
      }

      // ── Sparkle stars (twinkling at fixed positions) ──────────────────────
      const sparkleSprite = sprites.sparkle;
      if (sparkleSprite) {
        for (const sp of sparkles) {
          sp.frameTick++;
          if (sp.frameTick >= sp.frameRate) {
            sp.frameTick = 0;
            sp.frameIdx = (sp.frameIdx + 1) % SPARKLE_FRAMES;
          }
          const sdw = SPARKLE_FRAME_W * sc;
          const sdh = SPARKLE_FRAME_H * sc;
          ctx.drawImage(
            sparkleSprite,
            sp.frameIdx * SPARKLE_FRAME_W,
            0,
            SPARKLE_FRAME_W,
            SPARKLE_FRAME_H,
            sp.x - sdw * 0.5,
            sp.y - sdh * 0.5,
            sdw,
            sdh,
          );
        }
      }

      // ── Floaters (astronauts + satellite) — freely tumbling ───────────────
      for (const fl of floaters) {
        fl.x += fl.vx * sc;
        fl.y += fl.vy * sc;
        fl.angle += fl.angularV;

        const spr = sprites[fl.sprite];
        if (!spr) continue;

        const dw = fl.srcW * fl.scale * sc;
        const dh = fl.srcH * fl.scale * sc;
        const margin = Math.max(dw, dh) * 2;

        if (fl.x > w + margin) fl.x = -margin;
        if (fl.x < -margin) fl.x = w + margin;
        if (fl.y > h + margin) fl.y = -margin;
        if (fl.y < -margin) fl.y = h + margin;

        ctx.save();
        ctx.translate(fl.x, fl.y);
        ctx.rotate(fl.angle);
        ctx.drawImage(spr, -dw * 0.5, -dh * 0.5, dw, dh);
        ctx.restore();
      }

      // ── UFO (15-frame animation, flies right-to-left with sine wave) ──────
      const ufoSprite = sprites.ufo;
      if (ufoSprite) {
        ufoFrameTick++;
        if (ufoFrameTick >= 2) {
          ufoFrameTick = 0;
          ufoFrameIdx = (ufoFrameIdx + 1) % UFO_FRAMES;
        }

        const ufoScale = (h * 0.27) / UFO_FRAME_H;
        const udw = UFO_FRAME_W * ufoScale;
        const udh = UFO_FRAME_H * ufoScale;

        ufoX -= 1.4 * sc;
        const drawY = ufoBaseY + Math.sin(t * 0.025) * h * 0.06;

        if (ufoX < -udw * 1.5) {
          ufoX = w + udw * 0.5;
          ufoBaseY = h * (0.08 + Math.random() * 0.55);
        }

        ctx.drawImage(
          ufoSprite,
          ufoFrameIdx * UFO_FRAME_W,
          0,
          UFO_FRAME_W,
          UFO_FRAME_H,
          ufoX,
          drawY,
          udw,
          udh,
        );
      }

      // ── Muted speaker icon ────────────────────────────────────────────────
      const ix = w - 30;
      const iy = h - 20;
      ctx.fillStyle = 'rgba(110,110,110,0.75)';
      ctx.beginPath();
      ctx.moveTo(ix, iy - 5);
      ctx.lineTo(ix + 6, iy - 5);
      ctx.lineTo(ix + 11, iy - 10);
      ctx.lineTo(ix + 11, iy + 10);
      ctx.lineTo(ix + 6, iy + 5);
      ctx.lineTo(ix, iy + 5);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(110,110,110,0.75)';
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(ix + 14, iy - 5);
      ctx.lineTo(ix + 19, iy + 5);
      ctx.moveTo(ix + 19, iy - 5);
      ctx.lineTo(ix + 14, iy + 5);
      ctx.stroke();

      frameId = requestAnimationFrame(tick);
    }

    return () => {
      alive = false;
      cancelAnimationFrame(frameId);
      ro?.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block', background: '#000010' }}
    />
  );
}
