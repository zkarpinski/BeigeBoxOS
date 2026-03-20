const { test, expect } = require('@playwright/test');
const { runAppTest } = require('../helpers');

test('opens from Start menu, interacts, and closes', async ({ page }) => {
  await runAppTest(page, 'vb6-window', expect);
});
