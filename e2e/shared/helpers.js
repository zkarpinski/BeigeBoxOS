/**
 * Shared E2E helpers. Use from apps.spec.js and e2e/apps/*.spec.js.
 */

const { getAppByWindowId } = require('../os/win98/apps/apps-config');

/**
 * Block external requests and go to home, then dismiss the boot screen and wait for desktop.
 * @param {import('@playwright/test').Page} page
 */
async function dismissBootScreen(page) {
  await page.route('https://**', (route) => route.abort());
  await page.goto('/');

  // If localStorage already has the boot key the boot screen is hidden immediately
  // (display:none) and _onDesktopReady(true) is called synchronously — skip the click.
  const bootVisible = await page.locator('#boot-screen').isVisible();
  if (!bootVisible) {
    await page.waitForFunction(() => !document.body.classList.contains('booting'), {
      timeout: 8000,
    });
    return;
  }

  await page.waitForSelector('#boot-click-prompt', { state: 'visible', timeout: 10000 });
  await page.click('#boot-screen', { force: true });
  await page.waitForFunction(() => !document.body.classList.contains('booting'), { timeout: 8000 });
}

/**
 * Open Start menu and hover Programs, then optionally hover a subfolder so its items are visible.
 * @param {import('@playwright/test').Page} page
 * @param {string | null} subFolder - e.g. 'Accessories', 'Games', 'Internet', or null for Programs root
 */
async function openFromStartMenu(page, subFolder) {
  await page.click('#start-button', { force: true });
  await page.hover('.start-menu-items > .start-menu-item.has-submenu', { force: true });
  if (subFolder) {
    await page.hover(`.start-menu-items .submenu .has-submenu:has-text("${subFolder}")`, {
      force: true,
    });
  }
}

/**
 * Close the app window.
 * Clicks [data-win-close] first (exercises the UI), then falls back to
 * window shell API hideApp if the window is still visible after 500ms.
 * @param {import('@playwright/test').Page} page
 * @param {string} windowId - e.g. '#napster-window'
 */
async function closeAppWindow(page, windowId) {
  const appId = windowId.replace(/^#/, '').replace(/-window$/, '');
  const closeBtn = page.locator(`${windowId} .title-bar-controls [data-win-close]`).first();
  if ((await closeBtn.count()) > 0) {
    await closeBtn.click({ force: true });
  }
  // Allow React one tick to process the click
  await page.waitForTimeout(300);
  // Fall back to the API if the DOM click didn't land (e.g. covered by a child overlay)
  const stillVisible = await page.locator(windowId).isVisible();
  if (stillVisible) {
    await page.evaluate((id) => {
      const w = window;
      if (w.Windows98) w.Windows98.hideApp(id);
      else if (w.Windows95) w.Windows95.hideApp(id);
      else if (w.WindowsXP) w.WindowsXP.hideApp(id);
    }, appId);
  }
}

/**
 * Run the full flow for one app: open from Start menu, assert visible, interact, optional assert, close.
 * Used by e2e/apps/*.spec.js for per-app tests.
 * @param {import('@playwright/test').Page} page
 * @param {string} windowId - e.g. 'napster-window' or '#napster-window'
 * @param {import('@playwright/test').Expect} expect - Playwright expect from the test file
 */
async function runAppTest(page, windowId, expect) {
  const app = getAppByWindowId(windowId);
  await dismissBootScreen(page);
  await openFromStartMenu(page, app.subFolder);
  await page.locator(app.startId).waitFor({ state: 'visible', timeout: 3000 });
  await page.click(app.startId, { force: true });

  const win = page.locator(app.windowId);
  await expect(win).toBeVisible();
  if (app.titleSelector) {
    await expect(page.locator(app.titleSelector)).toBeVisible();
  }
  if (app.interact) await app.interact(page);
  if (app.assertAfterInteract) await app.assertAfterInteract(page);
  await closeAppWindow(page, app.windowId);
  await expect(win).not.toBeVisible();
}

/**
 * Same as runAppTest but assumes desktop is already ready (e.g. after beforeEach(dismissBootScreen)).
 * Optional overrides for interact and assertAfterInteract (otherwise uses app config).
 * @param {import('@playwright/test').Page} page
 * @param {string} windowId - e.g. 'calculator-window'
 * @param {import('@playwright/test').Expect} expect
 * @param {{ interact?: (p: import('@playwright/test').Page) => Promise<void>; assertAfterInteract?: (p: import('@playwright/test').Page) => Promise<void> }} [overrides]
 */
async function runAppTestFromDesktop(page, windowId, expect, overrides = {}) {
  const app = getAppByWindowId(windowId);
  await openFromStartMenu(page, app.subFolder);
  await page.locator(app.startId).waitFor({ state: 'visible', timeout: 3000 });
  await page.click(app.startId, { force: true });

  const win = page.locator(app.windowId);
  await expect(win).toBeVisible();
  if (app.titleSelector) {
    await expect(page.locator(app.titleSelector)).toBeVisible();
  }
  const interact = overrides.interact ?? app.interact;
  const assertAfterInteract = overrides.assertAfterInteract ?? app.assertAfterInteract;
  if (interact) await interact(page);
  if (assertAfterInteract) await assertAfterInteract(page);
  await closeAppWindow(page, app.windowId);
  await expect(win).not.toBeVisible();
}

module.exports = {
  dismissBootScreen,
  openFromStartMenu,
  closeAppWindow,
  runAppTest,
  runAppTestFromDesktop,
};
