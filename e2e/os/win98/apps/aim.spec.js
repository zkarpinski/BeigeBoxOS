const { test, expect } = require('@playwright/test');
const { dismissBootScreen, openFromStartMenu, runAppTest } = require('../../../shared/helpers');

test.beforeEach(async ({ page }) => {
  await dismissBootScreen(page);
});

test('opens from Start menu, interacts, and closes', async ({ page }) => {
  await runAppTest(page, 'aim-window', expect);
});

test('opens zkarpinski and sends a message', async ({ page }) => {
  await openFromStartMenu(page, 'Internet');
  await page.locator('#start-menu-aim').click();
  await page.waitForSelector('#aim-window', { state: 'visible' });

  const aim = page.locator('#aim-window');
  await aim.locator('button[title="Send Instant Message"]').click();
  await page.waitForSelector('.aim-chat-window', { state: 'visible' });

  const chat = page.locator('.aim-chat-window');
  await expect(chat).toContainText('zkarpinski');
  await expect(chat).toContainText('Instant Message');

  const input = chat.locator('.aim-chat-input');
  await input.fill('hey zkarpinski!');
  await chat.locator('button:has-text("Send")').click();

  await expect(chat.locator('.aim-chat-log')).toContainText('hey zkarpinski!');
  await expect(chat.locator('.aim-chat-log')).toContainText('F4$tRunn3r200');
});
