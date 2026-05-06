'use client';

import { useEffect, useRef } from 'react';

// ── Sprite sheet definitions ──────────────────────────────────────────────────
const SPRITES = {
  coralLeft: 'shell/screensaver/coral_left.png', // 414×397, single image
  coralRight: 'shell/screensaver/coral_right.png', // 353×269, single image
  fish1R: 'shell/screensaver/fish1_right.png', // 1500×96,  10 frames × 150px
  fish1L: 'shell/screensaver/fish1_left.png', // 1500×96,  10 frames × 150px
  fish2R: 'shell/screensaver/fish2_right.png', // 852×89,   6 frames  × 142px
  fish2L: 'shell/screensaver/fish2_left.png', // 852×89,   6 frames  × 142px
  rayR: 'shell/screensaver/ray_right.png', // 2150×110, 10 frames × 215px
  seahorse: 'shell/screensaver/seahorse.png', // 237×121,  3 frames  × 79px
  bubbles: 'shell/screensaver/bubbles.png', // 1296×170, scrolling strip
  sharkFin: 'shell/screensaver/shark_fin.png', // 104×81,   single image
} as const;

type SpriteKey = keyof typeof SPRITES;

interface SpriteInfo {
  frames: number;
  srcW: number; // source frame width (px)
  srcH: number; // source frame height (px)
}

const SPRITE_INFO: Partial<Record<SpriteKey, SpriteInfo>> = {
  fish1R: { frames: 10, srcW: 150, srcH: 96 },
  fish1L: { frames: 10, srcW: 150, srcH: 96 },
  fish2R: { frames: 6, srcW: 142, srcH: 89 },
  fish2L: { frames: 6, srcW: 142, srcH: 89 },
  rayR: { frames: 10, srcW: 215, srcH: 110 },
  seahorse: { frames: 3, srcW: 79, srcH: 121 },
};

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

// ── Swimmer state ──────────────────────────────────────────────────────────────
interface Swimmer {
  x: number;
  y: number;
  vx: number; // pixels/frame at reference 600px height
  vy: number;
  frameIdx: number;
  frameTick: number;
  frameRate: number; // advance frame every N ticks
  spriteR: SpriteKey; // right-facing sprite key
  spriteL: SpriteKey; // left-facing sprite key (may equal spriteR for non-flipping)
  info: SpriteInfo;
  scale: number; // render scale multiplier (1 = natural at 600px height)
  facingLeft: boolean;
}

// Initial swimmer definitions (positions/speeds in "600px-height" units)
function makeSwimmers(): Omit<Swimmer, 'x' | 'y' | 'facingLeft'>[] {
  return [
    {
      vx: 1.2,
      vy: 0,
      frameIdx: 0,
      frameTick: 0,
      frameRate: 4,
      spriteR: 'fish1R',
      spriteL: 'fish1L',
      info: SPRITE_INFO.fish1R!,
      scale: 1,
    },
    {
      vx: 0.75,
      vy: 0,
      frameIdx: 3,
      frameTick: 0,
      frameRate: 5,
      spriteR: 'fish2R',
      spriteL: 'fish2L',
      info: SPRITE_INFO.fish2R!,
      scale: 0.9,
    },
    {
      vx: 0.6,
      vy: 0,
      frameIdx: 1,
      frameTick: 0,
      frameRate: 3,
      spriteR: 'rayR',
      spriteL: 'rayR',
      info: SPRITE_INFO.rayR!,
      scale: 1,
    },
    {
      vx: 1.4,
      vy: 0,
      frameIdx: 6,
      frameTick: 0,
      frameRate: 4,
      spriteR: 'fish1R',
      spriteL: 'fish1L',
      info: SPRITE_INFO.fish1R!,
      scale: 0.7,
    },
  ];
}

export function UnderwaterScreensaver() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameId = 0;
    let alive = true;
    let sprites: Partial<Record<SpriteKey, HTMLCanvasElement | null>> = {};
    let loaded = false;

    // ── Canvas sizing ──────────────────────────────────────────────────────────
    let reefDirty = true;
    const offscreen = document.createElement('canvas');

    function resize() {
      const w = canvas!.offsetWidth || window.innerWidth;
      const h = canvas!.offsetHeight || window.innerHeight;
      if (canvas!.width !== w || canvas!.height !== h) {
        canvas!.width = w;
        canvas!.height = h;
        reefDirty = true;
      }
    }

    resize();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    ro?.observe(canvas);

    // ── Swimmers ───────────────────────────────────────────────────────────────
    const swimmerDefs = makeSwimmers();
    const swimmers: Swimmer[] = [];

    function initSwimmers(h: number) {
      swimmers.length = 0;
      const swimZones = [0.18, 0.3, 0.42, 0.22]; // vertical start positions (fraction of h)
      swimmerDefs.forEach((def, i) => {
        const goLeft = i % 2 === 1;
        const sc = def.scale * (h / 600);
        const fw = def.info.srcW * sc;
        swimmers.push({
          ...def,
          x: goLeft ? canvas!.width + fw : -fw,
          y: swimZones[i] * h,
          facingLeft: goLeft,
        });
      });
    }

    // ── Seahorse (anchored near left coral) ────────────────────────────────────
    let seahorseFrame = 0;
    let seahorseTick = 0;

    // ── Bubbles scroll ─────────────────────────────────────────────────────────
    let bubbleOffset = 0;

    // ── Static coral offscreen canvas ─────────────────────────────────────────
    function buildCoralLayer(w: number, h: number) {
      offscreen.width = w;
      offscreen.height = h;
      const oc = offscreen.getContext('2d');
      if (!oc) return;
      oc.fillStyle = '#000';
      oc.fillRect(0, 0, w, h);

      const sc = h / 600;
      const clSprite = sprites.coralLeft;
      const crSprite = sprites.coralRight;

      if (clSprite) {
        const dw = clSprite.width * sc;
        const dh = clSprite.height * sc;
        oc.drawImage(clSprite, 0, h - dh, dw, dh);
      }
      if (crSprite) {
        const dw = crSprite.width * sc;
        const dh = crSprite.height * sc;
        oc.drawImage(crSprite, w - dw, h - dh, dw, dh);
      }
    }

    // ── Load all sprites, then start loop ────────────────────────────────────
    Promise.all(
      (Object.keys(SPRITES) as SpriteKey[]).map(async (key) => {
        sprites[key] = await loadSprite(SPRITES[key]);
      }),
    ).then(() => {
      if (!alive) return;
      loaded = true;
      initSwimmers(canvas!.height);
      if (!frameId) frameId = requestAnimationFrame(tick);
    });

    // Start the loop immediately so there's no blank screen while loading
    frameId = requestAnimationFrame(tick);

    // ── Main render loop ───────────────────────────────────────────────────────
    let t = 0;

    function tick() {
      if (!canvas || !ctx) return;
      t++;
      const w = canvas.width;
      const h = canvas.height;
      const sc = h / 600;

      // Rebuild static coral layer if needed
      if (loaded && (reefDirty || offscreen.width !== w || offscreen.height !== h)) {
        buildCoralLayer(w, h);
        reefDirty = false;
        initSwimmers(h);
      }

      // ── Background ──────────────────────────────────────────────────────────
      if (loaded && offscreen.width === w && offscreen.height === h) {
        ctx.drawImage(offscreen, 0, 0);
      } else {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);
      }

      if (!loaded) {
        // Waiting for sprites — show black screen
        frameId = requestAnimationFrame(tick);
        return;
      }

      // ── Bubbles (scrolling strip) ─────────────────────────────────────────
      const bubbleSprite = sprites.bubbles;
      if (bubbleSprite) {
        bubbleOffset += 0.5 * sc;
        const bw = bubbleSprite.width * sc;
        const bh = bubbleSprite.height * sc;
        // Loop the strip upward
        const bx = 0;
        const loopH = bh;
        const by = h - bh * 0.8 - (bubbleOffset % loopH);
        ctx.drawImage(bubbleSprite, bx, by, bw, bh);
        // Second copy for seamless loop
        ctx.drawImage(bubbleSprite, bx, by - loopH, bw, bh);
      }

      // ── Swimmers ──────────────────────────────────────────────────────────
      const time = t / 60;
      for (const sw of swimmers) {
        // Advance animation frame
        sw.frameTick++;
        if (sw.frameTick >= sw.frameRate) {
          sw.frameTick = 0;
          sw.frameIdx = (sw.frameIdx + 1) % sw.info.frames;
        }

        // Move
        const speed = sc;
        sw.x += sw.facingLeft ? -sw.vx * speed : sw.vx * speed;

        // Gentle vertical wave
        const waveIdx = swimmers.indexOf(sw);
        sw.vy = Math.sin(time * 0.6 + waveIdx * 2.1) * 0.18 * sc;
        sw.y += sw.vy;

        // Keep in swim zone
        const minY = h * 0.06;
        const maxY = h * 0.58;
        if (sw.y < minY) sw.y = minY;
        if (sw.y > maxY) sw.y = maxY;

        // Respawn at opposite edge
        const spriteKey = sw.facingLeft ? sw.spriteL : sw.spriteR;
        const sprite = sprites[spriteKey];
        if (!sprite) continue;

        const dw = sw.info.srcW * sw.scale * sc;
        const dh = sw.info.srcH * sw.scale * sc;

        if (sw.facingLeft && sw.x < -dw * 1.5) {
          sw.x = w + dw * 0.5;
          sw.y = (0.12 + Math.random() * 0.44) * h;
          sw.facingLeft = false;
          continue;
        }
        if (!sw.facingLeft && sw.x > w + dw * 0.5) {
          sw.x = -dw * 0.5;
          sw.y = (0.12 + Math.random() * 0.44) * h;
          sw.facingLeft = true;
          continue;
        }

        const srcX = sw.frameIdx * sw.info.srcW;

        // For ray going left, flip horizontally
        if (sw.spriteR === 'rayR' && sw.spriteL === 'rayR' && sw.facingLeft) {
          ctx.save();
          ctx.translate(sw.x + dw, sw.y);
          ctx.scale(-1, 1);
          ctx.drawImage(sprite, srcX, 0, sw.info.srcW, sw.info.srcH, 0, 0, dw, dh);
          ctx.restore();
        } else {
          ctx.drawImage(sprite, srcX, 0, sw.info.srcW, sw.info.srcH, sw.x, sw.y, dw, dh);
        }
      }

      // ── Seahorse (near left coral, gently bobbing) ─────────────────────────
      const shSprite = sprites.seahorse;
      const shInfo = SPRITE_INFO.seahorse!;
      if (shSprite) {
        seahorseTick++;
        if (seahorseTick >= 8) {
          seahorseTick = 0;
          seahorseFrame = (seahorseFrame + 1) % shInfo.frames;
        }
        const dw = shInfo.srcW * 0.9 * sc;
        const dh = shInfo.srcH * 0.9 * sc;
        const shX = w * 0.17 * sc * 2; // near left coral area
        const shBaseY = h - (sprites.coralLeft?.height ?? 300) * sc * 0.52;
        const shY = shBaseY + Math.sin(time * 0.8) * 6 * sc;
        ctx.drawImage(
          shSprite,
          seahorseFrame * shInfo.srcW,
          0,
          shInfo.srcW,
          shInfo.srcH,
          shX,
          shY,
          dw,
          dh,
        );
      }

      // ── Muted speaker icon ─────────────────────────────────────────────────
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
      style={{ width: '100%', height: '100%', display: 'block', background: '#000' }}
    />
  );
}
