#!/usr/bin/env node
/**
 * Captures a screenshot of every Space Trader screen and saves them to
 * docs/images/<screen title>.png.
 *
 * Usage:
 *   node scripts/capture-screenshots.js
 *
 * Requires a running PalmOS dev server (pnpm dev:palmos from the monorepo root).
 * Override the URL with: PALMOS_URL=http://localhost:3001 node scripts/capture-screenshots.js
 */

const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.PALMOS_URL || 'http://localhost:3000';
const OUTPUT_DIR = path.join(__dirname, '..', 'docs', 'images');

async function capture(page, name) {
  const el = page.locator('.palm-screen').first();
  await el.waitFor({ state: 'visible', timeout: 5000 });
  const filePath = path.join(OUTPUT_DIR, `${name}.png`);
  await el.screenshot({ path: filePath });
  console.log(`  ✓ ${name}.png`);
}

/** Click a menu item in the PalmHeader dropdown. */
async function menuNavigate(page, itemText) {
  await page.locator('.palm-header-title').click();
  await page.waitForSelector('.palm-dropdown-list', { timeout: 3000 });
  await page.locator('.palm-dropdown-item', { hasText: itemText }).first().click();
}

/** Dismiss any pending encounters so the game can continue.
 *  Prefers safe actions (no ship damage risk): Done > Ignore > Surrender > Submit > Flee.
 */
async function dismissEncounters(page) {
  const actionOrder = ['Done', 'Loot', 'Ignore', 'Surrender', 'Submit', 'Flee', 'Attack'];
  while (true) {
    try {
      await page.waitForSelector('text=Encounter!', { timeout: 3000 });
      let dismissed = false;
      for (const label of actionOrder) {
        const btn = page.locator(`button:has-text("${label}")`).first();
        if (await btn.isVisible({ timeout: 500 }).catch(() => false)) {
          await btn.click();
          dismissed = true;
          break;
        }
      }
      if (!dismissed) break;
    } catch {
      break; // no more encounters
    }
  }
}

/** After travel, wait for the trade view or handle a Game Over by restarting. */
async function waitForTradeView(page) {
  // tradeMode may be 'buy' or 'sell' — match the trade table which is present in both
  await Promise.race([
    page.waitForSelector('.trade-table-authentic', { timeout: 25000 }),
    page.waitForSelector('text=Game Over', { timeout: 25000 }),
  ]).catch(() => {});

  if (
    await page
      .locator('text=Game Over')
      .isVisible()
      .catch(() => false)
  ) {
    console.log('  ⚠ Game Over — restarting...');
    await page.locator('.palm-header-title').click();
    await page.waitForSelector('.palm-dropdown-list', { timeout: 3000 });
    await page.locator('.palm-dropdown-tab', { hasText: 'Game' }).click();
    await page.locator('.palm-dropdown-item', { hasText: 'New Game' }).click();
    await page.waitForSelector('text=Skill Points', { timeout: 10000 });
    await page.click('text=Start Trading', { force: true });
    await page.waitForSelector('.trade-table-authentic', { timeout: 10000 });
  }
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log(`Launching browser → ${BASE_URL}`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  try {
    // ── Setup ──────────────────────────────────────────────────────────────
    await page.goto(BASE_URL);
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('text=Address', { timeout: 30000 });

    // Open Space Trader from the PalmOS launcher
    await page.click('text=Space Trader', { force: true });
    await page.waitForSelector('text=Skill Points', { timeout: 15000 });

    // ── 1. New Game ────────────────────────────────────────────────────────
    console.log('\nCapturing screens:');
    await capture(page, 'Space Trader');

    // Start the game
    await page.click('text=Start Trading', { force: true });
    await page.waitForSelector('text=Buy Cargo', { timeout: 10000 });

    // ── 2. Buy Cargo ───────────────────────────────────────────────────────
    await capture(page, 'Buy Cargo');

    // ── 3. Sell Cargo ──────────────────────────────────────────────────────
    await page.locator('button', { hasText: /^S$/ }).click({ force: true });
    await page.waitForSelector('text=Sell Cargo');
    await capture(page, 'Sell Cargo');

    // ── 4. Short Range Chart ───────────────────────────────────────────────
    await page.locator('button', { hasText: /^W$/ }).click({ force: true });
    await page.waitForSelector('text=Short Range Chart');
    await capture(page, 'Short Range Chart');

    // ── 5. Target System (click first map dot) ─────────────────────────────
    // The Average Price List button only appears for in-range systems, so find
    // an in-range dot by trying each one until that button is visible.
    await page.locator('button', { hasText: /^W$/ }).click({ force: true });
    await page.waitForSelector('text=Short Range Chart');

    const dots = page.locator('.map-dot');
    await dots.first().waitFor({ state: 'visible', timeout: 10000 });
    const dotCount = await dots.count();

    let inRangeDotFound = false;
    for (let i = 0; i < dotCount; i++) {
      await dots.nth(i).dispatchEvent('click');
      await page.waitForSelector('text=Target System', { timeout: 5000 });

      const priceListBtn = page.locator('button', { hasText: 'Average Price List' });
      if (await priceListBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        inRangeDotFound = true;
        break;
      }
      // Out of range — go back to map and try the next dot
      await page.locator('button', { hasText: /^W$/ }).click({ force: true });
      await page.waitForSelector('text=Short Range Chart');
    }

    await capture(page, 'Target System');

    // ── 6. Average Price List (button on Target System screen) ─────────────
    if (!inRangeDotFound) {
      console.log('  ⚠ Average Price List.png skipped (no in-range system found)');
    } else {
      await page.locator('button', { hasText: 'Average Price List' }).click();
      await page.waitForSelector('text=Average Price List');
      await capture(page, 'Average Price List');
    }

    // ── 7. Encounter (best-effort — triggered by warping) ──────────────────
    // Encounters are random; warp several times to try to trigger one.
    let encounterCaptured = false;
    for (let attempt = 0; attempt < 8 && !encounterCaptured; attempt++) {
      // Go to map
      await page.locator('button', { hasText: /^W$/ }).click({ force: true });
      await page.waitForSelector('text=Short Range Chart');

      // Find an in-range system: try each dot, returning to map between attempts
      let foundWarpTarget = false;
      const dotCount = await page.locator('.map-dot').count();
      for (let d = 0; d < dotCount; d++) {
        await page.locator('.map-dot').nth(d).dispatchEvent('click');
        await page.waitForSelector('text=Target System', { timeout: 3000 }).catch(() => {});
        const warpVisible = await page
          .locator('button', { hasText: 'Warp' })
          .isVisible({ timeout: 1000 })
          .catch(() => false);
        if (warpVisible) {
          foundWarpTarget = true;
          break;
        }
        // Not in range — back to map
        await page.locator('button', { hasText: /^W$/ }).click({ force: true });
        await page.waitForSelector('text=Short Range Chart');
      }
      if (!foundWarpTarget) break;

      await page.locator('button', { hasText: 'Warp' }).click();

      try {
        await page.waitForSelector('text=Encounter!', { timeout: 5000 });
        await capture(page, 'Encounter');
        encounterCaptured = true;
      } catch {
        // No encounter this trip
      }

      await dismissEncounters(page);
      // Wait for PalmStatusBar shortcuts to re-appear (they're hidden during encounters)
      await page
        .locator('button', { hasText: /^W$/ })
        .waitFor({ state: 'visible', timeout: 15000 });
    }

    if (!encounterCaptured) {
      console.log('  ⚠ Encounter.png skipped (no encounter appeared in 5 trips)');
    }

    // ── 8. Ship Yard ───────────────────────────────────────────────────────
    await page.locator('button', { hasText: /^Y$/ }).click({ force: true });
    await page.waitForSelector('text=Ship Yard');
    await capture(page, 'Ship Yard');

    // ── 9. Buy Ship ────────────────────────────────────────────────────────
    await page.locator('button', { hasText: 'View Ship Info' }).click();
    await page.waitForSelector('text=Buy Ship');
    await capture(page, 'Buy Ship');

    // ── 10. Ship Information ───────────────────────────────────────────────
    await page.locator('button', { hasText: 'Info' }).first().click();
    await page.waitForSelector('text=Ship Information');
    await capture(page, 'Ship Information');

    // ── 11. System Info (menu) ─────────────────────────────────────────────
    await menuNavigate(page, 'System Information');
    await page.waitForSelector('text=System Info');
    await capture(page, 'System Info');

    // ── 12. Commander Status (menu) ────────────────────────────────────────
    await menuNavigate(page, 'Commander Status');
    await page.waitForSelector('text=Commander Status');
    await capture(page, 'Commander Status');

    // ── 13. Equipment (menu) ───────────────────────────────────────────────
    await menuNavigate(page, 'Buy Equipment');
    await page.waitForSelector('text=Equipment');
    await capture(page, 'Equipment');
  } finally {
    await browser.close();
  }

  const files = fs.readdirSync(OUTPUT_DIR).filter((f) => f.endsWith('.png'));
  console.log(`\nDone! ${files.length} screenshot(s) saved to:\n  ${OUTPUT_DIR}`);
}

main().catch((err) => {
  console.error('\nFailed:', err.message);
  process.exit(1);
});
