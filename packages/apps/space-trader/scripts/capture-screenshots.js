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

// Current view title, maintained so we can click it to open the menu
let currentTitle = 'Buy Cargo';

async function capture(page, name) {
  const el = page.locator('.palm-screen').first();
  await el.waitFor({ state: 'visible', timeout: 5000 });
  const filePath = path.join(OUTPUT_DIR, `${name}.png`);
  await el.screenshot({ path: filePath });
  console.log(`  ✓ ${name}.png`);
}

/** Open the menu by going to Buy Cargo first (unambiguous title), then click an item. */
async function menuNavigate(page, itemText) {
  // Go to Buy Cargo so we have a unique title to click
  await shortcut(page, 'B');
  await page.waitForTimeout(300);
  await page.getByText('Buy Cargo').first().click();
  await page.waitForTimeout(300);
  await page.getByText(itemText, { exact: false }).first().click();
  await page.waitForTimeout(300);
}

/** Open the menu via Buy Cargo, switch to a tab, then click an item. */
async function menuNavigateTab(page, tabName, itemText) {
  await shortcut(page, 'B');
  await page.waitForTimeout(300);
  await page.getByText('Buy Cargo').first().click();
  await page.waitForTimeout(300);
  await page.getByText(tabName).first().click();
  await page.waitForTimeout(200);
  await page.getByText(itemText).first().click();
  await page.waitForTimeout(300);
}

/** Click one of the B/S/Y/W shortcut buttons in the header. */
async function shortcut(page, letter) {
  await page
    .locator('button')
    .filter({ hasText: new RegExp(`^${letter}$`) })
    .first()
    .click({ force: true });
}

/** Dismiss any pending encounters so the game can continue. */
async function dismissEncounters(page) {
  const actionOrder = ['Done', 'Loot', 'Ignore', 'Surrender', 'Submit', 'Flee', 'Attack'];
  while (true) {
    try {
      await page.waitForSelector('text=Encounter', { timeout: 3000 });
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
      break;
    }
  }
}

/** After travel, wait for the trade view or handle a Game Over by restarting. */
async function waitForTradeView(page) {
  await Promise.race([
    page.waitForSelector('.trade-table-authentic', { timeout: 15000 }),
    page.waitForSelector('text=DEFEAT', { timeout: 15000 }),
    page.waitForSelector('text=Congratulations', { timeout: 15000 }),
  ]).catch(() => {});

  const isGameOver =
    (await page
      .locator('text=DEFEAT')
      .isVisible()
      .catch(() => false)) ||
    (await page
      .locator('text=Congratulations')
      .isVisible()
      .catch(() => false));

  if (isGameOver) {
    console.log('  ⚠ Game Over — restarting…');
    await page.locator('button:has-text("New Game")').click({ force: true });
    await page.waitForSelector('text=Skill Points', { timeout: 10000 });
    await page.locator('button:has-text("OK")').click({ force: true });
    await page.waitForSelector('.trade-table-authentic', { timeout: 10000 });
  }
  currentTitle = 'Buy Cargo';
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

    // ── 1. New Commander ─────────────────────────────────────────────────
    console.log('\nCapturing screens:');
    await capture(page, 'New Commander');

    // Start the game
    await page.locator('button:has-text("OK")').click({ force: true });
    await page.waitForSelector('.trade-table-authentic', { timeout: 10000 });
    currentTitle = 'Buy Cargo';

    // ── 2. Buy Cargo ───────────────────────────────────────────────────────
    await capture(page, 'Buy Cargo');

    // ── 3. Sell Cargo ──────────────────────────────────────────────────────
    await shortcut(page, 'S');
    await page.waitForTimeout(300);
    currentTitle = 'Sell Cargo';
    await capture(page, 'Sell Cargo');

    // ── 4. System Info (menu) ────────────────────────────────────────────
    await menuNavigate(page, 'System Information');
    currentTitle = 'System Info';
    await capture(page, 'System Info');

    // ── 5. News (from System Info) ───────────────────────────────────────
    try {
      await page.locator('button:has-text("News")').click();
      await page.waitForTimeout(500);
      await capture(page, 'News');
      await page.locator('button:has-text("Done")').click();
      await page.waitForTimeout(300);
      currentTitle = 'System Info';
    } catch {
      console.log('  ⚠ News.png skipped');
    }

    // ── 6. Bank (from System Info) ──────────────────────────────────────
    try {
      await page.locator('button:has-text("Bank")').click();
      await page.waitForTimeout(500);
      await capture(page, 'Bank');
      // Bank hides shortcuts — go back to System Info
      await page.locator('button:has-text("Done")').click();
      await page.waitForTimeout(300);
    } catch {
      console.log('  ⚠ Bank.png skipped');
    }

    // ── 7. Commander Status (menu) ──────────────────────────────────────
    await menuNavigate(page, 'Commander Status');
    currentTitle = 'Commander Status';
    await capture(page, 'Commander Status');

    // ── 8. Equipment (menu) ─────────────────────────────────────────────
    await menuNavigate(page, 'Buy Equipment');
    currentTitle = 'Equipment';
    await capture(page, 'Equipment');

    // ── 9. Ship Yard ────────────────────────────────────────────────────
    await shortcut(page, 'Y');
    await page.waitForTimeout(300);
    currentTitle = 'Ship Yard';
    await capture(page, 'Ship Yard');

    // ── 10. Buy Ship ─────────────────────────────────────────────────────
    try {
      await page.locator('button:has-text("View Ship Info")').click();
      await page.waitForTimeout(500);
      await capture(page, 'Buy Ship');

      // ── 11. Ship Information ───────────────────────────────────────────
      await page.locator('button:has-text("Info")').first().click();
      await page.waitForTimeout(500);
      await capture(page, 'Ship Information');
      // Ship Information is modal — go back to Buy Ship
      await page.locator('button:has-text("Ship For Sale List")').click();
      await page.waitForTimeout(300);
    } catch {
      console.log('  ⚠ Buy Ship / Ship Information skipped');
    }

    // ── 12. Personnel Roster (menu) ─────────────────────────────────────
    try {
      await menuNavigate(page, 'Personnel Roster');
      await page.waitForTimeout(300);
      await capture(page, 'Personnel Roster');
    } catch {
      console.log('  ⚠ Personnel Roster.png skipped');
    }

    // ── 13. Short Range Chart ───────────────────────────────────────────
    await shortcut(page, 'W');
    await page.waitForTimeout(300);
    currentTitle = 'Short Range Chart';
    await capture(page, 'Short Range Chart');

    // ── 14. Target System ───────────────────────────────────────────────
    const dots = page.locator('.map-dot');
    await dots.first().waitFor({ state: 'visible', timeout: 10000 });
    const dotCount = await dots.count();

    let inRangeDotFound = false;
    for (let i = 0; i < dotCount; i++) {
      await dots.nth(i).dispatchEvent('click');
      await page.waitForTimeout(300);
      const priceListBtn = page.locator('button:has-text("Average Price List")');
      if (await priceListBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        inRangeDotFound = true;
        break;
      }
      await shortcut(page, 'W');
      await page.waitForTimeout(300);
    }

    currentTitle = 'Target System';
    await capture(page, 'Target System');

    // ── 15. Average Price List ──────────────────────────────────────────
    if (!inRangeDotFound) {
      console.log('  ⚠ Average Price List.png skipped (no in-range system found)');
    } else {
      await page.locator('button:has-text("Average Price List")').click();
      await page.waitForTimeout(500);
      currentTitle = 'Average Price List';
      await capture(page, 'Average Price List');
    }

    // ── 16. Encounter (best-effort — triggered by warping) ──────────────
    let encounterCaptured = false;
    for (let attempt = 0; attempt < 10 && !encounterCaptured; attempt++) {
      await shortcut(page, 'W');
      await page.waitForTimeout(300);

      let foundWarpTarget = false;
      const warpDotCount = await page.locator('.map-dot').count();
      for (let d = 0; d < warpDotCount; d++) {
        await page.locator('.map-dot').nth(d).dispatchEvent('click');
        await page.waitForTimeout(300);
        const warpBtn = page.locator('button:has-text("Warp")');
        if (await warpBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
          foundWarpTarget = true;
          break;
        }
        await shortcut(page, 'W');
        await page.waitForTimeout(300);
      }
      if (!foundWarpTarget) break;

      await page.locator('button:has-text("Warp")').click();

      try {
        await page.waitForSelector('text=Encounter', { timeout: 5000 });
        await capture(page, 'Encounter');
        encounterCaptured = true;
      } catch {
        // No encounter this trip
      }

      await dismissEncounters(page);
      await waitForTradeView(page);
    }

    if (!encounterCaptured) {
      console.log('  ⚠ Encounter.png skipped (no encounter appeared in 10 trips)');
    }

    // ── 17. High Scores (Game menu tab) ──────────────────────────────────
    try {
      currentTitle = 'Buy Cargo';
      await shortcut(page, 'B');
      await page.waitForTimeout(300);
      await menuNavigateTab(page, 'Game', 'High Scores');
      await page.waitForTimeout(500);
      await capture(page, 'High Scores');
    } catch {
      console.log('  ⚠ High Scores.png skipped');
    }
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
