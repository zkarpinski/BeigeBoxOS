const { test, expect } = require('@playwright/test');
const { dismissBootScreen, openFromStartMenu } = require('./helpers');

test.describe('Mobile viewport layout', () => {
  test.use({ viewport: { width: 390, height: 844 } }); // Simulate a common mobile size

  test('desktop should not overflow below the taskbar or expand the body', async ({ page }) => {
    await dismissBootScreen(page);
    await page.waitForTimeout(1000); // Wait for transition

    // 1. Check empty desktop
    let scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    let clientHeight = await page.evaluate(() => document.documentElement.clientHeight);
    expect(scrollHeight).toBeLessThanOrEqual(clientHeight);

    // 2. Open Napster (an app known to potentially cause overflow)
    await openFromStartMenu(page, 'Internet');
    await page.locator('#start-menu-napster').click({ force: true });
    await page.locator('#napster-window').waitFor({ state: 'visible', timeout: 3000 });

    // Double click titlebar to maximize to see if maximized state overflows
    await page.locator('#napster-window .title-bar').dblclick({ force: true });
    await page.waitForTimeout(500);

    scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    clientHeight = await page.evaluate(() => document.documentElement.clientHeight);
    expect(scrollHeight).toBeLessThanOrEqual(clientHeight);

    // Check if taskbar is completely visible
    const taskbarBox = await page.locator('#taskbar').boundingBox();
    expect(taskbarBox.y + taskbarBox.height).toBeLessThanOrEqual(clientHeight);

    // 3. Test dragging Napster below the taskbar
    // Restore it first
    await page.locator('#napster-window .title-bar').dblclick({ force: true });
    await page.waitForTimeout(500);

    // Attempt to drag titlebar straight down 2000px
    const titleBar = page.locator('#napster-window .title-bar');
    // Hide Netscape to prevent iframe capturing pointer events
    await page.evaluate(() => {
      const nav = document.getElementById('navigator-window');
      if (nav) nav.style.display = 'none';
    });
    await titleBar.hover({ force: true });
    await page.mouse.down();
    await page.mouse.move(100, 2000, { steps: 10 });
    await page.mouse.up();
    await page.waitForTimeout(500);

    // It should be constrained to maxTop (windowHeight - 50px approx), keeping the body from scrolling
    scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    clientHeight = await page.evaluate(() => document.documentElement.clientHeight);
    expect(scrollHeight).toBeLessThanOrEqual(clientHeight);
  });
});
