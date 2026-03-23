const { test, expect } = require('@playwright/test');
const { dismissBootScreen, openFromStartMenu, closeAppWindow } = require('../../../shared/helpers');

test.describe('Adobe Photoshop 5 (fake virus)', () => {
  test.beforeEach(async ({ page }) => {
    await dismissBootScreen(page);
  });

  test('shows splash screen on open', async ({ page }) => {
    await openFromStartMenu(page, null);
    await page.locator('#start-menu-photoshop').waitFor({ state: 'visible', timeout: 3000 });
    await page.click('#start-menu-photoshop', { force: true });

    const win = page.locator('#photoshop-window');
    await expect(win).toBeVisible();
    await expect(page.locator('#photoshop-window .title-bar-text .title-text')).toBeVisible();
    await expect(page.locator('#photoshop-window .ps5-splash')).toBeVisible();
    await expect(page.locator('#photoshop-window .ps5-progress-fill')).toBeVisible();
  });

  test('closes cleanly before virus phase and leaves no popups', async ({ page }) => {
    await openFromStartMenu(page, null);
    await page.locator('#start-menu-photoshop').waitFor({ state: 'visible', timeout: 3000 });
    await page.click('#start-menu-photoshop', { force: true });

    await expect(page.locator('#photoshop-window')).toBeVisible();

    // Close during splash (well before the 2.6s virus phase)
    await closeAppWindow(page, '#photoshop-window');
    await expect(page.locator('#photoshop-window')).not.toBeVisible();
    await expect(page.locator('[data-ps5-popup]')).toHaveCount(0);
  });

  test('spawns popups during virus phase then cleans up on close', async ({ page }) => {
    await openFromStartMenu(page, null);
    await page.locator('#start-menu-photoshop').waitFor({ state: 'visible', timeout: 3000 });
    await page.click('#start-menu-photoshop', { force: true });

    await expect(page.locator('#photoshop-window')).toBeVisible();

    // Wait for virus phase to start (splash is 2.6s) and a few popups to spawn
    await page.waitForTimeout(3500);
    const popupCount = await page.locator('[data-ps5-popup]').count();
    expect(popupCount).toBeGreaterThan(0);

    // Use Windows98 shell API directly — DOM clicks are unreliable when fixed popups
    // with z-index 9000+ are stacking over the window chrome.
    await page.evaluate(() => {
      window.Windows98?.hideApp('photoshop');
    });
    await expect(page.locator('#photoshop-window')).not.toBeVisible();
    await expect(page.locator('[data-ps5-popup]')).toHaveCount(0);
  });
});
