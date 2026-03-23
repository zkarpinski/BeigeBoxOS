/**
 * Shared app definitions for E2E. Used by apps.spec.js (full smoke) and e2e/apps/*.spec.js (per-app).
 * windowId is the key (e.g. 'napster-window'); use getAppByWindowId('napster-window') to get one entry.
 */

const apps = [
  {
    subFolder: 'Internet',
    startId: '#start-menu-napster',
    windowId: '#napster-window',
    titleSelector: '#napster-window .title-bar-text .title-text',
    interact: async (p) => {
      await p.locator('#napster-window .napster-tab').filter({ hasText: 'Search' }).click();
    },
  },
  {
    subFolder: 'Internet',
    startId: '#start-menu-aim',
    windowId: '#aim-window',
    titleSelector: '#aim-window .title-bar-text .title-text',
    interact: async (p) => {
      await p.locator('#aim-window button[title="Send Instant Message"]').click();
      await p.locator('.aim-chat-window').waitFor({ state: 'visible', timeout: 3000 });
    },
    assertAfterInteract: async (p) => {
      const { expect } = require('@playwright/test');
      await expect(p.locator('.aim-chat-window')).toBeVisible();
      // Close chat window before closeAppWindow runs, otherwise its z-index:500 blocks the hit
      await p.locator('.aim-chat-window .title-bar-controls button').click({ force: true });
      await expect(p.locator('.aim-chat-window')).not.toBeVisible();
    },
  },
  {
    subFolder: 'Internet',
    startId: '#start-menu-navigator',
    windowId: '#navigator-window',
    titleSelector: '#navigator-window .title-bar-text .title-text',
    interact: async (p) => {
      await p.locator('#navigator-window button[title="Home"]').click();
    },
  },
  {
    subFolder: 'Internet',
    startId: '#start-menu-aol',
    windowId: '#aol-window',
    titleSelector: '#aol-window .title-bar-text .title-text',
    interact: async (p) => {
      await p.locator('#aol-window .aol-btn-signon').click();
    },
  },
  {
    subFolder: 'Accessories',
    startId: '#start-menu-calculator',
    windowId: '#calculator-window',
    titleSelector: '#calculator-window .title-bar-text .title-text',
    interact: async (p) => {
      const calc = p.locator('#calculator-window');
      await calc.getByRole('button', { name: '5', exact: true }).click();
      await p.waitForTimeout(80);
      await calc.getByRole('button', { name: '+', exact: true }).click();
      await p.waitForTimeout(80);
      await calc.getByRole('button', { name: '3', exact: true }).click();
      await p.waitForTimeout(80);
      await calc.getByRole('button', { name: '=', exact: true }).click();
      await p.waitForTimeout(80);
    },
    assertAfterInteract: async (p) => {
      const { expect } = require('@playwright/test');
      await expect(p.locator('#calculator-window .calculator-display')).toHaveValue('8');
    },
  },
  {
    subFolder: 'Accessories',
    startId: '#start-menu-msdos',
    windowId: '#msdos-window',
    titleSelector: '#msdos-window .title-bar-text .title-text',
    interact: async (p) => {
      await p.locator('#msdos-window .msdos-input').fill('help');
      await p.keyboard.press('Enter');
    },
  },
  {
    subFolder: null,
    startId: '#start-menu-photoshop',
    windowId: '#photoshop-window',
    titleSelector: '#photoshop-window .title-bar-text .title-text',
    // Verify splash renders; close quickly before the 2.6s virus phase fires
    interact: async (p) => {
      await p.locator('#photoshop-window .ps5-splash').waitFor({ state: 'visible', timeout: 2000 });
    },
    assertAfterInteract: async (p) => {
      const { expect } = require('@playwright/test');
      await expect(p.locator('#photoshop-window .ps5-progress-fill')).toBeVisible();
    },
  },
  {
    subFolder: null,
    startId: '#start-menu-word',
    windowId: '#word-window',
    titleSelector: '#word-window .title-bar-text .title-text',
    interact: async (p) => {
      await p.click('#word-window button[title="Bold"]', { force: true });
    },
  },
  {
    subFolder: null,
    startId: '#start-menu-vb6',
    windowId: '#vb6-window',
    titleSelector: '#vb6-window .title-bar-text .title-text',
    interact: async (p) => {
      await p.click('#vb6-window button[title="Start"]', { force: true });
      await p.click('#vb6-window .vb6-run-window .vb6-mdi-controls button:has-text("X")', {
        force: true,
      });
    },
  },
  {
    subFolder: 'Entertainment',
    startId: '#start-menu-winamp',
    windowId: '#winamp-window',
    titleSelector: '#winamp-window .title-bar-text',
    interact: async (p) => {
      await p.locator('#winamp-window button[title="Play"]').click();
      await p.locator('#winamp-window button[title="Stop"]').click();
    },
  },
  {
    subFolder: 'Accessories',
    startId: '#start-menu-notepad',
    windowId: '#notepad-window',
    titleSelector: '#notepad-window .title-bar-text .title-text',
    interact: async (p) => {
      await p.locator('#notepad-window .notepad-textarea').fill('Test');
    },
    assertAfterInteract: async (p) => {
      const { expect } = require('@playwright/test');
      await expect(p.locator('#notepad-window .notepad-textarea')).toHaveValue('Test');
    },
  },
  {
    subFolder: 'Games',
    startId: '#start-menu-minesweeper',
    windowId: '#minesweeper-window',
    titleSelector: '#minesweeper-window .title-bar-text .title-text',
    interact: async (p) => {
      await p.locator('#minesweeper-window .ms-cell').first().click({ force: true });
    },
  },
  {
    subFolder: 'Games',
    startId: '#start-menu-thps2',
    windowId: '#thps2-window',
    titleSelector: '#thps2-window .thps2-titlebar-text',
    interact: async (p) => {
      await p.click('#thps2-window .thps2-body', { force: true });
    },
  },
  {
    subFolder: null,
    startId: '#start-menu-reporter',
    windowId: '#reporter-window',
    titleSelector: '#reporter-window .title-bar-text .title-text',
    interact: async (p) => {
      await p.locator('#reporter-window .reporter-textarea').first().fill('E2E test report');
    },
  },
  {
    subFolder: 'Games',
    startId: '#start-menu-wordmuncher',
    windowId: '#wordmuncher-window',
    titleSelector: '#wordmuncher-window .title-bar-text .title-text',
    interact: async (p) => {
      await p.locator('#wordmuncher-window button.wordmuncher-btn').click();
    },
  },
  {
    subFolder: 'System Tools',
    startId: '#start-menu-avg',
    windowId: '#avg-window',
    titleSelector: '#avg-window .title-bar-text .title-text',
    interact: async (p) => {
      await p.locator('#avg-window button', { hasText: 'Complete Test' }).first().click();
    },
  },
];

function getAppByWindowId(windowId) {
  const id = windowId.startsWith('#') ? windowId : `#${windowId}`;
  const app = apps.find((a) => a.windowId === id);
  if (!app) throw new Error(`No app config for windowId: ${windowId}`);
  return app;
}

module.exports = { apps, getAppByWindowId };
