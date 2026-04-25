import {
  extractFeatures,
  recognizeLetter,
  recognizeNumber,
  Point,
} from '../app/utils/graffitiRecognizer';

function makeStroke(pts: [number, number][]): Point[] {
  return pts.map(([x, y]) => ({ x, y }));
}

const tests = {
  a: makeStroke([
    [0, 100],
    [50, 0],
    [100, 100],
  ]),
  b: makeStroke([
    [0, 0],
    [0, 100],
    [0, 50],
    [50, 50],
    [50, 100],
    [0, 100],
  ]), // simplified
  c: makeStroke([
    [100, 0],
    [0, 0],
    [0, 100],
    [100, 100],
  ]),
  d: makeStroke([
    [0, 0],
    [0, 100],
    [100, 100],
    [100, 0],
    [0, 0],
  ]),
  e: makeStroke([
    [100, 10],
    [0, 10],
    [0, 50],
    [100, 50],
    [0, 50],
    [0, 100],
    [100, 100],
  ]),
  // space: left to right
  space: makeStroke([
    [0, 50],
    [100, 50],
  ]),
  // backspace: right to left
  backspace: makeStroke([
    [100, 50],
    [0, 50],
  ]),
};

for (const [name, pts] of Object.entries(tests)) {
  const feats = extractFeatures(pts);
  const result = recognizeLetter(feats);
  console.log(
    `${name}: recognized as '${result}' (seq: ${feats.seq}, ratio: ${feats.ratio.toFixed(2)})`,
  );
}
