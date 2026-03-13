const { test, expect } = require('@playwright/test');

test('all applications can open, interact, and close', async ({ page }) => {
  // Block all external requests to prevent load event from hanging on CDN/iframes
  await page.route('https://**', route => route.abort());

  await page.goto('/');

  // Wait for the click-to-continue prompt — confirms the 2s timer has fired
  // and the dismiss handler is attached, then dismiss the boot screen
  await page.waitForSelector('#boot-click-prompt', { state: 'visible', timeout: 5000 });
  await page.click('#boot-screen', { force: true });
  // Wait for staged desktop reveal to fully complete (~3.5s after click)
  await page.waitForFunction(() => !document.body.classList.contains('booting'), { timeout: 8000 });

  // Navigate start menu: open > hover Programs > optionally hover a subfolder
  async function openFromStartMenu(subFolder) {
    await page.click('#start-button', { force: true });
    // Hover "Programs" (first top-level has-submenu item)
    await page.hover('.start-menu-items > .start-menu-item.has-submenu', { force: true });
    if (subFolder) {
      await page.hover(`.start-menu-items .submenu .has-submenu:has-text("${subFolder}")`, { force: true });
    }
  }

  // List of apps to test: [subFolder, startId, windowId, titleSelector, interact]
  const apps = [
    {
      subFolder: 'Internet',
      startId: '#start-napster', windowId: '#napster-window',
      titleSelector: '#napster-window .title-bar-text .title-text',
      interact: async (p) => { await p.click('#napster-window .napster-tab[data-tab="search"]'); },
    },
    {
      subFolder: 'Internet',
      startId: '#start-aim', windowId: '#aim-window',
      titleSelector: '#aim-window .title-bar-text .title-text',
      interact: async (p) => { await p.click('#aim-im-btn'); },
    },
    {
      subFolder: 'Internet',
      startId: '#start-navigator', windowId: '#navigator-window',
      titleSelector: '#navigator-window .title-bar-text .title-text',
      interact: async (p) => { await p.click('#nav-btn-home'); },
    },
    {
      subFolder: 'Accessories',
      startId: '#start-menu-msdos', windowId: '#msdos-window',
      titleSelector: '#msdos-window .title-bar-text .title-text',
      interact: async (p) => { await p.type('#msdos-input-field', 'help'); await p.keyboard.press('Enter'); },
    },
    {
      subFolder: null,
      startId: '#start-menu-word', windowId: '#word-window',
      titleSelector: '#word-window .title-bar-text .title-text',
      interact: async (p) => { await p.click('#cmd-bold', { force: true }); },
    },
    {
      subFolder: null,
      startId: '#start-vb6', windowId: '#vb6-window',
      titleSelector: '#vb6-ide-title',
      interact: async (p) => { await p.click('#vb6-tb-start'); await p.click('#vb6-run-close'); },
    },
    {
      subFolder: 'Entertainment',
      startId: '#start-winamp', windowId: '#winamp-window',
      titleSelector: '#winamp-window .title-bar-text',
      interact: async (p) => { await p.click('#winamp-play'); await p.click('#winamp-stop'); },
    },
    {
      subFolder: 'Accessories',
      startId: '#start-menu-notepad', windowId: '#notepad-window',
      titleSelector: '#notepad-window .title-bar-text .title-text',
      interact: async (p) => { await p.type('#notepad-textarea', 'Test'); },
    },
    {
      subFolder: 'Games',
      startId: '#start-pinball-game', windowId: '#pinball-app-window',
      titleSelector: '#pinball-app-window .title-bar-text',
      interact: async (p) => { await p.click('#pinball-app-canvas', { force: true }); },
    },
  ];

  for (const app of apps) {
    // Open Start Menu and navigate to the right subfolder
    await openFromStartMenu(app.subFolder);

    // Open App
    await page.click(app.startId, { force: true });

    // Wait for window to appear
    const win = page.locator(app.windowId);
    await expect(win).toBeVisible();

    // Verify title
    if (app.titleSelector) {
        await expect(page.locator(app.titleSelector)).toBeVisible();
    }

    // Interact
    if (app.interact) {
        await app.interact(page);
    }

    // Close App
    const closeBtn = page.locator(`${app.windowId} .title-bar-controls [data-win-close]`).first();
    // Some apps use generic close buttons, try to find one
    if (await closeBtn.count() > 0) {
        await closeBtn.click({ force: true });
    } else {
        // Fallback for word, etc
        const altClose = page.locator(`${app.windowId} .icon-close`).first();
        if (await altClose.count() > 0) {
            await altClose.click({ force: true });
        } else {
            const genericClose = page.locator(`${app.windowId} button:has-text("X")`).first();
            await genericClose.click({ force: true });
        }
    }

    // Check if it's hidden or removed
    await expect(win).not.toBeVisible();
  }
});
