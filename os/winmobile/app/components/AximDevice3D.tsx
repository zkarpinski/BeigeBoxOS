'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// ---------- Scene constants ----------
const CANVAS_W = 400;
const CANVAS_H = 730;

const BODY_W = 1.26;
const BODY_H = 2.08;
const BODY_D = 0.28;

// Screen face dimensions & position in scene-local coords
const SCREEN_W = 0.87;
const SCREEN_H = 1.06;
const SCREEN_Y = 0.23;
const SCREEN_Z = BODY_D / 2 + 0.013;

// Controls area
const CTRL_Y = -BODY_H / 2 + 0.185;

// Camera & scene rotation
const CAM_X = 0.75;
const CAM_Y = 0.18;
const CAM_Z = 5.5;
const ROT_Y = -0.22; // negative = slight right-side reveal
const ROT_X = 0.06; // slight downward tilt

// Screen content design size
const CONTENT_W = 240;
const CONTENT_H = 320;

// ---------- 3×3 flat row-major matrix math for CSS homography ----------

function adj3(m: number[]): number[] {
  return [
    m[4] * m[8] - m[5] * m[7],
    m[2] * m[7] - m[1] * m[8],
    m[1] * m[5] - m[2] * m[4],
    m[5] * m[6] - m[3] * m[8],
    m[0] * m[8] - m[2] * m[6],
    m[2] * m[3] - m[0] * m[5],
    m[3] * m[7] - m[4] * m[6],
    m[1] * m[6] - m[0] * m[7],
    m[0] * m[4] - m[1] * m[3],
  ];
}

function mul3(a: number[], b: number[]): number[] {
  const c = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      for (let k = 0; k < 3; k++) c[i * 3 + j] += a[i * 3 + k] * b[k * 3 + j];
  return c;
}

function mulv3(m: number[], v: number[]): number[] {
  return [
    m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
    m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
    m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
  ];
}

/**
 * Returns 3×3 homography (flat row-major) from {e1→p1, e2→p2, e3→p3, [1,1,1]→p4}.
 * Used to build the source-rect → dest-quad transform.
 */
function basisToPoints(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  x4: number,
  y4: number,
): number[] {
  // m has p1,p2,p3 as columns (row-major representation)
  const m = [x1, x2, x3, y1, y2, y3, 1, 1, 1];
  const v = mulv3(adj3(m), [x4, y4, 1]);
  // H = m * diag(v)
  return mul3(m, [v[0], 0, 0, 0, v[1], 0, 0, 0, v[2]]);
}

/**
 * CSS matrix3d string for a projective transform that maps a srcW×srcH rectangle
 * (top-left at origin) to an arbitrary quadrilateral (tl, tr, br, bl).
 * Apply with `transform-origin: 0 0`.
 */
function homographyCSS(
  tl: [number, number],
  tr: [number, number],
  br: [number, number],
  bl: [number, number],
  srcW: number,
  srcH: number,
): string {
  const s = basisToPoints(0, 0, srcW, 0, srcW, srcH, 0, srcH);
  const d = basisToPoints(tl[0], tl[1], tr[0], tr[1], br[0], br[1], bl[0], bl[1]);
  const T = mul3(d, adj3(s));
  const n = T[8];
  const h = T.map((v) => v / n);
  // CSS matrix3d (column-major, 4×4 with Z pass-through)
  return `matrix3d(${h[0]},${h[3]},0,${h[6]},${h[1]},${h[4]},0,${h[7]},0,0,1,0,${h[2]},${h[5]},0,${h[8]})`;
}

// ---------- Component types ----------

type Point2 = [number, number];
type Quad = [Point2, Point2, Point2, Point2]; // tl, tr, br, bl

interface OverlayState {
  screenQuad: Quad;
  dpadCenter: Point2;
  appBtns: Point2[];
}

export interface AximDevice3DProps {
  children: React.ReactNode;
  onHomeBtn?: () => void;
  onPowerBtn?: () => void;
}

// ---------- Component ----------

export function AximDevice3D({ children, onHomeBtn }: AximDevice3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [overlay, setOverlay] = useState<OverlayState | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const W = CANVAS_W;
    const H = CANVAS_H;

    // ---- Renderer ----
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(
      Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2),
    );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // ---- Scene ----
    const scene = new THREE.Scene();
    scene.rotation.y = ROT_Y;
    scene.rotation.x = ROT_X;

    // ---- Camera ----
    const camera = new THREE.PerspectiveCamera(28, W / H, 0.1, 50);
    camera.position.set(CAM_X, CAM_Y, CAM_Z);
    camera.lookAt(0, 0, 0);

    // ---- Materials ----
    const chassisMat = new THREE.MeshStandardMaterial({
      color: 0xd6d6d6,
      roughness: 0.18,
      metalness: 0.72,
    });
    const chassisDarkMat = new THREE.MeshStandardMaterial({
      color: 0xb8b8b8,
      roughness: 0.25,
      metalness: 0.7,
    });
    const bezelMat = new THREE.MeshStandardMaterial({
      color: 0x141414,
      roughness: 0.65,
      metalness: 0.08,
    });
    const buttonMat = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.32,
      metalness: 0.58,
    });
    const dpadMat = new THREE.MeshStandardMaterial({
      color: 0x6a6a6a,
      roughness: 0.38,
      metalness: 0.52,
    });
    const dpadCenterMat = new THREE.MeshStandardMaterial({
      color: 0xb2b2b2,
      roughness: 0.22,
      metalness: 0.62,
    });
    const lensMat = new THREE.MeshStandardMaterial({
      color: 0x060608,
      roughness: 0.04,
      metalness: 0.92,
    });
    const lensRingMat = new THREE.MeshStandardMaterial({
      color: 0x424242,
      roughness: 0.18,
      metalness: 0.85,
    });
    const speakerMat = new THREE.MeshStandardMaterial({
      color: 0x1e1e1e,
      roughness: 0.88,
      metalness: 0.05,
    });
    const dellBadgeMat = new THREE.MeshStandardMaterial({
      color: 0xbababa,
      roughness: 0.28,
      metalness: 0.75,
    });

    // ---- Helper ----
    function add(
      geo: THREE.BufferGeometry,
      mat: THREE.Material | THREE.Material[],
      px = 0,
      py = 0,
      pz = 0,
      rx = 0,
    ): THREE.Mesh {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(px, py, pz);
      mesh.rotation.x = rx;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      return mesh;
    }

    // ---- Device body ----
    add(new THREE.BoxGeometry(BODY_W, BODY_H, BODY_D), chassisMat);

    // Subtle darker side panels (left & right sides)
    add(
      new THREE.BoxGeometry(0.03, BODY_H - 0.1, BODY_D),
      chassisDarkMat,
      -BODY_W / 2 + 0.015,
      0,
      0,
    );
    add(
      new THREE.BoxGeometry(0.03, BODY_H - 0.1, BODY_D),
      chassisDarkMat,
      BODY_W / 2 - 0.015,
      0,
      0,
    );

    // ---- Front face overlays ----
    const frontZ = BODY_D / 2 + 0.005;

    // Top section bezel (above screen)
    const topSecH = BODY_H / 2 - (SCREEN_Y + SCREEN_H / 2) - 0.01;
    const topSecY = SCREEN_Y + SCREEN_H / 2 + topSecH / 2 + 0.01;
    add(new THREE.BoxGeometry(BODY_W - 0.06, topSecH, 0.018), bezelMat, 0, topSecY, frontZ);

    // Bottom section bezel (below screen / controls area)
    const botSecH = BODY_H / 2 + (SCREEN_Y - SCREEN_H / 2) - 0.01;
    const botSecY = SCREEN_Y - SCREEN_H / 2 - botSecH / 2 - 0.01;
    add(new THREE.BoxGeometry(BODY_W - 0.06, botSecH, 0.018), bezelMat, 0, botSecY, frontZ);

    // Left / right narrow side bezels flanking the screen
    const sbH = SCREEN_H + 0.05;
    const sbW = (BODY_W - 0.06 - SCREEN_W) / 2;
    add(
      new THREE.BoxGeometry(sbW, sbH, 0.018),
      bezelMat,
      -(SCREEN_W / 2 + sbW / 2),
      SCREEN_Y,
      frontZ,
    );
    add(new THREE.BoxGeometry(sbW, sbH, 0.018), bezelMat, SCREEN_W / 2 + sbW / 2, SCREEN_Y, frontZ);

    // NOTE: no mesh for the screen face itself — DOM content shows through alpha canvas

    // ---- Camera lens (top-left area) ----
    const LX = -0.34;
    const LY = BODY_H / 2 - 0.115;
    const LZ = BODY_D / 2 + 0.012;
    add(new THREE.CylinderGeometry(0.054, 0.054, 0.02, 32), lensRingMat, LX, LY, LZ, Math.PI / 2);
    add(
      new THREE.CylinderGeometry(0.037, 0.037, 0.026, 32),
      lensMat,
      LX,
      LY,
      LZ + 0.006,
      Math.PI / 2,
    );

    // ---- Speaker grille (top-right, parallel slots) ----
    for (let i = 0; i < 5; i++) {
      add(
        new THREE.BoxGeometry(0.22, 0.011, 0.008),
        speakerMat,
        0.18,
        BODY_H / 2 - 0.09 - i * 0.024,
        BODY_D / 2 + 0.008,
      );
    }

    // ---- DELL badge (raised rectangle, top-right area) ----
    add(
      new THREE.BoxGeometry(0.24, 0.055, 0.006),
      dellBadgeMat,
      0.27,
      BODY_H / 2 - 0.14,
      BODY_D / 2 + 0.009,
    );

    // ---- Bottom controls ----
    // D-pad circle
    add(
      new THREE.CylinderGeometry(0.19, 0.19, 0.022, 32),
      dpadMat,
      0,
      CTRL_Y,
      BODY_D / 2 + 0.016,
      Math.PI / 2,
    );
    // D-pad cross — horizontal arm
    add(
      new THREE.BoxGeometry(0.38, 0.075, 0.026),
      new THREE.MeshStandardMaterial({ color: 0x5c5c5c, roughness: 0.38, metalness: 0.52 }),
      0,
      CTRL_Y,
      BODY_D / 2 + 0.023,
    );
    // D-pad cross — vertical arm
    add(
      new THREE.BoxGeometry(0.075, 0.38, 0.026),
      new THREE.MeshStandardMaterial({ color: 0x5c5c5c, roughness: 0.38, metalness: 0.52 }),
      0,
      CTRL_Y,
      BODY_D / 2 + 0.023,
    );
    // D-pad center button
    add(
      new THREE.CylinderGeometry(0.066, 0.066, 0.034, 32),
      dpadCenterMat,
      0,
      CTRL_Y,
      BODY_D / 2 + 0.027,
      Math.PI / 2,
    );

    // App buttons (2 left, 2 right of D-pad)
    const APP_BTN_POSITIONS: [number, number][] = [
      [-0.37, CTRL_Y + 0.055],
      [-0.37, CTRL_Y - 0.1],
      [0.37, CTRL_Y + 0.055],
      [0.37, CTRL_Y - 0.1],
    ];
    APP_BTN_POSITIONS.forEach(([bx, by]) => {
      add(new THREE.BoxGeometry(0.1, 0.058, 0.022), buttonMat, bx, by, BODY_D / 2 + 0.013);
    });

    // ---- Side details ----
    // Left side — volume rocker
    add(
      new THREE.BoxGeometry(0.032, 0.2, BODY_D - 0.06),
      new THREE.MeshStandardMaterial({ color: 0xb0b0b0, roughness: 0.22, metalness: 0.78 }),
      -BODY_W / 2 - 0.016,
      0.28,
      0,
    );
    add(
      new THREE.BoxGeometry(0.042, 0.065, BODY_D * 0.55),
      new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.28, metalness: 0.72 }),
      -BODY_W / 2 - 0.018,
      0.28,
      0,
    );

    // Right side — stylus slot ridge
    add(
      new THREE.BoxGeometry(0.025, 0.35, 0.018),
      new THREE.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 0.45 }),
      BODY_W / 2 + 0.012,
      -0.05,
      BODY_D / 2 - 0.01,
    );

    // ---- Top details ----
    // Power button
    add(
      new THREE.BoxGeometry(0.12, 0.038, 0.014),
      new THREE.MeshStandardMaterial({ color: 0x646464, roughness: 0.28, metalness: 0.72 }),
      0.24,
      BODY_H / 2 + 0.019,
      0.04,
    );
    // IR port
    add(
      new THREE.CylinderGeometry(0.016, 0.016, 0.013, 12),
      new THREE.MeshStandardMaterial({ color: 0x160800, roughness: 0.28 }),
      -0.38,
      BODY_H / 2 + 0.012,
      0.02,
      Math.PI / 2,
    );

    // ---- Lighting ----
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));

    const key = new THREE.DirectionalLight(0xffffff, 1.45);
    key.position.set(3, 4.5, 6);
    key.castShadow = true;
    scene.add(key);

    const fill = new THREE.DirectionalLight(0x9090bb, 0.32);
    fill.position.set(-4, 1.5, 3);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xfff0e8, 0.42);
    rim.position.set(0.5, -3, -2);
    scene.add(rim);

    const top = new THREE.DirectionalLight(0xffffff, 0.55);
    top.position.set(0, 6, 3);
    scene.add(top);

    // ---- Render once ----
    renderer.render(scene, camera);

    // ---- Project 3D points → 2D CSS coords ----
    const euler = new THREE.Euler(ROT_X, ROT_Y, 0);
    const rotMat = new THREE.Matrix4().makeRotationFromEuler(euler);

    function project(v3: THREE.Vector3): Point2 {
      const world = v3.clone().applyMatrix4(rotMat);
      world.project(camera);
      return [((world.x + 1) / 2) * W, ((-world.y + 1) / 2) * H];
    }

    // Screen quad
    const screenQuad: Quad = [
      project(new THREE.Vector3(-SCREEN_W / 2, SCREEN_Y + SCREEN_H / 2, SCREEN_Z)), // TL
      project(new THREE.Vector3(SCREEN_W / 2, SCREEN_Y + SCREEN_H / 2, SCREEN_Z)), // TR
      project(new THREE.Vector3(SCREEN_W / 2, SCREEN_Y - SCREEN_H / 2, SCREEN_Z)), // BR
      project(new THREE.Vector3(-SCREEN_W / 2, SCREEN_Y - SCREEN_H / 2, SCREEN_Z)), // BL
    ];

    // D-pad center
    const dpadCenter = project(new THREE.Vector3(0, CTRL_Y, BODY_D / 2 + 0.03));

    // App button centers
    const appBtns = APP_BTN_POSITIONS.map(([bx, by]) =>
      project(new THREE.Vector3(bx, by, BODY_D / 2 + 0.024)),
    );

    setOverlay({ screenQuad, dpadCenter, appBtns });

    return () => {
      renderer.dispose();
    };
  }, []);

  // ---- Screen overlay (perspective-correct) ----
  const screenStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: CONTENT_W,
    height: CONTENT_H,
    transformOrigin: '0 0',
    transform: overlay
      ? homographyCSS(
          overlay.screenQuad[0],
          overlay.screenQuad[1],
          overlay.screenQuad[2],
          overlay.screenQuad[3],
          CONTENT_W,
          CONTENT_H,
        )
      : 'translateX(-9999px)',
    overflow: 'hidden',
    pointerEvents: 'auto',
    zIndex: 1,
  };

  // ---- D-pad home button overlay ----
  const dpadBtnStyle: React.CSSProperties | null = overlay
    ? {
        position: 'absolute',
        left: overlay.dpadCenter[0] - 22,
        top: overlay.dpadCenter[1] - 22,
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        zIndex: 3,
        outline: 'none',
      }
    : null;

  return (
    <div
      className="axim-3d-root"
      style={{ position: 'relative', width: CANVAS_W, height: CANVAS_H }}
    >
      {/* Screen content — below canvas so device bezel renders over edges */}
      <div style={screenStyle}>{children}</div>

      {/* Three.js device model — transparent canvas on top */}
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      {/* Invisible clickable overlay on D-pad for Home action */}
      {dpadBtnStyle && (
        <button style={dpadBtnStyle} onClick={onHomeBtn} title="Home / Windows" aria-label="Home" />
      )}
    </div>
  );
}
