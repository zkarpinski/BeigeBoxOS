'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// ---------- Scene constants ----------
const CANVAS_W = 400;
const CANVAS_H = 730;

const BODY_W = 1.32;
const BODY_H = 2.02;
const BODY_D = 0.17;

// Screen face dimensions & position in scene-local coords
const SCREEN_W = 0.92;
const SCREEN_H = 1.22;
const SCREEN_Y = 0.22;
const SCREEN_Z = BODY_D / 2 + 0.015;

// Controls area
const CTRL_Y = -BODY_H / 2 + 0.22;

// Camera — centered for a straight-on default view
const CAM_X = 0;
const CAM_Y = 0;
const CAM_Z = 5.5;

// Screen content design size
const CONTENT_W = 240;
const CONTENT_H = 320;

// App button positions (module-scope so renderAndProject can reference them)
const APP_BTN_POSITIONS: [number, number][] = [
  [-0.52, CTRL_Y],
  [-0.3, CTRL_Y],
  [0.3, CTRL_Y],
  [0.52, CTRL_Y],
];

// No rotation limits — full 360° in any direction

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
  const m = [x1, x2, x3, y1, y2, y3, 1, 1, 1];
  const v = mulv3(adj3(m), [x4, y4, 1]);
  return mul3(m, [v[0], 0, 0, 0, v[1], 0, 0, 0, v[2]]);
}

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
  return `matrix3d(${h[0]},${h[3]},0,${h[6]},${h[1]},${h[4]},0,${h[7]},0,0,1,0,${h[2]},${h[5]},0,${h[8]})`;
}

// ---------- Component types ----------

type Point2 = [number, number];
type Quad = [Point2, Point2, Point2, Point2]; // tl, tr, br, bl

interface OverlayState {
  screenQuad: Quad;
  dpadCenter: Point2;
  appBtns: Point2[];
  /** True when the screen face normal points toward the camera (front-facing). */
  screenFacing: boolean;
}

export interface AximDevice3DProps {
  children: React.ReactNode;
  onHomeBtn?: () => void;
  onPowerBtn?: () => void;
}

// ---------- Component ----------

export function AximDevice3D({ children, onHomeBtn }: AximDevice3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Current rotation stored in a ref (avoids stale closures in event handlers)
  const rotRef = useRef({ x: 0, y: 0 });
  // Drag start state
  const dragRef = useRef<{
    startX: number;
    startY: number;
    startRotX: number;
    startRotY: number;
  } | null>(null);

  const [overlay, setOverlay] = useState<OverlayState | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Re-render the scene at the given rotation and recalculate the 2D overlay coords.
  const renderAndProject = useCallback((rotX: number, rotY: number) => {
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    if (!renderer || !scene || !camera) return;

    scene.rotation.x = rotX;
    scene.rotation.y = rotY;
    renderer.render(scene, camera);

    const euler = new THREE.Euler(rotX, rotY, 0);
    const rotMat = new THREE.Matrix4().makeRotationFromEuler(euler);

    // camera is guaranteed non-null here (guarded above); captured for TS narrowing
    const cam = camera;
    function project(v3: THREE.Vector3): Point2 {
      const world = v3.clone().applyMatrix4(rotMat);
      world.project(cam);
      return [((world.x + 1) / 2) * CANVAS_W, ((-world.y + 1) / 2) * CANVAS_H];
    }

    const screenQuad: Quad = [
      project(new THREE.Vector3(-SCREEN_W / 2, SCREEN_Y + SCREEN_H / 2, SCREEN_Z)), // TL
      project(new THREE.Vector3(SCREEN_W / 2, SCREEN_Y + SCREEN_H / 2, SCREEN_Z)), // TR
      project(new THREE.Vector3(SCREEN_W / 2, SCREEN_Y - SCREEN_H / 2, SCREEN_Z)), // BR
      project(new THREE.Vector3(-SCREEN_W / 2, SCREEN_Y - SCREEN_H / 2, SCREEN_Z)), // BL
    ];

    const dpadCenter = project(new THREE.Vector3(0, CTRL_Y, BODY_D / 2 + 0.03));
    const appBtns = APP_BTN_POSITIONS.map(([bx, by]) =>
      project(new THREE.Vector3(bx, by, BODY_D / 2 + 0.024)),
    );

    // Screen normal (0,0,1) rotated by scene rotation — z-component tells us if it faces camera.
    // cos(rotX)*cos(rotY) > 0 means the front face is toward the camera.
    const screenFacing = Math.cos(rotX) * Math.cos(rotY) > 0;

    setOverlay({ screenQuad, dpadCenter, appBtns, screenFacing });
  }, []);

  // ---- Build Three.js scene once ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const W = CANVAS_W;
    const H = CANVAS_H;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(
      Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2),
    );
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.25;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, W / H, 0.1, 50);
    camera.position.set(CAM_X, CAM_Y, CAM_Z);
    camera.lookAt(0, 0, 0);

    rendererRef.current = renderer;
    sceneRef.current = scene;
    cameraRef.current = camera;

    // Environment map — gives physical materials (clearcoat, metalness) realistic reflections.
    // Guarded: PMREMGenerator requires getRenderTarget which may not exist in test environments.
    let envTexture: THREE.Texture | null = null;
    if (typeof renderer.getRenderTarget === 'function') {
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      envTexture = pmremGenerator.fromScene(new RoomEnvironment()).texture;
      scene.environment = envTexture;
      pmremGenerator.dispose();
    }

    // ---- Materials — MeshPhysicalMaterial for key surfaces ----
    // Cool neutral gray — Dell Axim X3i silver (darker so it doesn't blow out under lighting)
    const chassisMat = new THREE.MeshPhysicalMaterial({
      color: 0xa0a0a0,
      roughness: 0.4,
      metalness: 0.55,
      clearcoat: 0.07,
      clearcoatRoughness: 0.3,
      side: THREE.DoubleSide,
    });
    const chassisDarkMat = new THREE.MeshPhysicalMaterial({
      color: 0x909090,
      roughness: 0.46,
      metalness: 0.48,
      clearcoat: 0.04,
      clearcoatRoughness: 0.36,
      side: THREE.DoubleSide,
    });
    // Bezel — slightly darker
    const bezelMat = new THREE.MeshPhysicalMaterial({
      color: 0x989898,
      roughness: 0.54,
      metalness: 0.32,
      clearcoat: 0.0,
    });
    const buttonMat = new THREE.MeshPhysicalMaterial({
      color: 0x929292,
      roughness: 0.5,
      metalness: 0.35,
      clearcoat: 0.0,
    });
    const dpadMat = new THREE.MeshPhysicalMaterial({
      color: 0x8a8a8a,
      roughness: 0.52,
      metalness: 0.33,
      clearcoat: 0.0,
    });
    const dpadCenterMat = new THREE.MeshPhysicalMaterial({
      color: 0x9e9e9e,
      roughness: 0.44,
      metalness: 0.4,
      clearcoat: 0.0,
    });
    const lensMat = new THREE.MeshPhysicalMaterial({
      color: 0x040406,
      roughness: 0.02,
      metalness: 0.0,
      clearcoat: 1.0,
      clearcoatRoughness: 0.02,
    });
    const lensRingMat = new THREE.MeshPhysicalMaterial({
      color: 0x3e3e3e,
      roughness: 0.15,
      metalness: 0.88,
      clearcoat: 0.3,
      clearcoatRoughness: 0.1,
    });
    const speakerMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.9,
      metalness: 0.04,
    });
    const dellBadgeMat = new THREE.MeshPhysicalMaterial({
      color: 0xb8b8b8,
      roughness: 0.22,
      metalness: 0.78,
      clearcoat: 0.4,
      clearcoatRoughness: 0.1,
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
    const bodyShape = new THREE.Shape();
    const rw = BODY_W / 2;
    const rh = BODY_H / 2;
    const br = 0.24; // Bottom corner radius
    const tr = 0.06; // Top corner radius

    bodyShape.moveTo(rw - tr, rh);
    bodyShape.lineTo(-rw + tr, rh);
    bodyShape.absarc(-rw + tr, rh - tr, tr, Math.PI / 2, Math.PI, false);
    bodyShape.lineTo(-rw, -rh + br);
    bodyShape.absarc(-rw + br, -rh + br, br, Math.PI, Math.PI * 1.5, false);
    bodyShape.lineTo(rw - br, -rh);
    bodyShape.absarc(rw - br, -rh + br, br, Math.PI * 1.5, Math.PI * 2, false);
    bodyShape.lineTo(rw, rh - tr);
    bodyShape.absarc(rw - tr, rh - tr, tr, 0, Math.PI / 2, false);

    const bodyGeo = new THREE.ExtrudeGeometry(bodyShape, {
      depth: BODY_D,
      bevelEnabled: true,
      bevelThickness: 0.009,
      bevelSize: 0.011,
      bevelSegments: 10,
    });
    bodyGeo.center();
    add(bodyGeo, chassisMat);

    // ---- Front face overlays ----
    const frontZ = BODY_D / 2 + 0.005;

    const topSecH = BODY_H / 2 - (SCREEN_Y + SCREEN_H / 2) - 0.01;
    const topSecY = SCREEN_Y + SCREEN_H / 2 + topSecH / 2 + 0.01;
    add(new THREE.BoxGeometry(BODY_W - 0.06, topSecH, 0.018), bezelMat, 0, topSecY, frontZ);

    const botSecH = BODY_H / 2 + (SCREEN_Y - SCREEN_H / 2) - 0.01;
    const botSecY = SCREEN_Y - SCREEN_H / 2 - botSecH / 2 - 0.01;
    add(new THREE.BoxGeometry(BODY_W - 0.06, botSecH, 0.018), bezelMat, 0, botSecY, frontZ);

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

    // Screen glass — MeshPhysicalMaterial clearcoat simulates the display cover glass.
    // The DOM overlay (z-index > canvas) renders the OS UI on top of this mesh.
    add(
      new THREE.BoxGeometry(SCREEN_W, SCREEN_H, 0.004),
      new THREE.MeshPhysicalMaterial({
        color: 0x050505,
        roughness: 0.03,
        metalness: 0.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.02,
      }),
      0,
      SCREEN_Y,
      SCREEN_Z + 0.001,
    );

    // ---- Speaker slit & notification LED (top bezel) ----
    const spkY = rh - 0.07;
    // Thin horizontal speaker slit
    for (let i = 0; i < 3; i++) {
      add(new THREE.BoxGeometry(0.24, 0.007, 0.008), speakerMat, 0, spkY - i * 0.014, frontZ);
    }
    // Notification LED (small green dot, top-left of bezel)
    add(
      new THREE.CylinderGeometry(0.013, 0.013, 0.01, 12),
      new THREE.MeshStandardMaterial({ color: 0x22ff44, emissive: 0x116600 }),
      -0.34,
      spkY - 0.02,
      frontZ,
      Math.PI / 2,
    );

    // ---- Top-bezel branding: DELL (left) · gold circle (center) · AXIM (right) ----
    // Gold power / IR indicator circle
    add(
      new THREE.CylinderGeometry(0.052, 0.052, 0.014, 32),
      new THREE.MeshPhysicalMaterial({
        color: 0xb89030,
        roughness: 0.25,
        metalness: 0.85,
        clearcoat: 0.5,
      }),
      0.06,
      rh - 0.1,
      frontZ,
      Math.PI / 2,
    );
    // Dark lens inside
    add(
      new THREE.CylinderGeometry(0.032, 0.032, 0.018, 32),
      new THREE.MeshPhysicalMaterial({
        color: 0x080808,
        roughness: 0.05,
        metalness: 0.0,
        clearcoat: 1.0,
      }),
      0.06,
      rh - 0.1,
      frontZ + 0.001,
      Math.PI / 2,
    );

    // Canvas text helper — creates a transparent plane with rendered text
    function addTextPlane(
      text: string,
      font: string,
      color: string,
      cw: number,
      ch: number,
      planeW: number,
      planeH: number,
      px: number,
      py: number,
      pz: number,
    ) {
      if (typeof document === 'undefined') return;
      const canvas = document.createElement('canvas');
      canvas.width = cw;
      canvas.height = ch;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, cw, ch);
      ctx.fillStyle = color;
      ctx.font = font;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, cw / 2, ch / 2);
      const tex = new THREE.CanvasTexture(canvas);
      tex.needsUpdate = true;
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        depthWrite: false,
        depthTest: false,
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(planeW, planeH), mat);
      mesh.position.set(px, py, pz);
      mesh.renderOrder = 2;
      scene.add(mesh);
    }

    // "DELL" — bold italic silver, left of circle
    addTextPlane(
      'DELL',
      'bold italic 48px Arial',
      '#b4b4b4',
      200,
      72,
      0.3,
      0.09,
      -0.27,
      rh - 0.11,
      frontZ + 0.022,
    );
    // "AXIM" — smaller regular, right of circle
    addTextPlane(
      'AXIM',
      'bold 28px Arial',
      '#a0a0a0',
      140,
      48,
      0.18,
      0.065,
      0.27,
      rh - 0.11,
      frontZ + 0.022,
    );
    // "Pocket PC" — centered below screen
    addTextPlane(
      'Pocket PC',
      '22px Arial',
      '#888888',
      220,
      44,
      0.38,
      0.065,
      0,
      CTRL_Y + 0.14,
      frontZ + 0.022,
    );

    // ---- Recessed button ring material (dark groove) ----
    const recessMat = new THREE.MeshPhysicalMaterial({
      color: 0x484848,
      roughness: 0.6,
      metalness: 0.35,
      clearcoat: 0.0,
    });

    // ---- Nav oval — outer housing → recessed ring → raised cap ----
    {
      // Outer housing oval (chassis color, proud of bezel)
      const navHousing = new THREE.Mesh(
        new THREE.CylinderGeometry(0.072, 0.072, 0.014, 32),
        chassisMat,
      );
      navHousing.rotation.x = Math.PI / 2;
      navHousing.scale.x = 2.5;
      navHousing.position.set(0, CTRL_Y, frontZ + 0.007);
      navHousing.castShadow = true;
      scene.add(navHousing);
      // Dark recessed groove disc
      const navRecess = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 0.012, 32),
        recessMat,
      );
      navRecess.rotation.x = Math.PI / 2;
      navRecess.scale.x = 2.2;
      navRecess.position.set(0, CTRL_Y, frontZ + 0.002);
      navRecess.castShadow = true;
      scene.add(navRecess);
      // Raised inner cap
      const navCap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.048, 0.048, 0.022, 32),
        dpadCenterMat,
      );
      navCap.rotation.x = Math.PI / 2;
      navCap.scale.x = 1.9;
      navCap.position.set(0, CTRL_Y, frontZ + 0.017);
      navCap.castShadow = true;
      scene.add(navCap);
      // Small indicator dot (top)
      add(
        new THREE.CylinderGeometry(0.008, 0.008, 0.006, 12),
        recessMat,
        0,
        CTRL_Y + 0.048,
        frontZ + 0.02,
        Math.PI / 2,
      );
    }

    // ---- App buttons — circular housing → dark recessed ring → raised cap + icon ----
    // Icon draw functions (canvas 64×64)
    type DrawFn = (ctx: CanvasRenderingContext2D) => void;
    const iconDrawers: DrawFn[] = [
      // Calendar
      (ctx) => {
        ctx.strokeStyle = '#505050';
        ctx.lineWidth = 3;
        ctx.strokeRect(8, 12, 48, 44);
        ctx.beginPath();
        ctx.moveTo(8, 26);
        ctx.lineTo(56, 26);
        ctx.stroke();
        for (let c = 1; c < 3; c++) {
          const x = 8 + c * 16;
          ctx.beginPath();
          ctx.moveTo(x, 26);
          ctx.lineTo(x, 56);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(8, 41);
        ctx.lineTo(56, 41);
        ctx.stroke();
        ctx.fillStyle = '#505050';
        ctx.fillRect(18, 6, 5, 10);
        ctx.fillRect(41, 6, 5, 10);
      },
      // Contacts (person)
      (ctx) => {
        ctx.strokeStyle = '#505050';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(32, 22, 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(32, 56, 20, Math.PI, 0);
        ctx.stroke();
      },
      // Inbox (envelope)
      (ctx) => {
        ctx.strokeStyle = '#505050';
        ctx.lineWidth = 3;
        ctx.strokeRect(6, 14, 52, 36);
        ctx.beginPath();
        ctx.moveTo(6, 14);
        ctx.lineTo(32, 36);
        ctx.lineTo(58, 14);
        ctx.stroke();
      },
      // Home
      (ctx) => {
        ctx.strokeStyle = '#505050';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(8, 34);
        ctx.lineTo(32, 10);
        ctx.lineTo(56, 34);
        ctx.stroke();
        ctx.strokeRect(14, 32, 36, 24);
        ctx.strokeRect(24, 42, 16, 14);
      },
    ];

    function makeIconTexture(drawFn: DrawFn): THREE.CanvasTexture | null {
      if (typeof document === 'undefined') return null;
      const c = document.createElement('canvas');
      c.width = 64;
      c.height = 64;
      const ctx = c.getContext('2d');
      if (!ctx) return null;
      ctx.clearRect(0, 0, 64, 64);
      drawFn(ctx);
      const tex = new THREE.CanvasTexture(c);
      tex.needsUpdate = true;
      return tex;
    }

    APP_BTN_POSITIONS.forEach(([bx, by], i) => {
      // Outer housing disc (chassis color, raised ring)
      add(
        new THREE.CylinderGeometry(0.082, 0.082, 0.012, 32),
        chassisMat,
        bx,
        by,
        frontZ + 0.006,
        Math.PI / 2,
      );
      // Dark recessed inner disc
      add(
        new THREE.CylinderGeometry(0.066, 0.066, 0.01, 32),
        recessMat,
        bx,
        by,
        frontZ + 0.001,
        Math.PI / 2,
      );
      // Raised circular cap
      add(
        new THREE.CylinderGeometry(0.052, 0.052, 0.018, 32),
        buttonMat,
        bx,
        by,
        frontZ + 0.014,
        Math.PI / 2,
      );
      // Icon decal on cap face
      const iconTex = makeIconTexture(iconDrawers[i % iconDrawers.length]);
      if (iconTex) {
        const iconMat = new THREE.MeshBasicMaterial({
          map: iconTex,
          transparent: true,
          depthWrite: false,
          depthTest: false,
        });
        const iconMesh = new THREE.Mesh(new THREE.CircleGeometry(0.042, 32), iconMat);
        iconMesh.position.set(bx, by, frontZ + 0.026);
        iconMesh.renderOrder = 2;
        scene.add(iconMesh);
      }
    });

    // ---- Side details ----
    // Left side: voice record button (small protrusion, champagne)
    add(new THREE.BoxGeometry(0.026, 0.08, 0.05), buttonMat, -rw - 0.013, 0.28, 0);
    // Right side: stylus channel groove (thin strip indicating stylus slot)
    add(
      new THREE.BoxGeometry(0.018, 0.32, 0.01),
      new THREE.MeshStandardMaterial({ color: 0x909090, roughness: 0.45 }),
      frontZ - 0.005,
    );

    // ---- AXIM branding (bottom bezel) ----
    add(
      new THREE.BoxGeometry(0.16, 0.04, 0.008),
      new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.8 }),
      0,
      -0.58,
      frontZ,
    );

    // ---- Top edge ----
    // Power button (top-right)
    add(
      new THREE.BoxGeometry(0.11, 0.034, 0.014),
      new THREE.MeshStandardMaterial({ color: 0x606060, roughness: 0.28, metalness: 0.72 }),
      0.25,
      rh + 0.017,
      0.02,
    );
    // IR port (top-left, dark lens)
    add(
      new THREE.CylinderGeometry(0.015, 0.015, 0.012, 12),
      new THREE.MeshStandardMaterial({ color: 0x160800, roughness: 0.3 }),
      -0.36,
      rh + 0.012,
      0.01,
      Math.PI / 2,
    );

    // ---- Back face details ----
    const backSZ = -(BODY_D / 2 + 0.005);

    // Corner screws (×4)
    const screwRingMat = new THREE.MeshStandardMaterial({
      color: 0x505050,
      roughness: 0.3,
      metalness: 0.8,
    });
    const screwCoreMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.5,
      metalness: 0.5,
    });
    const cornerScrews: [number, number][] = [
      [-BODY_W / 2 + 0.1, BODY_H / 2 - 0.1],
      [BODY_W / 2 - 0.1, BODY_H / 2 - 0.1],
      [-BODY_W / 2 + 0.1, -BODY_H / 2 + 0.1],
      [BODY_W / 2 - 0.1, -BODY_H / 2 + 0.1],
    ];
    cornerScrews.forEach(([sx, sy]) => {
      add(
        new THREE.CylinderGeometry(0.044, 0.044, 0.016, 16),
        screwRingMat,
        sx,
        sy,
        backSZ - 0.008,
        Math.PI / 2,
      );
      add(
        new THREE.CylinderGeometry(0.025, 0.025, 0.022, 12),
        screwCoreMat,
        sx,
        sy,
        backSZ - 0.009,
        Math.PI / 2,
      );
    });

    // Battery cover (large panel covering most of the back)
    const batW = 0.88;
    const batH = 1.44;
    const batX = -0.06;
    const batY = -0.02;
    const batCoverMat = new THREE.MeshStandardMaterial({
      color: 0x9c9c9c,
      roughness: 0.38,
      metalness: 0.48,
    });
    add(new THREE.BoxGeometry(batW, batH, 0.014), batCoverMat, batX, batY, backSZ - 0.006);

    // Battery release tabs (tapered oval domes at top & bottom of cover)
    const tabMat = new THREE.MeshStandardMaterial({
      color: 0xa4a4a4,
      roughness: 0.3,
      metalness: 0.5,
    });
    add(
      new THREE.CylinderGeometry(0.046, 0.06, 0.018, 20),
      tabMat,
      batX,
      batY + batH / 2 + 0.016,
      backSZ - 0.012,
      Math.PI / 2,
    );
    add(
      new THREE.CylinderGeometry(0.046, 0.06, 0.018, 20),
      tabMat,
      batX,
      batY - batH / 2 - 0.016,
      backSZ - 0.012,
      Math.PI / 2,
    );

    // "Designed for Windows Mobile" badge (dark rectangle near top-center of back)
    const badgeW = 0.38;
    const badgeH = 0.11;
    const badgeX = 0.08;
    const badgeY = BODY_H / 2 - 0.22;
    add(
      new THREE.BoxGeometry(badgeW, badgeH, 0.007),
      new THREE.MeshStandardMaterial({ color: 0x0d0d0d, roughness: 0.6, metalness: 0.1 }),
      badgeX,
      badgeY,
      backSZ - 0.006,
    );

    // Windows logo — 4 colored panes
    const pSz = 0.026;
    const pOff = 0.016;
    const logoX = badgeX - badgeW / 2 + 0.054;
    const logoY = badgeY;
    const logoPanes: Array<{ col: number; ox: number; oy: number }> = [
      { col: 0xf25022, ox: -pOff, oy: pOff },
      { col: 0x7fba00, ox: pOff, oy: pOff },
      { col: 0x00a4ef, ox: -pOff, oy: -pOff },
      { col: 0xffb900, ox: pOff, oy: -pOff },
    ];
    logoPanes.forEach(({ col, ox, oy }) => {
      add(
        new THREE.BoxGeometry(pSz, pSz, 0.008),
        new THREE.MeshStandardMaterial({ color: col, roughness: 0.5, metalness: 0.1 }),
        logoX + ox,
        logoY + oy,
        backSZ - 0.007,
      );
    });

    // Back face DELL logo (circular recess)
    add(
      new THREE.CylinderGeometry(0.14, 0.14, 0.01, 32),
      dellBadgeMat,
      0,
      0.45,
      backSZ - 0.005,
      Math.PI / 2,
    );

    // Speaker grille — 6x6 dot grid (bottom-left of back)
    const spkX0 = -rw + 0.18;
    const spkY0 = -rh + 0.22;
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 6; col++) {
        add(
          new THREE.CylinderGeometry(0.01, 0.01, 0.01, 8),
          speakerMat,
          spkX0 + col * 0.035,
          spkY0 + row * 0.035,
          backSZ - 0.006,
          Math.PI / 2,
        );
      }
    }

    // Lock slider slot (right-side of back, lower area)
    add(
      new THREE.BoxGeometry(0.034, 0.055, 0.014),
      new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.8, metalness: 0.2 }),
      BODY_W / 2 - 0.22,
      -0.12,
      backSZ - 0.007,
    );

    // Strap pin slots (side cutouts, upper area — left & right)
    const pinMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      roughness: 0.7,
      metalness: 0.2,
    });
    add(
      new THREE.BoxGeometry(0.032, 0.065, BODY_D * 0.52),
      pinMat,
      -BODY_W / 2,
      BODY_H / 2 - 0.31,
      0,
    );
    add(
      new THREE.BoxGeometry(0.032, 0.065, BODY_D * 0.52),
      pinMat,
      BODY_W / 2,
      BODY_H / 2 - 0.31,
      0,
    );

    // ---- Bottom edge — sync/dock connector ----
    const botFaceY = -(BODY_H / 2);

    // Dark plastic base strip covering most of the bottom face
    add(
      new THREE.BoxGeometry(BODY_W - 0.1, 0.02, BODY_D - 0.04),
      new THREE.MeshStandardMaterial({ color: 0x181818, roughness: 0.88, metalness: 0.04 }),
      0,
      botFaceY - 0.01,
      0,
    );

    // Sync/dock connector cavity (deep dark recess)
    const syncW = 0.54;
    const syncD = BODY_D * 0.75; // proportion of body depth
    add(
      new THREE.BoxGeometry(syncW, 0.03, syncD),
      new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.95, metalness: 0.05 }),
      -0.02,
      botFaceY - 0.015,
      0,
    );

    // Connector plastic body (silver/grey insert inside the cavity)
    const connW = syncW - 0.06;
    const connD = syncD - 0.04;
    add(
      new THREE.BoxGeometry(connW, 0.016, connD),
      new THREE.MeshStandardMaterial({ color: 0xb4b4b4, roughness: 0.3, metalness: 0.55 }),
      -0.02,
      botFaceY - 0.009,
      0,
    );

    // Connector pin contacts (gold, two rows front & back)
    const pinMat3 = new THREE.MeshStandardMaterial({
      color: 0xc8a820,
      roughness: 0.15,
      metalness: 0.95,
    });
    const nPins = 13;
    const pinAreaW = connW - 0.04;
    const pinStep = pinAreaW / (nPins - 1);
    const pinFrontZ = -(connD / 2 - 0.022);
    const pinBackZ = connD / 2 - 0.022;
    for (let i = 0; i < nPins; i++) {
      const px = -0.02 - pinAreaW / 2 + i * pinStep;
      add(new THREE.BoxGeometry(0.011, 0.007, 0.018), pinMat3, px, botFaceY - 0.008, pinFrontZ);
      add(new THREE.BoxGeometry(0.011, 0.007, 0.018), pinMat3, px, botFaceY - 0.008, pinBackZ);
    }

    // Connector retaining clips (small dark L-brackets at front & back of cavity)
    const clipMat = new THREE.MeshStandardMaterial({
      color: 0x404040,
      roughness: 0.35,
      metalness: 0.75,
    });
    add(
      new THREE.BoxGeometry(syncW - 0.02, 0.01, 0.018),
      clipMat,
      -0.02,
      botFaceY - 0.006,
      -(syncD / 2 - 0.009),
    );
    add(
      new THREE.BoxGeometry(syncW - 0.02, 0.01, 0.018),
      clipMat,
      -0.02,
      botFaceY - 0.006,
      syncD / 2 - 0.009,
    );

    // ---- Lighting ----
    // Low ambient so shadows remain visible; directionals provide shape definition
    scene.add(new THREE.AmbientLight(0xffffff, 0.18));

    const key = new THREE.DirectionalLight(0xffffff, 0.75);
    key.position.set(3, 4.5, 6);
    key.castShadow = true;
    scene.add(key);

    const fill = new THREE.DirectionalLight(0x9090bb, 0.18);
    fill.position.set(-4, 1.5, 3);
    scene.add(fill);

    const rim = new THREE.DirectionalLight(0xfff0e8, 0.14);
    rim.position.set(0.5, -3, -2);
    scene.add(rim);

    const backKey = new THREE.DirectionalLight(0xffffff, 0.28);
    backKey.position.set(-1, 2, -6);
    scene.add(backKey);

    const top = new THREE.DirectionalLight(0xffffff, 0.16);
    top.position.set(0, 6, 3);
    scene.add(top);

    // Initial render — straight on (rotation 0, 0)
    renderAndProject(0, 0);

    return () => {
      renderer.dispose();
      envTexture?.dispose();
      rendererRef.current = null;
      sceneRef.current = null;
      cameraRef.current = null;
    };
  }, [renderAndProject]);

  // ---- Global mouse drag handlers ----
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;

      const newRotY = dragRef.current.startRotY + dx * 0.007;
      const newRotX = dragRef.current.startRotX + dy * 0.005;

      rotRef.current = { x: newRotX, y: newRotY };
      renderAndProject(newRotX, newRotY);
    };

    const onMouseUp = () => {
      if (dragRef.current) {
        dragRef.current = null;
        setIsDragging(false);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [renderAndProject]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // If we're clicking the OS content or the Home button, don't start dragging the device
    const target = e.target as HTMLElement;
    if (target.closest('.axim-screen-container') || target.tagName === 'BUTTON') {
      return;
    }

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startRotX: rotRef.current.x,
      startRotY: rotRef.current.y,
    };
    setIsDragging(true);
  }, []);

  const screenFacing = overlay?.screenFacing ?? false;

  // ---- Screen overlay (perspective-correct) ----
  const screenStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: CONTENT_W,
    height: CONTENT_H,
    transformOrigin: '0 0',
    transform:
      overlay && screenFacing
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
    // Disable pointer events while rotating so the drag isn't interrupted
    pointerEvents: isDragging ? 'none' : 'auto',
    zIndex: 3,
  };

  // ---- D-pad home button overlay — only shown when front face is toward camera ----
  const dpadBtnStyle: React.CSSProperties | null =
    overlay && screenFacing
      ? {
          position: 'absolute',
          left: overlay.dpadCenter[0] - 22,
          top: overlay.dpadCenter[1] - 22,
          width: 44,
          height: 44,
          borderRadius: '50%',
          background: 'transparent',
          border: 'none',
          cursor: isDragging ? 'grabbing' : 'pointer',
          zIndex: 4,
          outline: 'none',
        }
      : null;

  return (
    <div
      className="axim-3d-root"
      style={{
        position: 'relative',
        width: CANVAS_W,
        height: CANVAS_H,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* OS content — above canvas so it shows over the 3D screen face mesh */}
      <div className="axim-screen-container" style={screenStyle}>
        {children}
      </div>

      {/* Three.js device model — transparent canvas */}
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
