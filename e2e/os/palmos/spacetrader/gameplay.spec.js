const { test, expect } = require('@playwright/test');

test.describe('Space Trader Gameplay', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Clear localStorage
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(page.locator('text=Address')).toBeVisible({ timeout: 30000 });

    // Open Space Trader
    await page.click('text=Space Trader', { force: true });
    await expect(page.locator('text=Skill Points: 0 remaining')).toBeVisible({ timeout: 15000 });
  });

  test('can start a new game and see the trade view', async ({ page }) => {
    await page.click('text=Start Trading', { force: true });
    await expect(page.locator('text=Cash: 1000 cr.')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Buy Cargo')).toBeVisible();
  });

  test('can buy and sell cargo', async ({ page }) => {
    await page.click('text=Start Trading', { force: true });
    await expect(page.locator('text=Buy Cargo')).toBeVisible();

    // Dynamically find a row that is available to buy
    const rows = page.locator('.trade-row-authentic');
    await expect(rows.first()).toBeVisible({ timeout: 10000 });

    const rowCount = await rows.count();
    let foundRow = null;
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const text = await row.innerText();
      if (!text.includes('not sold') && !text.includes('Price: 0')) {
        foundRow = row;
        break;
      }
    }

    if (!foundRow) {
      throw new Error('No items available to buy in starting system');
    }

    // Click the qty-box to open modal
    await foundRow.locator('.qty-box').click({ force: true });

    // Modal should be open. Click OK.
    await expect(page.locator('.palm-modal-overlay')).toBeVisible({ timeout: 5000 });
    await page.click('text=OK', { force: true });

    // Verify cash decreased
    await expect(page.locator('text=Cash: 1000 cr.')).not.toBeVisible();

    // Go to Sell mode via shortcut S
    await page.locator('button', { hasText: 'S' }).click({ force: true });
    await expect(page.locator('text=Sell Cargo')).toBeVisible();

    // The item we just bought should be available to sell
    const qtyBox = foundRow.locator('.qty-box');
    await expect(qtyBox).not.toHaveText('0');

    // Click to open modal and sell all
    await qtyBox.click({ force: true });
    await expect(page.locator('.palm-modal-overlay')).toBeVisible();
    await page.click('text=OK', { force: true });

    // Verify we have 0 to sell
    await expect(qtyBox).toHaveText('0');
  });

  test('can navigate to different views via shortcuts', async ({ page }) => {
    await page.click('text=Start Trading', { force: true });

    // W -> Map
    await page.locator('button', { hasText: 'W' }).click({ force: true });
    await expect(page.locator('text=Short Range Chart')).toBeVisible();

    // B -> Buy Cargo
    await page.locator('button', { hasText: 'B' }).click({ force: true });
    await expect(page.locator('text=Buy Cargo')).toBeVisible();

    // Y -> Shipyard
    await page.locator('button', { hasText: 'Y' }).click({ force: true });
    await expect(page.locator('text=Shipyard')).toBeVisible();
  });

  test('can travel to a nearby system', async ({ page }) => {
    await page.click('text=Start Trading', { force: true });

    // Open Map
    await page.locator('button', { hasText: 'W' }).click({ force: true });

    // Find systems.
    const systems = page.locator('.map-dot');
    await expect(systems.first()).toBeVisible({ timeout: 10000 });

    // Click a system that isn't the current one.
    // Use dispatchEvent to ensure the click reaches the SVG element correctly
    // especially with the device frame potentially interfering with hit-testing
    await systems.first().dispatchEvent('click');

    // Should show parsecs in the footer
    await expect(page.locator('text=parsecs')).toBeVisible({ timeout: 10000 });

    // Click Warp (Travel)
    await page.click('text=Warp', { force: true });

    // Check for random encounter - these happen during warp sometimes
    const encounter = page.locator('.palm-header', { hasText: 'Encounter!' });
    await encounter
      .waitFor({ state: 'visible', timeout: 5000 })
      .then(async () => {
        await page.click('text=Surrender', { force: true });
      })
      .catch(() => {
        // Encounter didn't appear, that's fine
      });

    // Wait for travel animation/delay then check if we are there
    await expect(page.locator('text=Buy Cargo')).toBeVisible({ timeout: 20000 });
  });

  test('game state persists after reload', async ({ page }) => {
    await page.click('text=Start Trading', { force: true });

    // Locate first buyable item
    const firstRow = page.locator('.trade-row-authentic').first();
    await firstRow.locator('.qty-box').click({ force: true });
    await page.click('text=OK', { force: true });

    // Reload page
    await page.reload();
    await expect(page.locator('text=Address')).toBeVisible({ timeout: 30000 });
    await page.click('text=Space Trader', { force: true });

    // Should still be in Trade view
    await expect(page.locator('text=Buy Cargo')).toBeVisible({ timeout: 20000 });

    // Check cash is still reduced
    await expect(page.locator('text=Cash: 1000 cr.')).not.toBeVisible();
  });
});
