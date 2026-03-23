const { test, expect } = require('@playwright/test');
const { runAppTest } = require('../../../shared/helpers');

test('opens from Start menu, interacts, and closes', async ({ page }) => {
  await runAppTest(page, 'thps2-window', expect);
});
