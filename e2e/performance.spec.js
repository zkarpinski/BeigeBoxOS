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
 * Budgets (with ~40% headroom above observed local values):
 *   DOMContentLoaded : < 2 000 ms
 *   load event       : < 5 000 ms
 *   First Paint      : < 1 000 ms
 *   First Contentful : < 1 500 ms
 *   Total JS         : < 450 KB  (parse/execute budget; binary assets excluded)
 *   Total CSS        : < 250 KB
 *   Single JS file   : < 50 KB
 */
const { test, expect } = require('@playwright/test');

async function loadPage(page) {
    await page.route('https://**', route => route.abort());
    await page.goto('/', { waitUntil: 'load' });
}

// ── Navigation timing ─────────────────────────────────────────────────────────
test('DOMContentLoaded and load event are within budget', async ({ page }) => {
    await loadPage(page);

    const timing = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0];
        return {
            domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
            load:             nav.loadEventEnd             - nav.startTime,
        };
    });

    expect(timing.domContentLoaded).toBeLessThan(2000);
    expect(timing.load).toBeLessThan(5000);
});

// ── Paint timing ──────────────────────────────────────────────────────────────
test('First Paint and First Contentful Paint are within budget', async ({ page }) => {
    await loadPage(page);

    // Give the browser a moment to record paint entries
    await page.waitForTimeout(300);

    const paints = await page.evaluate(() => {
        const result = {};
        performance.getEntriesByType('paint').forEach(e => {
            result[e.name] = e.startTime;
        });
        return result;
    });

    if (paints['first-paint'] !== undefined) {
        expect(paints['first-paint']).toBeLessThan(1000);
    }
    if (paints['first-contentful-paint'] !== undefined) {
        expect(paints['first-contentful-paint']).toBeLessThan(1500);
    }
});

// ── JS + CSS bytes transferred ────────────────────────────────────────────────
// Binary assets (audio, images) are intentionally excluded — they don't block
// parsing or execution and are already covered by static analysis in Jest.
// These limits match the budgets in test/perf-budget.test.js.
test('JS and CSS transfer sizes are within budget', async ({ page }) => {
    await loadPage(page);

    const { jsBytes, cssBytes, largestJs } = await page.evaluate(() => {
        const local = performance
            .getEntriesByType('resource')
            .filter(r => r.name.includes('localhost') && r.decodedBodySize > 0);

        const jsResources  = local.filter(r => r.name.endsWith('.js'));
        const cssResources = local.filter(r => r.name.endsWith('.css'));

        const jsBytes  = jsResources.reduce((s, r) => s + r.decodedBodySize, 0);
        const cssBytes = cssResources.reduce((s, r) => s + r.decodedBodySize, 0);
        const largestJs = jsResources.reduce(
            (max, r) => r.decodedBodySize > max.size ? { name: r.name, size: r.decodedBodySize } : max,
            { name: '', size: 0 }
        );
        return { jsBytes, cssBytes, largestJs };
    });

    // Total JS under 450 KB (parse + execute budget)
    expect(jsBytes).toBeLessThan(450 * 1024);

    // Total CSS under 250 KB (style recalc budget)
    expect(cssBytes).toBeLessThan(250 * 1024);

    // No single JS file over 50 KB
    expect(largestJs.size).toBeLessThan(50 * 1024);
});
