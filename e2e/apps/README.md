# Per-app E2E tests

Each file in this folder tests one app: open from Start menu → interact → close. They use the same flow as the full smoke test in `e2e/apps.spec.js`.

**Shared pieces:**

- **`e2e/helpers.js`** — `dismissBootScreen`, `openFromStartMenu`, `closeAppWindow`, `runAppTest`
- **`e2e/apps/apps-config.js`** — app definitions (startId, windowId, subFolder, interact, assertAfterInteract). Add new apps here and in the main smoke test; then add a new `e2e/apps/<appId>.spec.js` that calls `runAppTest(page, '<appId>-window', expect)`.

**Run:**

- All app E2E: `npx playwright test e2e/apps/`
- One app: `npx playwright test e2e/apps/calculator.spec.js` or `npx playwright test --grep calculator`
- Full smoke (all apps in one test): `npx playwright test e2e/apps.spec.js`
