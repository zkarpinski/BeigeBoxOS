/**
 * Mobile experience E2E tests.
 * Run: npx playwright test e2e/mobile.spec.js
 * Run only mobile project: npx playwright test e2e/mobile.spec.js --project=mobile
 * Uses Pixel 5 viewport (393x851) and touch emulation.
 */
const { test, expect } = require('@playwright/test');
const { dismissBootScreen } = require('./helpers');

test.describe('Mobile experience', () => {
  // Don't spread Playwright device presets here — some include `defaultBrowserType`,
  // which Playwright forbids inside describe groups (it would force a new worker).
  test.use({ viewport: { width: 393, height: 851 }, isMobile: true, hasTouch: true });

  test('desktop icons: first tap selects, second tap opens', async ({ page }) => {
    await dismissBootScreen(page);
    await page.waitForTimeout(500);

    const myComputerIcon = page.locator('#mycomputer-desktop-icon');
    await expect(myComputerIcon).toBeVisible();

    // First tap: should select (add .selected class), not open
    await myComputerIcon.tap();
    await expect(myComputerIcon).toHaveClass(/selected/);

    // Second tap within 350ms: should open My Computer window
    await myComputerIcon.tap();
    await page.waitForTimeout(200);
    await expect(page.locator('#mycomputer-window')).toBeVisible();
    await expect(page.locator('#mycomputer-window').first()).not.toHaveClass(/app-window-hidden/);
  });

  test('tap outside desktop icon clears selection', async ({ page }) => {
    await dismissBootScreen(page);
    await page.waitForTimeout(500);

    const myComputerIcon = page.locator('#mycomputer-desktop-icon');
    await myComputerIcon.tap();
    await expect(myComputerIcon).toHaveClass(/selected/);

    // Tap taskbar (outside desktop icons) to clear selection
    await page.locator('#taskbar').tap({ position: { x: 50, y: 5 } });
    await page.waitForTimeout(100);
    await expect(myComputerIcon).not.toHaveClass(/selected/);
  });

  test('window can be dragged via touch', async ({ page }) => {
    await dismissBootScreen(page);
    await page.waitForTimeout(500);

    // Open My Computer via desktop icon (double-tap)
    const myComputerIcon = page.locator('#mycomputer-desktop-icon');
    await myComputerIcon.tap();
    await myComputerIcon.tap();
    await page.waitForTimeout(300);

    const win = page.locator('#mycomputer-window');
    await expect(win).toBeVisible();
    const boxBefore = await win.boundingBox();
    expect(boxBefore).toBeTruthy();

    // Simulate touch drag: touchstart on title bar, touchmove and touchend on document
    const centerX = boxBefore.x + boxBefore.width / 2;
    const centerY = boxBefore.y + 20;
    const delta = 60;

    await page.evaluate(
      ({ tx, ty, dx }) => {
        const touchStart = new TouchEvent('touchstart', {
          bubbles: true,
          cancelable: true,
          touches: [{ identifier: 1, clientX: tx, clientY: ty }],
          changedTouches: [{ identifier: 1, clientX: tx, clientY: ty }],
          targetTouches: [{ identifier: 1, clientX: tx, clientY: ty }],
        });
        const titleEl = document.querySelector('#mycomputer-window .title-bar');
        if (titleEl) titleEl.dispatchEvent(touchStart);

        const touchMove = new TouchEvent('touchmove', {
          bubbles: true,
          cancelable: true,
          touches: [{ identifier: 1, clientX: tx + dx, clientY: ty }],
          changedTouches: [{ identifier: 1, clientX: tx + dx, clientY: ty }],
          targetTouches: [{ identifier: 1, clientX: tx + dx, clientY: ty }],
        });
        document.dispatchEvent(touchMove);

        const touchEnd = new TouchEvent('touchend', {
          bubbles: true,
          cancelable: true,
          touches: [],
          changedTouches: [{ identifier: 1, clientX: tx + dx, clientY: ty }],
        });
        document.dispatchEvent(touchEnd);
      },
      { tx: centerX, ty: centerY, dx: delta },
    );

    await page.waitForTimeout(300);
    const boxAfter = await win.boundingBox();
    expect(boxAfter).toBeTruthy();
    expect(boxAfter.x).toBeGreaterThanOrEqual(boxBefore.x + delta - 5);
  });

  test('no horizontal or vertical scroll on mobile desktop', async ({ page }) => {
    await dismissBootScreen(page);
    await page.waitForTimeout(1000);

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const clientHeight = await page.evaluate(() => document.documentElement.clientHeight);

    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
    expect(scrollHeight).toBeLessThanOrEqual(clientHeight + 1);
  });
});
