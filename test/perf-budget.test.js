/**
 * Performance budget tests — file size checks.
 *
 * Runs without a server; reads files directly from disk.
 * Catches accidental bloat before it ships.
 *
 * Budgets are set ~40% above current sizes so normal feature
 * work passes but large regressions are flagged immediately.
 *
 * Current baselines (unminified):
 *   Total JS  : ~305 KB   budget: 450 KB
 *   Total CSS : ~155 KB   budget: 250 KB
 *   index.html: ~164 KB   budget: 250 KB
 *   Grand total: ~624 KB  budget: 900 KB
 */
const fs   = require('fs');
const path = require('path');

const root     = path.resolve(__dirname, '..');
const buildSrc = fs.readFileSync(path.join(root, 'scripts/build.js'), 'utf8');

const jsFiles  = [...buildSrc.matchAll(/'([^']+\.js)'/g)].map(m => m[1]).filter(f => fs.existsSync(path.join(root, f)));
const cssFiles = [...buildSrc.matchAll(/'([^']+\.css)'/g)].map(m => m[1]).filter(f => fs.existsSync(path.join(root, f)));

const KB = 1024;

// ── Limits ────────────────────────────────────────────────────────────────────
const PER_JS_LIMIT    = 50  * KB;   // no single JS file should exceed 50 KB
const PER_CSS_LIMIT   = 50  * KB;   // no single CSS file should exceed 50 KB
const TOTAL_JS_LIMIT  = 450 * KB;
const TOTAL_CSS_LIMIT = 250 * KB;
const HTML_LIMIT      = 250 * KB;
const TOTAL_LIMIT     = 900 * KB;

function size(rel) {
    return fs.statSync(path.join(root, rel)).size;
}

// ── Per-file JS ───────────────────────────────────────────────────────────────
describe('JS per-file budget', () => {
    test.each(jsFiles)('%s < 50 KB', (file) => {
        const bytes = size(file);
        expect(bytes).toBeLessThan(PER_JS_LIMIT);
    });
});

// ── Per-file CSS ──────────────────────────────────────────────────────────────
describe('CSS per-file budget', () => {
    test.each(cssFiles)('%s < 50 KB', (file) => {
        const bytes = size(file);
        expect(bytes).toBeLessThan(PER_CSS_LIMIT);
    });
});

// ── Totals ────────────────────────────────────────────────────────────────────
describe('total payload budgets', () => {
    test('total JS < 450 KB', () => {
        const total = jsFiles.reduce((s, f) => s + size(f), 0);
        expect(total).toBeLessThan(TOTAL_JS_LIMIT);
    });

    test('total CSS < 250 KB', () => {
        const total = cssFiles.reduce((s, f) => s + size(f), 0);
        expect(total).toBeLessThan(TOTAL_CSS_LIMIT);
    });

    test('index.html < 250 KB', () => {
        expect(size('index.html')).toBeLessThan(HTML_LIMIT);
    });

    test('grand total (JS + CSS + HTML) < 900 KB', () => {
        const js   = jsFiles.reduce((s, f) => s + size(f), 0);
        const css  = cssFiles.reduce((s, f) => s + size(f), 0);
        const html = size('index.html');
        expect(js + css + html).toBeLessThan(TOTAL_LIMIT);
    });
});
