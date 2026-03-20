const { test, expect } = require('@playwright/test');

test.describe('Direct app URL', () => {
  test('valid app skips boot and opens requested window', async ({ page }) => {
    await page.route('https://**/*', (route) => route.abort());

    await page.goto('/run/calculator');

    // /run/<id> should redirect to / and open the app.
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator('body')).not.toHaveClass(/booting/);
    await expect(page.locator('#boot-screen')).toBeHidden({ timeout: 5000 });

    // Desktop icons are built from the virtual filesystem + app registry.
    await expect(page.locator('#mycomputer-desktop-icon')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#calculator-window')).toBeVisible({ timeout: 5000 });
  });
});
