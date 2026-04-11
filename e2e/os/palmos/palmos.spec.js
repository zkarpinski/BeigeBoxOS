const { test, expect } = require('@playwright/test');

test.describe('PalmOS Desktop', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the base URL (which should be running PalmOS)
    await page.goto('/');
    // Clear localStorage to ensure a fresh start for every test
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    // Wait for the desktop to load
    await expect(page.locator('text=Address')).toBeVisible({ timeout: 20000 });
  });

  test('launcher shows all default apps', async ({ page }) => {
    const apps = [
      'Address',
      'Calc',
      'Card Info',
      'Clock',
      'Date Book',
      'Expense',
      'HotSync',
      'Mail',
      'Memo Pad',
      'Note Pad',
      'Prefs',
      'Security',
      'To Do List',
      'Space Trader',
    ];

    for (const app of apps) {
      await expect(page.locator(`text=${app}`)).toBeVisible();
    }
  });

  test('can open Date Book via launcher', async ({ page }) => {
    await page.click('text=Date Book');
    // Check if Date Book header is visible
    await expect(page.locator('text=Sep 23, 04')).toBeVisible();
  });

  test('can open To Do List via hardware button', async ({ page }) => {
    // Hardware buttons are inside PalmFrame. They have titles.
    await page.click('[title="To Do List"]');
    await expect(page.locator('text=New')).toBeVisible();
    await expect(page.locator('text=Details')).toBeVisible();
  });

  test('can open Space Trader and start a new game', async ({ page }) => {
    await page.click('text=Space Trader');
    // Space Trader should load its NewGameView
    await expect(page.locator('text=Skill Points: 0 remaining')).toBeVisible();

    // Test the keyboard trigger (clicking the name "Jameson")
    await page.click('text=Jameson');
    await expect(page.locator('.palm-keyboard-container')).toBeVisible();

    // Close keyboard via Done button
    await page.click('text=Done');
    await expect(page.locator('.palm-keyboard-container')).not.toBeVisible();

    // Start Trading
    await page.click('text=Start Trading');
    // Should be in trade view
    await expect(page.locator('text=Cash: 1000 cr.')).toBeVisible();
  });

  test('can navigate back to launcher via Home silk button', async ({ page }) => {
    await page.click('text=Date Book');
    await expect(page.locator('text=Sep 23, 04')).toBeVisible();

    // Click Home silk button
    await page.click('[title="Home"]');
    // Should be back at launcher
    await expect(page.locator('text=Address')).toBeVisible();
    await expect(page.locator('text=Sep 23, 04')).not.toBeVisible();
  });
});
