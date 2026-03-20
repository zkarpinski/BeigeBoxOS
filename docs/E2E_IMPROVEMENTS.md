# E2E Test Improvement Suggestions

## 1. **Isolate failures with `test.step` or per-app tests** ✓

**Done:**

- **`e2e/apps.spec.js`** uses `test.step` per app (Open / Interact / Assert / Close) so the report names the failing app.
- **Per-app tests** live in **`e2e/apps/*.spec.js`** (one test per app). Run one with `npx playwright test e2e/apps/calculator.spec.js` or `--grep calculator`. Shared flow and app config live in **`e2e/helpers.js`** and **`e2e/apps/apps-config.js`**.

---

## 2. **Assert outcomes, not just actions**

**Current:** `interact` only performs actions; there are no checks that the app actually did the right thing.

**Suggestions:**

- **Calculator:** After 5 + 3 =, assert display shows `"8"` (e.g. `await expect(page.locator('.calculator-display')).toHaveValue('8')`).
- **Word:** After clicking Bold, assert the button has the active state or that the editor selection has bold (e.g. `await expect(page.locator('#word-window button[title="Bold"]')).toHaveClass(/active/)`).
- **Notepad:** After filling text, assert the textarea value (e.g. `await expect(page.locator('#notepad-window .notepad-textarea')).toHaveValue('Test')`).
- Add an optional **`assertAfterInteract?: (page) => Promise<void>`** (or return value from `interact`) so each app can define its own outcome check.

---

## 3. **Reduce flakiness in Start menu**

**Current:** Open Start → hover Programs → hover subfolder → click item. Hover timing can be flaky.

**Suggestions:**

- After opening the submenu, **wait for the target menu item** before clicking:  
  `await page.locator(app.startId).waitFor({ state: 'visible', timeout: 3000 })`.
- Optionally add a short **delay after hover** (e.g. 100–200 ms) so the submenu has time to expand, or use Playwright’s **`locator.hover()` then `locator.click()`** in sequence with an explicit wait for the item to be visible.

---

## 4. **Shared helpers and boot handling** ✓

**Done:**

- **`e2e/helpers.js`** exports `dismissBootScreen(page)`, `openFromStartMenu(page, subFolder)`, `closeAppWindow(page, windowId)`, and `runAppTest(page, windowId, expect)` for the full per-app flow.
- **`e2e/apps/apps-config.js`** holds the app list (startId, windowId, subFolder, interact, assertAfterInteract). The main smoke and per-app specs both use it.

---

## 5. **Cover more flows**

**Current:** Only “Start menu → open app → interact → close”. No desktop, no taskbar.

**Suggestions:**

- **Desktop double-click:** One test that double-clicks a desktop icon (e.g. “My Resume” / Word) and asserts the app window appears.
- **Taskbar:** One test that opens an app, clicks its taskbar button (minimize/restore or focus), then asserts the window is still visible or becomes visible again.
- **Second app:** Open two apps (e.g. Notepad then Calculator), assert both windows exist, then close one and assert the other is still there (basic multi-window behavior).

---

## 6. **Cover all registry apps (or document the gap)**

**Current:** Not every app in `appRegistry` is in the E2E list (e.g. Paint, IE5, Defrag, Control Panel, My Computer, THPS2, TIM).

**Suggestions:**

- Either **add minimal entries** for the rest (open + simple interact + close) so the list is complete, or
- **Document** in the spec or in AGENTS.md that the E2E list is a curated “smoke” set and which apps are intentionally excluded (and why), so future changes don’t assume full coverage.

---

## 7. **Stable selectors and test IDs**

**Current:** Some selectors rely on implementation details (e.g. `.vb6-run-window .vb6-mdi-controls button:has-text("X")`).

**Suggestions:**

- Where it helps, add **`data-testid`** (or a dedicated `data-e2e`) on critical elements (e.g. “Bold” button, calculator display, run-window close) and use those in E2E so refactors don’t break tests.
- Document in AGENTS.md or in the E2E file that new apps should add test IDs for key actions if they’re included in the E2E suite.

---

## 8. **Config and base URL**

**Current:** `baseURL: 'http://localhost:8080'` and `webServer` runs build + Python HTTP server. Good for static export.

**Suggestions:**

- Consider **`reuseExistingServer: true`** only when not in CI (already the case with `!process.env.CI`). In CI, always start the server so the run is self-contained.
- If you add **multiple projects** (e.g. firefox, webkit), share the same `apps` array and boot helper so all browsers run the same app list without duplication.

---

## 9. **Performance and run time**

**Current:** One long test; full boot + many apps in sequence can take a while.

**Suggestions:**

- With **per-app tests**, you can run **`--grep calculator`** (or one worker) during development for faster feedback.
- If you split tests, consider a **`test.beforeEach`** that only dismisses boot once per test file and reuses the same page (or use a **global setup** that does boot once and then each test assumes desktop is ready) to avoid repeating the 3–4 second boot animation in every test.

---

## 10. **Summary priority**

| Priority | Suggestion                                                                        |
| -------- | --------------------------------------------------------------------------------- |
| High     | Use `test.step` per app (or one test per app) so failures are clearly attributed. |
| High     | Add at least one outcome assertion (e.g. Calculator display = 8 after 5+3=).      |
| Medium   | Wait for Start menu item visibility before click to reduce flakiness.             |
| Medium   | Extract boot dismissal and Start menu navigation into shared helpers.             |
| Medium   | Add one desktop double-click test and one taskbar test.                           |
| Low      | Add `data-testid` for critical elements; document E2E coverage vs registry.       |

Implementing the high-priority items (steps + one or two assertions) gives the biggest improvement for relatively little change.
