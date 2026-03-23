/**
 * Mobile smoke — narrow viewport + touch. Intentionally minimal (no drag / taskbar tap).
 * Run: pnpm e2e --project=win98-chromium e2e/shared/mobile.spec.js
 */
const { test, expect } = require('@playwright/test');
const { dismissBootScreen } = require('./helpers');

test.describe('Mobile smoke', () => {
  test.use({ viewport: { width: 393, height: 851 }, isMobile: true, hasTouch: true });

  test('boot dismisses and shell is visible', async ({ page }) => {
    await dismissBootScreen(page);
    await expect(page.locator('#taskbar')).toBeVisible();
    await expect(page.locator('#start-button')).toBeVisible();
    await expect(page.locator('#mycomputer-desktop-icon')).toBeVisible();
  });

  test('document does not overflow viewport', async ({ page }) => {
    await dismissBootScreen(page);
    await page.waitForTimeout(300);
    const { scrollWidth, clientWidth, scrollHeight, clientHeight } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    expect(scrollHeight).toBeLessThanOrEqual(clientHeight + 1);
  });
});
