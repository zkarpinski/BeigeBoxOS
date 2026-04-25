// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'win98-chromium',
      testMatch: ['**/shared/**/*.spec.js', '**/os/win98/**/*.spec.js'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.WIN98_URL || 'http://localhost:3000',
      },
    },
    {
      name: 'win98-mobile',
      testMatch: ['**/shared/**/*.spec.js', '**/os/win98/**/*.spec.js'],
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 393, height: 851 },
        isMobile: true,
        hasTouch: true,
        defaultBrowserType: 'chromium',
        baseURL: process.env.WIN98_URL || 'http://localhost:3000',
      },
    },
    {
      name: 'palmos-chromium',
      testMatch: ['**/os/palmos/**/*.spec.js'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.PALMOS_URL || 'http://localhost:3001',
      },
    },
  ],
  webServer: [
    {
      command: 'pnpm dev:win98',
      url: 'http://localhost:3000',
      reuseExistingServer: true,
      timeout: 120000,
    },
    {
      command: 'PORT=3001 pnpm dev:palmos',
      url: 'http://localhost:3001',
      reuseExistingServer: true,
      timeout: 120000,
    },
  ],
});
