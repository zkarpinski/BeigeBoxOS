const { test, expect } = require('@playwright/test');
const { dismissBootScreen, openFromStartMenu, runAppTestFromDesktop } = require('../../../shared/helpers');

test.beforeEach(async ({ page }) => {
  await dismissBootScreen(page);
});

test('opens from Start menu, interacts, and closes', async ({ page }) => {
  await runAppTestFromDesktop(page, 'minesweeper-window', expect);
});

test('opens Best Times from Game menu and shows leaderboard', async ({ page }) => {
  await openFromStartMenu(page, 'Games');
  await page.locator('#start-menu-minesweeper').click();
  await page.waitForSelector('#minesweeper-window', { state: 'visible' });

  const win = page.locator('#minesweeper-window');
  await win.locator('.minesweeper-menu-item').first().hover();
  await page.locator('.minesweeper-dropdown-item:has-text("Best")').click();

  await expect(page.locator('.minesweeper-leaderboard-dialog')).toBeVisible();
  await expect(page.locator('.minesweeper-leaderboard-dialog')).toContainText('Best Times');
  await expect(page.locator('.minesweeper-leaderboard-dialog')).toContainText('Beginner');
  await expect(page.locator('.minesweeper-leaderboard-dialog')).toContainText('Intermediate');
  await expect(page.locator('.minesweeper-leaderboard-dialog')).toContainText('Expert');

  await page.locator('.minesweeper-leaderboard-dialog button:has-text("OK")').click();
  await expect(page.locator('.minesweeper-leaderboard-dialog')).not.toBeVisible();
});
