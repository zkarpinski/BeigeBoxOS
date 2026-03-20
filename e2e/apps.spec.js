const { test, expect } = require('@playwright/test');
const { dismissBootScreen, openFromStartMenu, closeAppWindow } = require('./helpers');
const { apps } = require('./apps/apps-config');

/**
 * E2E: each registered app is opened from the Start menu, interacted with, then closed.
 * Per-app tests live under e2e/apps/*.spec.js and use the same helpers + apps-config.
 */
test('all applications can open, interact, and close', async ({ page }) => {
  await dismissBootScreen(page);

  const appIdFromWindow = (windowId) => windowId.replace(/^#/, '').replace(/-window$/, '');

  for (const app of apps) {
    const appId = appIdFromWindow(app.windowId);

    await test.step(`Open ${appId}`, async () => {
      await openFromStartMenu(page, app.subFolder);
      await page.locator(app.startId).waitFor({ state: 'visible', timeout: 3000 });
      await page.click(app.startId, { force: true });
    });

    const win = page.locator(app.windowId);
    await expect(win).toBeVisible();

    if (app.titleSelector) {
      await expect(page.locator(app.titleSelector)).toBeVisible();
    }

    await test.step(`Interact ${appId}`, async () => {
      if (app.interact) await app.interact(page);
    });

    if (app.assertAfterInteract) {
      await test.step(`Assert ${appId}`, async () => {
        await app.assertAfterInteract(page);
      });
    }

    await test.step(`Close ${appId}`, async () => {
      await closeAppWindow(page, app.windowId);
      await expect(win).not.toBeVisible();
    });
  }
});
