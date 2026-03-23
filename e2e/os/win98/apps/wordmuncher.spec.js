const { test, expect } = require('@playwright/test');
const { getAppByWindowId } = require('./apps-config');

test('word muncher can open, interact, and close', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2000); // Wait for boot

  const app = getAppByWindowId('wordmuncher-window');

  // Open from Start Menu
  await page.click('#start-btn');
  await page.click('.start-menu-item:has-text("Programs")');
  if (app.subFolder) {
    await page.click(`.start-menu-item:has-text("${app.subFolder}")`);
  }
  await page.click(app.startId, { force: true });

  // Verify it opened
  await expect(page.locator(app.windowId)).toBeVisible();

  // Interact
  await app.interact(page);

  // Close
  await page.click(`${app.windowId} .title-bar-controls [data-win-close]`);
  await expect(page.locator(app.windowId)).not.toBeVisible();
});
