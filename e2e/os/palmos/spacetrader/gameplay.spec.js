const { test, expect } = require('@playwright/test');

test.describe('Space Trader Gameplay', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    // Mock date to 2004-09-23
    await page.addInitScript(() => {
      const MockDate = class extends Date {
        constructor(...args) {
          if (args.length === 0) {
            super('2004-09-23T12:00:00');
          } else {
            super(...args);
          }
        }
      };
      // @ts-ignore
      window.Date = MockDate;
    });

    await page.goto('/');
    // Clear localStorage
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await expect(page.locator('text=Address')).toBeVisible({ timeout: 30000 });

    // Open Space Trader
    await page.click('text=Space Trader', { force: true });
    // Look for more flexible text "Skill points" which is stable
    await expect(page.locator('text=Skill points')).toBeVisible({ timeout: 15000 });
  });

  test('can start a new game and see the trade view', async ({ page }) => {
    await page.click('text=OK', { force: true });
    await expect(page.locator('text=Cash: 1000 cr.')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Buy Cargo')).toBeVisible();
  });

  test('can buy and sell cargo', async ({ page }) => {
    await page.click('text=OK', { force: true });
    await expect(page.locator('text=Buy Cargo')).toBeVisible();

    // Dynamically find a row that is available to buy
    const rows = page.locator('.trade-row-authentic');
    await expect(rows.first()).toBeVisible({ timeout: 10000 });

    const rowCount = await rows.count();
    let foundRow = null;
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i);
      const text = await row.innerText();
      const qtyText = await row.locator('.qty-box').innerText();
      if (!text.includes('not sold') && !text.includes('Price: 0') && parseInt(qtyText) > 0) {
        foundRow = row;
        break;
      }
    }

    if (!foundRow) {
      throw new Error('No items with quantity > 0 available to buy in starting system');
    }

    // Click the qty-box to open modal
    await foundRow.locator('.qty-box').click({ force: true });

    // Modal should be open. Click OK.
    await expect(page.locator('.palm-modal-overlay')).toBeVisible({ timeout: 5000 });
    await page.click('text=OK', { force: true });

    // Verify cash decreased
    await expect(page.locator('text=Cash: 1000 cr.')).not.toBeVisible();

    // Go to Sell mode via shortcut S
    await page.getByRole('button', { name: 'S', exact: true }).click({ force: true });
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
    await page.click('text=OK', { force: true });

    // W -> Map
    await page.getByRole('button', { name: 'W', exact: true }).click({ force: true });
    await expect(page.locator('text=Short Range Chart')).toBeVisible();

    // B -> Buy Cargo
    await page.getByRole('button', { name: 'B', exact: true }).click({ force: true });
    await expect(page.locator('text=Buy Cargo')).toBeVisible();

    // Y -> Ship Yard
    await page.getByRole('button', { name: 'Y', exact: true }).click({ force: true });
    await expect(page.locator('text=Ship Yard')).toBeVisible();
  });

  test('can travel to a nearby system', async ({ page }) => {
    await page.click('text=OK', { force: true });

    // Open Map
    await page.getByRole('button', { name: 'W', exact: true }).click({ force: true });

    // Find systems that are in range.
    const systems = page.locator('.map-dot[data-in-range="true"]');
    await expect(systems.first()).toBeVisible({ timeout: 10000 });

    // Click a system that isn't the current one.
    await systems.first().dispatchEvent('click');

    // Should show parsecs in the footer
    await expect(page.locator('text=parsecs')).toBeVisible({ timeout: 10000 });

    // Click Warp (Travel)
    await page.click('text=Warp', { force: true });

    // Wait a moment for any encounter or event to trigger
    await page.waitForTimeout(1000);

    // If an encounter or special event modal appears, dismiss it
    const dismissEncounter = async () => {
      const modal = page.locator('.palm-modal-overlay');
      if (await modal.isVisible()) {
        const dismissButtons = [
          'Done',
          'Surrender',
          'Submit',
          'Ignore',
          'OK',
          'Yes',
          'No',
          'Ignore',
          'Part ways',
        ];
        for (const btnText of dismissButtons) {
          const btn = page.locator(`button:has-text("${btnText}")`);
          if (await btn.isVisible()) {
            await btn.click({ force: true });
            // Wait for potential resolution message or subsequent modal
            await page.waitForTimeout(500);
            await dismissEncounter(); // Recursive check for follow-up modals (e.g. "You escape")
            break;
          }
        }
      }
    };
    await dismissEncounter();

    // Wait for travel animation/delay then check if we are there
    await expect(page.locator('text=Buy Cargo')).toBeVisible({ timeout: 30000 });
  });

  test('game state persists after reload', async ({ page }) => {
    await page.click('text=OK', { force: true });

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

  test('can restart game from menu', async ({ page }) => {
    await page.click('text=OK', { force: true });
    await expect(page.locator('text=Buy Cargo')).toBeVisible();

    // Open menu via Silk button
    await page.click('button[title="Menu"]', { force: true });

    // Wait for menu to appear (it has a dismiss backdrop or specific background)
    await page.waitForTimeout(500);

    // Switch to Game tab - use more specific locator to avoid matching main screen text
    const gameTab = page
      .locator('div[style*="background: rgb(26, 26, 140)"] div')
      .filter({ hasText: 'Game' });
    await gameTab.click({ force: true });

    // Click New Game
    await page.click('text="New Game"', { force: true });

    // Should be back at the New Game view with skill selection
    await expect(page.locator('text=Skill points')).toBeVisible({ timeout: 15000 });

    // Check that name is default
    await expect(page.locator('text=Jameson')).toBeVisible();
  });
});
