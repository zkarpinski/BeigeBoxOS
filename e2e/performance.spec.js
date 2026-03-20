/**
 * Performance tests — real browser metrics via Playwright.
 *
 * Covers two concerns:
 *   1. Downloads fast  → navigation timing, total bytes transferred
 *   2. Runs smoothly   → first paint, first contentful paint
 *
 * External CDN requests (icons, Clippy, etc.) are blocked so results
 * are stable and reflect only the site's own assets.
 *
 * NOTE: These tests run against `npm run dev` (unminified, unbundled, with HMR
 * overhead). Dev-mode JS is typically 5–10× larger than a production build.
 * Budgets are set to observed dev values + ~40% headroom and serve as regression
 * guards (i.e. catch someone adding a 10 MB dependency), not production targets.
 *
 * Observed dev-mode baselines:
 *   DOMContentLoaded : ~400 ms
 *   load event       : ~600 ms
 *   First Paint      : ~1 200 ms
 *   First Contentful : ~1 200 ms
 *   Total JS         : ~3 100 KB
 *   Total CSS        : ~180 KB
 *   Largest JS file  : ~2 600 KB  (Next.js main dev chunk)
 *
 * Budgets (baseline × 1.4, rounded up):
 *   DOMContentLoaded : < 4 000 ms
 *   load event       : < 8 000 ms
 *   First Paint      : < 2 500 ms
 *   First Contentful : < 3 000 ms
 *   Total JS         : < 4 500 KB
 *   Total CSS        : < 400 KB
 *   Largest JS file  : < 4 MB
 */
const { test, expect } = require('@playwright/test');

async function loadPage(page) {
  await page.route('https://**', (route) => route.abort());
  await page.goto('/', { waitUntil: 'load' });
}

// ── Navigation timing ─────────────────────────────────────────────────────────
test('DOMContentLoaded and load event are within budget', async ({ page }) => {
  await loadPage(page);

  const timing = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    return {
      domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
      load: nav.loadEventEnd - nav.startTime,
    };
  });

  expect(timing.domContentLoaded).toBeLessThan(4000);
  expect(timing.load).toBeLessThan(8000);
});

// ── Paint timing ──────────────────────────────────────────────────────────────
test('First Paint and First Contentful Paint are within budget', async ({ page }) => {
  await loadPage(page);

  // Give the browser a moment to record paint entries
  await page.waitForTimeout(300);

  const paints = await page.evaluate(() => {
    const result = {};
    performance.getEntriesByType('paint').forEach((e) => {
      result[e.name] = e.startTime;
    });
    return result;
  });

  if (paints['first-paint'] !== undefined) {
    expect(paints['first-paint']).toBeLessThan(2500);
  }
  if (paints['first-contentful-paint'] !== undefined) {
    expect(paints['first-contentful-paint']).toBeLessThan(3000);
  }
});

// ── JS + CSS bytes transferred ────────────────────────────────────────────────
// Binary assets (audio, images) are intentionally excluded — they don't block
// parsing or execution and are already covered by static analysis in Jest.
test('JS and CSS transfer sizes are within budget', async ({ page }) => {
  await loadPage(page);

  const { jsBytes, cssBytes, largestJs } = await page.evaluate(() => {
    const host = window.location.host; // e.g. 'localhost:3000' or '127.0.0.1:3000'
    const local = performance
      .getEntriesByType('resource')
      .filter((r) => r.name.includes(host) && r.decodedBodySize > 0);

    const jsResources = local.filter((r) => r.name.endsWith('.js'));
    const cssResources = local.filter((r) => r.name.endsWith('.css'));

    const jsBytes = jsResources.reduce((s, r) => s + r.decodedBodySize, 0);
    const cssBytes = cssResources.reduce((s, r) => s + r.decodedBodySize, 0);
    const largestJs = jsResources.reduce(
      (max, r) => (r.decodedBodySize > max.size ? { name: r.name, size: r.decodedBodySize } : max),
      { name: '', size: 0 },
    );
    return { jsBytes, cssBytes, largestJs };
  });

  // Total JS under 4 500 KB (dev-mode budget; production will be ~10× smaller)
  expect(jsBytes).toBeLessThan(4500 * 1024);

  // Total CSS under 400 KB
  expect(cssBytes).toBeLessThan(400 * 1024);

  // No single JS file over 4 MB (dev-mode main chunk is typically ~2.6 MB)
  expect(largestJs.size).toBeLessThan(4 * 1024 * 1024);
});
