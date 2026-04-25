/**
 * Integration tests: feed actual stroke coordinates through the full pipeline
 * (extractFeatures → recognize) to verify real-world drawing behavior.
 *
 * Canvas coords: X right, Y down.
 * Strokes are interpolated to produce enough sample points (≥5px segments).
 */

import { recognize } from './graffitiRecognizer';
import type { Point } from './graffitiRecognizer';

/** Interpolate points along a polyline so every segment is ~8px apart. */
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

/** Convenience: recognize on the letter side. */
function rL(pts: [number, number][]): string | null {
  return recognize(interp(pts), 'letter');
}

/** Convenience: recognize on the number side. */
function rN(pts: [number, number][]): string | null {
  return recognize(interp(pts), 'number');
}

// ── Letters ───────────────────────────────────────────────────────────────────

describe('Integration — Letters', () => {
  it('a — tent from bottom: up-right then down-right, start low', () => {
    expect(
      rL([
        [10, 90],
        [50, 10],
        [90, 90],
      ]),
    ).toBe('a');
  });

  it('b — down, bump right twice', () => {
    expect(
      rL([
        [0, 0],
        [0, 100],
        [0, 55],
        [50, 55],
        [50, 100],
        [0, 100],
      ]),
    ).toBe('b');
  });

  it('c — arc from upper-right, sweeping left and down', () => {
    expect(
      rL([
        [80, 10],
        [20, 10],
        [0, 50],
        [20, 90],
        [80, 90],
      ]),
    ).toBe('c');
  });

  it('d — down then arc right and back up', () => {
    expect(
      rL([
        [10, 10],
        [10, 90],
        [60, 80],
        [80, 50],
        [60, 20],
        [10, 10],
      ]),
    ).toBe('d');
  });

  it('e — leftward then arc SE (epsilon)', () => {
    expect(
      rL([
        [90, 40],
        [10, 40],
        [10, 70],
        [80, 90],
      ]),
    ).toBe('e');
  });

  it('f — crossbar from middle then down', () => {
    expect(
      rL([
        [10, 50],
        [70, 50],
        [70, 95],
      ]),
    ).toBe('f');
  });

  it('g — C-arc with rightward bar at bottom', () => {
    expect(
      rL([
        [80, 10],
        [20, 10],
        [0, 50],
        [20, 90],
        [80, 90],
        [80, 55],
      ]),
    ).toBe('g');
  });

  it('h — down, flat crossbar, down again', () => {
    expect(
      rL([
        [10, 0],
        [10, 100],
        [10, 50],
        [70, 50],
        [70, 100],
      ]),
    ).toBe('h');
  });

  it('i — narrow downstroke', () => {
    expect(
      rL([
        [50, 5],
        [50, 95],
      ]),
    ).toBe('i');
  });

  it('j — down-right then hook left', () => {
    expect(
      rL([
        [30, 5],
        [70, 5],
        [70, 80],
        [20, 95],
      ]),
    ).toBe('j');
  });

  it('k — down, sharp kick up, then down-right', () => {
    expect(
      rL([
        [10, 5],
        [10, 95],
        [10, 50],
        [60, 5],
        [60, 95],
      ]),
    ).toBe('k');
  });

  it('l — down then right', () => {
    expect(
      rL([
        [10, 5],
        [10, 90],
        [70, 90],
      ]),
    ).toBe('l');
  });

  it('m — two humps', () => {
    expect(
      rL([
        [0, 10],
        [0, 90],
        [0, 50],
        [40, 10],
        [40, 90],
        [40, 50],
        [80, 10],
        [80, 90],
      ]),
    ).toBe('m');
  });

  it('n — one hump', () => {
    expect(
      rL([
        [0, 10],
        [0, 90],
        [0, 50],
        [50, 10],
        [50, 90],
      ]),
    ).toBe('n');
  });

  it('o — closed circular loop', () => {
    // Approximate circle going clockwise
    expect(
      rL([
        [50, 0],
        [90, 30],
        [90, 70],
        [50, 100],
        [10, 70],
        [10, 30],
        [50, 0],
      ]),
    ).toBe('o');
  });

  it('p — down then bump upward, ends high on right', () => {
    expect(
      rL([
        [10, 10],
        [10, 90],
        [10, 45],
        [60, 20],
        [60, 10],
        [10, 10],
      ]),
    ).toBe('p');
  });

  it('q — loop with SE tail', () => {
    expect(
      rL([
        [50, 0],
        [10, 30],
        [10, 70],
        [50, 100],
        [90, 70],
        [90, 30],
        [50, 0],
        [80, 30],
      ]),
    ).toBe('q');
  });

  it('r — down then round NE bump, leg SE', () => {
    expect(
      rL([
        [10, 10],
        [10, 90],
        [10, 45],
        [50, 20],
        [70, 60],
      ]),
    ).toBe('r');
  });

  it('s — S-curve diagonal (NE then SW)', () => {
    expect(
      rL([
        [20, 80],
        [80, 20],
        [20, 80],
      ]),
    ).not.toBe(null); // s-curve
    expect(
      rL([
        [10, 80],
        [90, 10],
      ]),
    ).toBe('s'); // simplified NE stroke → s
  });

  it('t — crossbar from top then down', () => {
    expect(
      rL([
        [10, 10],
        [80, 10],
        [80, 90],
      ]),
    ).toBe('t');
  });

  it('u — cup: down, right, up, starts at top', () => {
    expect(
      rL([
        [10, 5],
        [10, 80],
        [50, 95],
        [90, 80],
        [90, 5],
      ]),
    ).toBe('u');
  });

  it('v — valley: down-right then up-right from top', () => {
    expect(
      rL([
        [10, 5],
        [50, 95],
        [90, 5],
      ]),
    ).toBe('v');
  });

  it('w — double valley', () => {
    expect(
      rL([
        [0, 5],
        [25, 95],
        [50, 5],
        [75, 95],
        [100, 5],
      ]),
    ).toBe('w');
  });

  it('x — crossing diagonal strokes', () => {
    expect(
      rL([
        [10, 10],
        [90, 90],
      ]),
    ).toBe('x'); // SE direction → x (NW-SE zigzag via SW-NE)
    expect(
      rL([
        [90, 10],
        [10, 90],
      ]),
    ).toBe('x'); // SW direction
  });

  it('y — diagonal down to center then sweeps down', () => {
    expect(
      rL([
        [10, 5],
        [50, 55],
        [20, 95],
      ]),
    ).toBe('y');
  });

  it('z — top-right bar, diagonal down-left, bottom-right bar', () => {
    expect(
      rL([
        [10, 10],
        [80, 10],
        [10, 90],
        [80, 90],
      ]),
    ).toBe('z');
  });

  it('. — tiny dot', () => {
    expect(
      rL([
        [50, 50],
        [52, 51],
      ]),
    ).toBe('.');
  });

  it('space — wide horizontal rightward swipe', () => {
    expect(
      rL([
        [0, 50],
        [100, 50],
      ]),
    ).toBe(' ');
  });

  it('backspace — wide horizontal leftward swipe', () => {
    expect(
      rL([
        [100, 50],
        [0, 50],
      ]),
    ).toBe('\b');
  });

  it('enter — down then left (L-shape)', () => {
    expect(
      rL([
        [50, 5],
        [50, 70],
        [10, 70],
      ]),
    ).toBe('\n');
  });
});

// ── Numbers ───────────────────────────────────────────────────────────────────

describe('Integration — Numbers', () => {
  it('0 — closed oval', () => {
    expect(
      rN([
        [50, 0],
        [90, 30],
        [90, 70],
        [50, 100],
        [10, 70],
        [10, 30],
        [50, 0],
      ]),
    ).toBe('0');
  });

  it('1 — narrow downstroke', () => {
    expect(
      rN([
        [50, 5],
        [50, 95],
      ]),
    ).toBe('1');
  });

  it('2 — right bar, diagonal down-left, right bar', () => {
    expect(
      rN([
        [10, 10],
        [80, 10],
        [10, 90],
        [80, 90],
      ]),
    ).toBe('2');
  });

  it('3 — two rightward arcs', () => {
    expect(
      rN([
        [80, 10],
        [80, 50],
        [80, 90],
      ]),
    ).toBe('3'); // simplified: SE-NE from right
    expect(
      rN([
        [10, 10],
        [80, 50],
        [10, 90],
      ]),
    ).toBe('3');
  });

  it('4 — diagonal, left bar, downstroke', () => {
    expect(
      rN([
        [60, 5],
        [10, 70],
        [80, 70],
        [80, 95],
      ]),
    ).toBe('4');
  });

  it('5 — right bar, down, arc left', () => {
    expect(
      rN([
        [10, 10],
        [70, 10],
        [70, 55],
        [10, 90],
      ]),
    ).toBe('5');
  });

  it('6 — downstroke with loop at bottom', () => {
    expect(
      rN([
        [50, 5],
        [10, 50],
        [10, 80],
        [50, 100],
        [80, 80],
        [80, 60],
        [10, 60],
      ]),
    ).toBe('6');
  });

  it('7 — right bar from top then downstroke', () => {
    expect(
      rN([
        [10, 5],
        [80, 5],
        [80, 95],
      ]),
    ).toBe('7');
  });

  it('8 — double loop', () => {
    expect(
      rN([
        [50, 50],
        [80, 20],
        [50, 5],
        [20, 20],
        [50, 50],
        [80, 80],
        [50, 95],
        [20, 80],
        [50, 50],
      ]),
    ).toBe('8');
  });

  it('9 — circle then downstroke', () => {
    expect(
      rN([
        [50, 5],
        [80, 20],
        [80, 50],
        [50, 70],
        [20, 50],
        [20, 20],
        [50, 5],
        [50, 95],
      ]),
    ).toBe('9');
  });
});
