/**
 * Palm Graffiti stroke recognizer.
 *
 * Algorithm:
 *   1. Sample the stroke at every ≥5px of movement
 *   2. Quantize each segment direction to one of 8 compass dirs (N NE E SE S SW W NW)
 *   3. Build a simplified direction sequence (run-length encoded, no consecutive repeats)
 *   4. Match the sequence + bounding-box features against per-character rules
 */

export interface Point {
  x: number;
  y: number;
}

// ── Direction quantization ────────────────────────────────────────────────────

const DIRS = ['E', 'NE', 'N', 'NW', 'W', 'SW', 'S', 'SE'] as const;
type Dir = (typeof DIRS)[number];

function quantize8(dx: number, dy: number): Dir {
  // canvas: Y increases downward → negate dy for standard math angle
  let a = (Math.atan2(-dy, dx) * 180) / Math.PI;
  if (a < 0) a += 360;
  return DIRS[Math.round(a / 45) % 8];
}

// ── Feature extraction ────────────────────────────────────────────────────────

export interface StrokeFeatures {
  seq: string; // dirs joined by '-', e.g. 'S-NE-S'
  dirs: Dir[];
  ratio: number; // bbox width / height
  closed: boolean; // stroke starts and ends near the same point
  sX: number; // start x in bbox (0=left 1=right)
  sY: number; // start y in bbox (0=top  1=bottom)
  eX: number;
  eY: number;
  len: number; // total arc length in pixels
  bboxW: number;
  bboxH: number;
}

export function extractFeatures(pts: Point[]): StrokeFeatures {
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const x0 = Math.min(...xs),
    x1 = Math.max(...xs);
  const y0 = Math.min(...ys),
    y1 = Math.max(...ys);
  const bboxW = x1 - x0 + 1;
  const bboxH = y1 - y0 + 1;

  const dirs: Dir[] = [];
  let lastDir: Dir | null = null;
  let prev = pts[0];
  let len = 0;

  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - prev.x;
    const dy = pts[i].y - prev.y;
    const d = Math.hypot(dx, dy);
    len += d;
    if (d >= 5) {
      const dir = quantize8(dx, dy);
      if (dir !== lastDir) {
        dirs.push(dir);
        lastDir = dir;
      }
      prev = pts[i];
    }
  }

  const first = pts[0];
  const last = pts[pts.length - 1];
  const closeDist = Math.hypot(last.x - first.x, last.y - first.y);

  return {
    seq: dirs.join('-'),
    dirs,
    ratio: bboxW / bboxH,
    closed: dirs.length >= 4 && closeDist < Math.hypot(bboxW, bboxH) * 0.35,
    sX: (first.x - x0) / bboxW,
    sY: (first.y - y0) / bboxH,
    eX: (last.x - x0) / bboxW,
    eY: (last.y - y0) / bboxH,
    len,
    bboxW,
    bboxH,
  };
}

// ── Pattern matching helpers ──────────────────────────────────────────────────

function is(seq: string, ...pats: string[]) {
  return pats.includes(seq);
}
function has(seq: string, sub: string) {
  return seq.includes(sub);
}
function startsWith(seq: string, ...pats: string[]) {
  return pats.some((p) => seq.startsWith(p));
}
function endsWith(seq: string, ...pats: string[]) {
  return pats.some((p) => seq.endsWith(p));
}

// ── Letter recognizer ─────────────────────────────────────────────────────────

// eslint-disable-next-line complexity
export function recognizeLetter(f: StrokeFeatures): string | null {
  const { seq, ratio, closed, sX, sY, eX, eY, len, bboxW, bboxH } = f;

  // ── Tiny dot → period ───────────────────────────────────────
  if (len < 12 && bboxW < 10 && bboxH < 10) return '.';

  // ── Shortcuts ───────────────────────────────────────────────
  // Space: rightward swipe (wide)
  if (ratio > 1.8 && is(seq, 'E', 'NE', 'SE', 'NE-E', 'E-NE', 'SE-E', 'E-SE')) return ' ';
  // Backspace: leftward swipe (wide)
  if (ratio > 1.8 && is(seq, 'W', 'NW', 'SW', 'NW-W', 'W-NW', 'SW-W', 'W-SW')) return '\b';
  // Enter: down then left (L-shape)
  if (
    is(seq, 'S-W', 'S-SW', 'S-SW-W', 'SE-S-W', 'S-SE-W', 'SW-W') &&
    !has(seq, 'E') &&
    !has(seq, 'N')
  )
    return '\n';

  // ── O: closed roughly-circular loop ─────────────────────────
  if (closed && ratio > 0.35 && ratio < 2.5) return 'o';

  // ── W: double valley (check before V/N) ─────────────────────
  if (
    is(
      seq,
      'SE-NE-SE-NE',
      'SE-NE-SE-NE-N',
      'SE-NE-SE-NE-NE',
      'S-NE-SE-NE',
      'SE-NE-SE-N',
      'S-NE-S-NE',
    )
  )
    return 'w';

  // ── N: down-up-down (one hump) ──────────────────────────────
  if (is(seq, 'S-NE-S', 'SE-NE-SE', 'S-NE-SE', 'SE-NE-S')) return 'n';

  // ── M: two humps ────────────────────────────────────────────
  if (is(seq, 'S-NE-S-NE-S', 'SE-NE-SE-NE-SE', 'S-NE-SE-NE-S')) return 'm';

  // ── A: tent — starts at bottom, NE then SE ──────────────────
  // starts low (sY > 0.4), first goes up-right, then down-right
  if (is(seq, 'NE-SE', 'NE-S', 'N-SE', 'NE-SE-S', 'N-SE-S', 'N-S') && sY > 0.4) return 'a';

  // ── V: valley — starts at top, SE then NE ───────────────────
  if (is(seq, 'SE-NE', 'S-NE', 'SE-N', 'SE-NE-N') && sY < 0.5) return 'v';

  // ── U: cup — down, right, up ────────────────────────────────
  if (is(seq, 'S-E-N', 'S-SE-NE', 'S-E-NE', 'SE-E-N', 'S-SE-N') && sY < 0.3) return 'u';

  // ── C: leftward arc ─────────────────────────────────────────
  if (
    is(seq, 'SW', 'NW-SW', 'W-SW', 'NW-W-SW', 'SW-S', 'W-S', 'NW-SW-S', 'W-SW-S') &&
    !closed &&
    sX > 0.35
  )
    return 'c';
  // Also a plain W swipe that's not wide enough for space/backspace
  if (is(seq, 'W') && ratio > 0.35 && ratio < 1.8 && !closed) return 'c';

  // ── G: C with right bar at bottom ───────────────────────────
  if ((has(seq, 'SW') || has(seq, 'W')) && endsWith(seq, '-E') && sX > 0.35) return 'g';

  // ── D: down stroke + rightward arc back up, nearly closed ───
  if (
    is(seq, 'S-E-N', 'S-NE-N', 'SE-NE-N', 'SE-NE-N-NW', 'S-NE-NW', 'S-E-N-W', 'S-NE-NW-W') &&
    eY < 0.4
  )
    return 'd';

  // ── L: down then right ──────────────────────────────────────
  if (is(seq, 'S-E', 'SE-E', 'S-SE-E') && eY > 0.6) return 'l';

  // ── I / l: narrow down stroke ───────────────────────────────
  if (is(seq, 'S', 'SW', 'SE') && ratio < 0.55 && !closed) return 'i';

  // ── J: down then hook left ──────────────────────────────────
  if (is(seq, 'SE-S-W', 'S-SW', 'SE-SW', 'S-SW-W') && eX < 0.5) return 'j';

  // ── K: down, then NE, then SE (V on right side), or classic < ─
  if (is(seq, 'S-NE-SE', 'S-N-SE', 'SW-SE', 'W-SE')) return 'k';

  // ── R: down, loop NE, leg SE ────────────────────────────────
  if (is(seq, 'S-NE-SE', 'S-E-SE', 'S-E-NE-SE')) return 'r';

  // ── P: down, loop NE, closes near top ───────────────────────
  if (is(seq, 'S-NE', 'S-E-NE', 'S-NE-SE-W', 'S-E-S-W') && eY < 0.5) return 'p';

  // ── H: two down strokes with bar ────────────────────────────
  if (is(seq, 'S-E-S', 'S-NE-S') && ratio > 0.4 && ratio < 1.8 && eY > 0.5) return 'h';

  // ── B: down with two right bumps ────────────────────────────
  if (is(seq, 'S-NE-SE-NE-SE', 'S-E-N-E-S') || (startsWith(seq, 'S-') && has(seq, '-NE-SE-NE')))
    return 'b';

  // ── T: right cross then down ────────────────────────────────
  if (is(seq, 'E-S', 'E-SE', 'E-SW') && sY < 0.4 && ratio > 0.4) return 't';

  // ── F: right then long down (similar to T but taller) ───────
  if (is(seq, 'E-S', 'E-SW') && sY >= 0.4) return 'f';

  // ── Z: E–SW–E ───────────────────────────────────────────────
  if (is(seq, 'E-SW-E', 'E-S-E', 'NE-SW-E', 'E-SW-NE', 'E-SW-SE')) return 'z';

  // ── S: S-curve ───────────────────────────────────────────────
  if (is(seq, 'NE-SW', 'E-SW-SE', 'NE-S', 'E-S-W') && !closed) return 's';

  // ── E (letter): right, then arc left-and-down (or epsilon) ───
  if (is(seq, 'W-SE', 'NW-SW-E', 'W-S-E', 'W-SW-E', 'NW-S-E', 'W-SE-W-SE', 'W-SW-W-SW')) return 'e';

  // ── X: two crossing diagonals, or continuous criss-cross ─────
  if (is(seq, 'SW-NE', 'NW-SE', 'SE-NW', 'NE-SW', 'SE-NE-SW', 'SW-NW-SE')) return 'x';

  // ── Y: diagonal down to center then straight down (or cursive y)
  if (
    is(seq, 'SE-S', 'SE-SW', 'NE-S', 'NE-SW', 'SE-SW-S', 'S-E-N-SW', 'S-E-NW-SW') &&
    !closed &&
    eY > 0.6
  )
    return 'y';

  // ── Q: closed loop with SE tail (or loop with N/NW then SE) ──
  if (has(seq, 'SE') && closed) return 'q';
  if (is(seq, 'W-S-E-N-SE', 'NW-SW-SE-NE-SE')) return 'q';

  return null;
}

// ── Digit recognizer ─────────────────────────────────────────────────────────

export function recognizeNumber(f: StrokeFeatures): string | null {
  const { seq, ratio, closed, sX, sY, eY, len, bboxW, bboxH } = f;

  if (len < 12 && bboxW < 10 && bboxH < 10) return '.';

  // Shortcuts on number side too
  if (ratio > 1.8 && is(seq, 'E', 'NE', 'SE', 'NE-E', 'E-NE', 'SE-E', 'E-SE')) return ' ';
  if (ratio > 1.8 && is(seq, 'W', 'NW', 'SW', 'NW-W', 'W-NW', 'SW-W', 'W-SW')) return '\b';
  if (is(seq, 'S-W', 'S-SW', 'S-SW-W') && !has(seq, 'E') && !has(seq, 'N')) return '\n';

  // 0: circle
  if (closed && ratio > 0.4 && ratio < 2) return '0';

  // 1: narrow downstroke
  if (is(seq, 'S', 'SE', 'SW') && ratio < 0.7) return '1';

  // 7: right then down (or down-left)
  if (is(seq, 'E-S', 'E-SW', 'E-SE', 'NE-S', 'NE-SE') && sY < 0.35) return '7';

  // 4: diagonal, left, down
  if (is(seq, 'SE-W-S', 'SE-SW-S', 'SE-W-SE')) return '4';

  // 2: right, down-left, right (like a Z for 2)
  if (is(seq, 'E-SW-E', 'NE-SW-E', 'E-S-E', 'NE-S-E')) return '2';

  // 3: two arcs opening right (NE then SE at the end)
  if (is(seq, 'SE-NE', 'NE-SE-NE', 'E-SE-NE', 'SE-NE-SE') && sX > 0.3) return '3';

  // 5: right, down, arc closing left and up
  if (is(seq, 'E-S-W', 'E-SW-NW', 'E-S-NW', 'E-S-W-NE')) return '5';

  // 6: down-arc with loop at bottom
  if (is(seq, 'S-E-N-W', 'SW-S-SE-NE-NW', 'S-SE-NE-NW') || (has(seq, 'S') && closed && sY < 0.3))
    return '6';

  // 8: S-like double loop
  if (is(seq, 'NE-SW-SE-NW', 'SE-NW-SW-NE', 'S-NE-NW-S')) return '8';

  // 9: circle then downstroke
  if (is(seq, 'S-NE-N-NW-SW', 'NE-N-NW-SW-S') || (has(seq, 'N-NW') && eY > 0.7)) return '9';

  return null;
}

// ── Public API ────────────────────────────────────────────────────────────────

export function recognize(pts: Point[], side: 'letter' | 'number'): string | null {
  if (pts.length < 2) return null;
  const f = extractFeatures(pts);
  return side === 'number' ? recognizeNumber(f) : recognizeLetter(f);
}
