import { extractFeatures, Point } from '../app/utils/graffitiRecognizer';

function interp(pts: [number, number][]): Point[] {
  const out: Point[] = [{ x: pts[0][0], y: pts[0][1] }];
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const d = Math.hypot(x1 - x0, y1 - y0);
    const steps = Math.max(2, Math.ceil(d / 8));
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      out.push({ x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t });
    }
  }
  return out;
}

const tests = {
  d: [
    [10, 10],
    [10, 90],
    [60, 80],
    [80, 50],
    [60, 20],
    [10, 10],
  ],
  e: [
    [90, 40],
    [10, 40],
    [10, 70],
    [80, 90],
  ],
  f: [
    [10, 50],
    [70, 50],
    [70, 95],
  ],
  g: [
    [80, 10],
    [20, 10],
    [0, 50],
    [20, 90],
    [80, 90],
    [80, 55],
  ],
  j: [
    [30, 5],
    [70, 5],
    [70, 80],
    [20, 95],
  ],
  k: [
    [10, 5],
    [10, 95],
    [10, 50],
    [60, 5],
    [60, 95],
  ],
  m: [
    [0, 10],
    [0, 90],
    [0, 50],
    [40, 10],
    [40, 90],
    [40, 50],
    [80, 10],
    [80, 90],
  ],
  n: [
    [0, 10],
    [0, 90],
    [0, 50],
    [50, 10],
    [50, 90],
  ],
  o: [
    [50, 0],
    [90, 30],
    [90, 70],
    [50, 100],
    [10, 70],
    [10, 30],
    [50, 0],
  ],
  p: [
    [10, 10],
    [10, 90],
    [10, 45],
    [60, 20],
    [60, 10],
    [10, 10],
  ],
  x2: [
    [90, 10],
    [10, 90],
  ],
  n0: [
    [50, 0],
    [90, 30],
    [90, 70],
    [50, 100],
    [10, 70],
    [10, 30],
    [50, 0],
  ],
  n3: [
    [80, 10],
    [80, 50],
    [80, 90],
  ],
};

for (const [name, pts] of Object.entries(tests)) {
  const f = extractFeatures(interp(pts as any));
  console.log(
    `${name}: seq = ${f.seq}, ratio = ${f.ratio.toFixed(2)}, closed = ${f.closed}, sY = ${f.sY.toFixed(2)}, eY = ${f.eY.toFixed(2)}, sX = ${f.sX.toFixed(2)}, eX = ${f.eX.toFixed(2)}`,
  );
}
