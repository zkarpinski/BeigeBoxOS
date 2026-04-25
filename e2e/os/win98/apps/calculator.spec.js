const { test, expect } = require('@playwright/test');
const { dismissBootScreen, runAppTestFromDesktop } = require('../../../shared/helpers');

test.beforeEach(async ({ page }) => {
  await dismissBootScreen(page);
});

test('opens from Start menu, interacts, and closes', async ({ page }) => {
  await runAppTestFromDesktop(page, 'calculator-window', expect);
});

test('calculates 2+2 and shows 4 via mouse', async ({ page }) => {
  await runAppTestFromDesktop(page, 'calculator-window', expect, {
    interact: async (p) => {
      const calc = p.locator('#calculator-window');
      await calc.getByRole('button', { name: '2', exact: true }).click({ force: true });
      await p.waitForTimeout(80);
      await calc.getByRole('button', { name: '+', exact: true }).click({ force: true });
      await p.waitForTimeout(80);
      await calc.getByRole('button', { name: '2', exact: true }).click({ force: true });
      await p.waitForTimeout(80);
      await calc.getByRole('button', { name: '=', exact: true }).click({ force: true });
      await p.waitForTimeout(80);
    },
    assertAfterInteract: async (p) => {
      await expect(p.locator('#calculator-window .calculator-display')).toHaveValue('4');
    },
  });
});

test('calculates 2+2 via keyboard after opening (body is auto-focused when window is shown)', async ({
  page,
}) => {
  const { openFromStartMenu } = require('../../../shared/helpers');
  await openFromStartMenu(page, 'Accessories');
  await page.locator('#start-menu-calculator').click({ force: true });
  await page.waitForSelector('#calculator-window:visible', { state: 'visible' });
  const body = page.locator('#calculator-window .calculator-body');
  await expect(body).toBeVisible();
  // Rely on CalculatorWindow useEffect to focus body when visible; no click inside window
  await page.waitForTimeout(50);
  await page.keyboard.press('2');
  await page.keyboard.press('+');
  await page.keyboard.press('2');
  await page.keyboard.press('=');
  await expect(page.locator('#calculator-window .calculator-display')).toHaveValue('4');
});
