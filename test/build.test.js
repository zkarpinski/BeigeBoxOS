/**
 * Verify that every local CSS and JS file referenced in index.html
 * is registered in scripts/build.js (localCss / localScripts).
 *
 * Catches the class of bug where a new app's files are wired into
 * index.html but forgotten in the build script, causing the deployed
 * site to return 404s for those paths.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const buildSrc = fs.readFileSync(path.join(root, 'scripts/build.js'), 'utf8');

// Extract all string literals from localCss and localScripts arrays in build.js
const buildEntries = new Set(buildSrc.match(/'[^']+\.(css|js)'/g)?.map(s => s.slice(1, -1)) ?? []);

// Extract local <link href="...css"> paths from index.html (skip https:// CDN links)
const localCssRefs = [...html.matchAll(/<link[^>]+href="([^"]+\.css)"/g)]
  .map(m => m[1])
  .filter(href => !href.startsWith('http'));

// Extract local <script src="...js"> paths from index.html (skip https:// CDN links)
const localScriptRefs = [...html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)]
  .map(m => m[1])
  .filter(src => !src.startsWith('http'));

describe('build.js completeness', () => {
  test.each(localCssRefs)('CSS file "%s" is in localCss', (file) => {
    expect(buildEntries).toContain(file);
  });

  test.each(localScriptRefs)('JS file "%s" is in localScripts', (file) => {
    expect(buildEntries).toContain(file);
  });
});

describe('build.js file existence', () => {
  test.each([...buildEntries])('referenced file "%s" exists on disk', (file) => {
    expect(fs.existsSync(path.join(root, file))).toBe(true);
  });
});
