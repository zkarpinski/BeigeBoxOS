import { recognizeLetter, recognizeNumber, StrokeFeatures } from './graffitiRecognizer';

function f(seq: string, overrides: Partial<StrokeFeatures> = {}): StrokeFeatures {
  return {
    seq,
    dirs: seq.split('-') as any,
    ratio: 1.0,
    closed: false,
    sX: 0.5,
    sY: 0.5,
    eX: 0.5,
    eY: 0.5,
    len: 100,
    bboxW: 50,
    bboxH: 50,
    ...overrides,
  };
}

describe('Graffiti Recognizer — Letters', () => {
  it('a — tent from bottom: NE then SE, start low', () => {
    expect(recognizeLetter(f('NE-SE', { sY: 0.8 }))).toBe('a');
    expect(recognizeLetter(f('NE-S', { sY: 0.7 }))).toBe('a');
    expect(recognizeLetter(f('N-S', { sY: 0.8 }))).toBe('a');
  });

  it('b — down with two right bumps', () => {
    expect(recognizeLetter(f('S-NE-SE-NE-SE'))).toBe('b');
    expect(recognizeLetter(f('S-E-N-E-S'))).toBe('b');
  });

  it('c — leftward arc, start right-of-center', () => {
    // Single 'SW' with ratio 0.5–1.5 now goes to X (single-slash shortcut); use multi-dir patterns
    expect(recognizeLetter(f('NW-SW', { closed: false }))).toBe('c');
    expect(recognizeLetter(f('W-SW', { closed: false }))).toBe('c');
    expect(recognizeLetter(f('W-S', { closed: false }))).toBe('c');
  });

  it('d — down then arc back up, ends high', () => {
    expect(recognizeLetter(f('S-E-N', { eY: 0.2 }))).toBe('d');
    expect(recognizeLetter(f('S-NE-N', { eY: 0.3 }))).toBe('d');
    expect(recognizeLetter(f('SE-NE-N', { eY: 0.2 }))).toBe('d');
  });

  it('e — rightward then arc back (epsilon)', () => {
    expect(recognizeLetter(f('W-SE'))).toBe('e'); // ends SE, not -E, so G doesn't catch it
    expect(recognizeLetter(f('W-SE-W-SE'))).toBe('e'); // epsilon repeat
    expect(recognizeLetter(f('W-SW-W-SW'))).toBe('e'); // ends SW, not -E
    // 'W-S-E', 'W-SW-E', 'NW-SW-E', 'NW-S-E' all go to G (startsWith W/NW + endsWith -E)
  });

  it('f — crossbar then down, wide aspect (taller than wide)', () => {
    // T/F now split by ratio: T = ratio < 1.0 (wider), F = ratio >= 1.0 (taller)
    expect(recognizeLetter(f('E-S', { ratio: 1.2 }))).toBe('f');
    expect(recognizeLetter(f('E-SW', { ratio: 1.5 }))).toBe('f');
  });

  it('g — C-arc with rightward bar at bottom', () => {
    expect(recognizeLetter(f('SW-S-E', { sX: 0.7 }))).toBe('g');
    expect(recognizeLetter(f('NW-SW-E', { sX: 0.7 }))).toBe('g');
  });

  it('h — down, flat crossbar, down again', () => {
    expect(recognizeLetter(f('S-E-S', { ratio: 0.8, eY: 0.7 }))).toBe('h');
    expect(recognizeLetter(f('SE-E-SE', { ratio: 0.8, eY: 0.7 }))).toBe('h');
  });

  it('i — narrow downstroke', () => {
    expect(recognizeLetter(f('S', { ratio: 0.3 }))).toBe('i');
    expect(recognizeLetter(f('SE', { ratio: 0.4 }))).toBe('i');
    // 'SW' at ratio < 0.5 → C (no sX guard on C); at 0.5–1.5 → X (single-slash shortcut)
  });

  it('j — down then hook left, ends left-of-center', () => {
    // 'S-SW', 'S-SW-W', 'SE-S-W' are in Enter (checked first); safe J patterns are 'S-NW' / 'E-S-W'
    expect(recognizeLetter(f('S-NW', { eX: 0.2 }))).toBe('j');
    expect(recognizeLetter(f('E-S-W', { eX: 0.3 }))).toBe('j');
  });

  it('k — down, sharp straight-up kick, then down-right', () => {
    expect(recognizeLetter(f('S-N-SE'))).toBe('k');
    expect(recognizeLetter(f('SW-SE'))).toBe('k');
    // 'W-SE' removed from K — conflicts with E (letter)
  });

  it('l — down then right, ends low', () => {
    expect(recognizeLetter(f('S-E', { eY: 0.9 }))).toBe('l');
    expect(recognizeLetter(f('S-SE-E', { eY: 0.8 }))).toBe('l');
  });

  it('m — two humps', () => {
    expect(recognizeLetter(f('S-NE-S-NE-S'))).toBe('m');
    expect(recognizeLetter(f('SE-NE-SE-NE-SE'))).toBe('m');
  });

  it('n — one hump (down-up-down)', () => {
    expect(recognizeLetter(f('S-NE-S'))).toBe('n');
    expect(recognizeLetter(f('SE-NE-SE'))).toBe('n');
    // 'S-NE-SE' removed from N — goes to R (leg ends going SE, not straight down)
  });

  it('o — closed loop', () => {
    expect(recognizeLetter(f('W-S-E-N', { closed: true, ratio: 1.0 }))).toBe('o');
    expect(recognizeLetter(f('SE-SW-NW-NE', { closed: true, ratio: 0.9 }))).toBe('o');
  });

  it('p — down then bump up, ends high', () => {
    expect(recognizeLetter(f('S-NE', { eY: 0.3 }))).toBe('p');
    expect(recognizeLetter(f('S-E-NE', { eY: 0.4 }))).toBe('p');
  });

  it('q — loop with SE tail', () => {
    expect(recognizeLetter(f('W-S-E-N-SE'))).toBe('q');
    expect(recognizeLetter(f('NW-SW-SE-NE-SE'))).toBe('q');
  });

  it('r — down, round NE bump, leg SE (was blocked by k before fix)', () => {
    expect(recognizeLetter(f('S-NE-SE'))).toBe('r');
    expect(recognizeLetter(f('S-E-SE'))).toBe('r');
    expect(recognizeLetter(f('S-E-NE-SE'))).toBe('r');
  });

  it('s — S-curve diagonal', () => {
    expect(recognizeLetter(f('NE-SW', { closed: false }))).toBe('s');
    expect(recognizeLetter(f('E-S-W', { closed: false }))).toBe('s');
    // 'NE-S' removed from S — A is checked first (sY > 0.4 easily satisfied)
  });

  it('t — crossbar then down, starts at top', () => {
    expect(recognizeLetter(f('E-S', { sY: 0.2, ratio: 0.8 }))).toBe('t');
    expect(recognizeLetter(f('E-SE', { sY: 0.1, ratio: 0.8 }))).toBe('t');
  });

  it('u — cup shape: down, right, up, starts at top', () => {
    expect(recognizeLetter(f('S-E-N', { sY: 0.1 }))).toBe('u');
    expect(recognizeLetter(f('S-SE-NE', { sY: 0.2 }))).toBe('u');
  });

  it('v — valley: SE then NE, starts at top', () => {
    expect(recognizeLetter(f('SE-NE', { sY: 0.1 }))).toBe('v');
    expect(recognizeLetter(f('S-NE', { sY: 0.2 }))).toBe('v'); // sY < 0.5, not caught by P (eY would be high)
  });

  it('w — double valley', () => {
    expect(recognizeLetter(f('SE-NE-SE-NE'))).toBe('w');
    expect(recognizeLetter(f('S-NE-SE-NE'))).toBe('w');
    expect(recognizeLetter(f('S-NE-S-NE'))).toBe('w');
  });

  it('x — crossing diagonals', () => {
    expect(recognizeLetter(f('NW-SE'))).toBe('x');
    expect(recognizeLetter(f('SE-NW'))).toBe('x');
    expect(recognizeLetter(f('SW-NE'))).toBe('x');
  });

  it('y — diagonal down to center then sweeps down', () => {
    expect(recognizeLetter(f('SE-S', { eY: 0.9, closed: false }))).toBe('y');
    // SE-SW with eX=0.5 avoids J (needs eX<0.5) and reaches Y (eY>0.6 guard)
    expect(recognizeLetter(f('SE-SW', { eX: 0.5, eY: 0.8, closed: false }))).toBe('y');
    // NE-SW goes to S (S is before Y) — not a valid Y pattern
  });

  it('z — zigzag E–SW–E', () => {
    expect(recognizeLetter(f('E-SW-E'))).toBe('z');
    expect(recognizeLetter(f('E-S-E'))).toBe('z');
    expect(recognizeLetter(f('NE-SW-E'))).toBe('z');
  });

  it('. — tiny dot', () => {
    expect(recognizeLetter(f('S', { len: 5, bboxW: 4, bboxH: 4 }))).toBe('.');
  });

  it('space — wide rightward swipe', () => {
    expect(recognizeLetter(f('E', { ratio: 2.5 }))).toBe(' ');
    expect(recognizeLetter(f('NE', { ratio: 2.0 }))).toBe(' ');
  });

  it('backspace — wide leftward swipe', () => {
    expect(recognizeLetter(f('W', { ratio: 2.5 }))).toBe('\b');
    expect(recognizeLetter(f('NW', { ratio: 2.0 }))).toBe('\b');
  });

  it('enter — down then left (L-shape)', () => {
    expect(recognizeLetter(f('S-W'))).toBe('\n');
    expect(recognizeLetter(f('S-SW'))).toBe('\n');
  });
});

describe('Graffiti Recognizer — k vs r disambiguation (regression)', () => {
  it('S-N-SE → k (sharp kick)', () => {
    expect(recognizeLetter(f('S-N-SE'))).toBe('k');
  });

  it('S-NE-SE → r (round bump), no longer blocked by k or n', () => {
    expect(recognizeLetter(f('S-NE-SE'))).toBe('r');
  });

  it('S-E-S → h (flat crossbar), no longer blocked by n', () => {
    expect(recognizeLetter(f('S-E-S', { ratio: 0.8, eY: 0.7 }))).toBe('h');
  });

  it('S-NE-S → n (still wins for curved hump)', () => {
    expect(recognizeLetter(f('S-NE-S'))).toBe('n');
  });
});

describe('Graffiti Recognizer — Numbers', () => {
  it('0 — circle', () => {
    expect(recognizeNumber(f('W-S-E-N', { closed: true, ratio: 0.9 }))).toBe('0');
  });

  it('1 — narrow downstroke', () => {
    expect(recognizeNumber(f('S', { ratio: 0.2 }))).toBe('1');
    expect(recognizeNumber(f('SE', { ratio: 0.4 }))).toBe('1');
  });

  it('2 — Z-shape for 2', () => {
    expect(recognizeNumber(f('E-SW-E'))).toBe('2');
    expect(recognizeNumber(f('NE-SW-E'))).toBe('2');
  });

  it('3 — two arcs opening right, start right-of-center', () => {
    expect(recognizeNumber(f('SE-NE', { sX: 0.8 }))).toBe('3');
    expect(recognizeNumber(f('SE-NE-SE', { sX: 0.7 }))).toBe('3');
  });

  it('4 — diagonal, left, down', () => {
    expect(recognizeNumber(f('SE-W-S'))).toBe('4');
    expect(recognizeNumber(f('SE-SW-S'))).toBe('4');
  });

  it('5 — right, down, arc left', () => {
    expect(recognizeNumber(f('E-S-W'))).toBe('5');
    expect(recognizeNumber(f('E-SW-NW'))).toBe('5');
  });

  it('6 — downward arc with loop', () => {
    expect(recognizeNumber(f('S-E-N-W'))).toBe('6');
    expect(recognizeNumber(f('S-SE-NE-NW'))).toBe('6');
  });

  it('7 — right then down, starts at top', () => {
    expect(recognizeNumber(f('E-S', { sY: 0.1 }))).toBe('7');
    expect(recognizeNumber(f('E-SW', { sY: 0.2 }))).toBe('7');
  });

  it('8 — double loop', () => {
    expect(recognizeNumber(f('NE-SW-SE-NW'))).toBe('8');
    expect(recognizeNumber(f('SE-NW-SW-NE'))).toBe('8');
  });

  it('9 — circle then downstroke', () => {
    expect(recognizeNumber(f('S-NE-N-NW-SW'))).toBe('9');
    expect(recognizeNumber(f('NE-N-NW-SW-S'))).toBe('9');
  });

  it('. — tiny dot', () => {
    expect(recognizeNumber(f('S', { len: 5, bboxW: 4, bboxH: 4 }))).toBe('.');
  });

  it('space/backspace/enter work on number side too', () => {
    expect(recognizeNumber(f('E', { ratio: 2.5 }))).toBe(' ');
    expect(recognizeNumber(f('W', { ratio: 2.5 }))).toBe('\b');
    expect(recognizeNumber(f('S-W'))).toBe('\n');
  });
});
