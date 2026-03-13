# AGENTS.md — Windows 98 Desktop Site

A nostalgic Windows 98 desktop simulator. Static site: vanilla HTML/CSS/JS, no framework, no build step required, deployable to S3.

---

## Project Structure

```
index.html              — Single-page app; all windows and menus live here
style.css               — Global styles and shell CSS (taskbar, start menu, desktop)
shell/                  — Core OS shell scripts
  windows97.js          — App registry (registerApp / showApp / hideApp)
  windowChrome.js       — Reusable window chrome (title bar, drag, resize, taskbar wiring)
  taskbar.js            — Taskbar and Start menu logic
  shutdown.js           — Shutdown dialog
  state.js              — localStorage persistence (Word editor state + booted flag)
  bsod.js               — Blue Screen of Death overlay
  dialog.js             — Generic modal dialogs
apps/<name>/            — One folder per app
  <name>.css            — App-specific styles
  <name>.js             — App logic (IIFE, exports namespace to window)
  window.js             — Shell registration (attachWindowChrome + registerApp)
scripts/build.js        — Minify/bundle to dist/. --bundle inlines everything.
e2e/apps.spec.js        — Playwright end-to-end tests
```

---

## Adding a New App — Checklist

Every new app must complete **all** of these steps:

### 1. Create app files
- `apps/<name>/<name>.css` — window and app styles
- `apps/<name>/<name>.js` — app logic wrapped in IIFE, exports `window.AppName`
- `apps/<name>/window.js` — shell registration (see pattern below)

### 2. Add HTML to `index.html`
- Window div with `id="<name>-window"` and class `app-window`
- Taskbar button with `id="taskbar-<name>"`
- `<link>` for the CSS in the `<head>` alongside the other app stylesheets
- `<script>` tags at the bottom for each JS file, in order: `<name>.js` then `window.js`

### 3. Register with the shell (`window.js` pattern)
```js
(function () {
  'use strict';

  const win = document.getElementById('<name>-window');
  if (!win) return;

  if (window.attachWindowChrome) {
    attachWindowChrome({
      windowEl: win,
      appId: '<name>',
      taskbarId: 'taskbar-<name>',
      minimizedClass: 'minimized',
      maximizedClass: 'maximized',
      allowResize: true,          // false if the window should not be resizable
      onClose: function () {
        if (window.Windows97) window.Windows97.hideApp('<name>');
      },
      getCanDrag: function (el) {
        return !el.classList.contains('maximized');
      },
    });
  }

  if (window.Windows97) {
    window.Windows97.registerApp({
      id: '<name>',
      windowId: '<name>-window',
      taskbarId: 'taskbar-<name>',
      startMenuId: 'start-menu-<name>',  // matches the Start menu item id
      openByDefault: false,
    });
  }
})();
```

### 4. Add to Start menu under Programs (`index.html`)
All apps must appear under **Programs** in the Start menu. Place them in the appropriate subfolder:

| Subfolder | Apps |
|-----------|------|
| Accessories | Calculator, Notepad, Paint |
| Entertainment | Winamp |
| Games | Minesweeper, 3D Pinball, THPS2, TIM |
| Internet | AIM, IE5, Napster, Netscape Navigator |
| System Tools | Defrag |
| _(Programs root)_ | Word, VB6 |

Start menu item pattern:
```html
<div class="start-menu-item" id="start-menu-<name>">
    <img src="..." class="sm-icon" alt="">
    <span class="sm-label">App Name</span>
</div>
```
Use `assets/icons/executable-0.png` as a placeholder icon when no proper icon exists.

### 5. Add to `scripts/build.js`
- CSS path → `localCss` array
- JS files → `localScripts` array (in dependency order; `window.js` after `<name>.js`)
- If the app exports a global → add it to the `reserved` array so it isn't mangled
- **Every local image, audio, or other binary asset used by the app must be added to `staticAssets`** — this is what gets copied into `dist/` on build. Missing entries will cause broken images/audio in the deployed build.

```js
// In scripts/build.js staticAssets array:
'apps/<name>/<name>-icon.png',
'apps/<name>/some-audio.mp3',
```

The rule: if it's referenced by a local path in HTML, CSS, or JS (i.e. not an `https://` CDN URL), it must be in `staticAssets`. Icons from `win98icons.alexmeub.com` and other CDN URLs are exempt — they load at runtime.

### 6. Add to Playwright tests (`e2e/apps.spec.js`)
Every new app must be added to the `apps` array in the test:
```js
{
  subFolder: 'Accessories',              // Start menu subfolder (null if directly under Programs)
  startId: '#start-menu-<name>',         // Start menu item id
  windowId: '#<name>-window',            // Window element id
  titleSelector: '#<name>-window .title-bar-text .title-text',
  interact: async (p) => { /* click something meaningful in the app */ },
},
```

---

## Code Style

### JavaScript
- All JS wrapped in `(function () { 'use strict'; ... })();` IIFEs
- Apps export a single namespace: `window.AppName = { ... }`
- No frameworks, no ES modules (except the ClippyJS CDN import which is unavoidable)
- Prefer `var` in shell/window registration scripts; `const`/`let` fine inside app logic IIFEs
- DOM queries via `document.getElementById` — no jQuery

### CSS
- All app windows use CSS variables from `style.css`:
  - `--win-bg` — standard window background (grey)
  - `--win-dark` — dark shadow border color
  - `--win-black` — darkest border
  - `--win-light` — light highlight
  - `--win-white` — lightest highlight / inset background
  - `--title-active` — active title bar gradient
  - `--desktop-bg` — desktop background color
- Win98 3D raised border: `border-top/left: 1px solid var(--win-white); border-right/bottom: 1px solid var(--win-black)`
- Win98 inset border (reverse): `border-top/left: 1px solid var(--win-dark); border-right/bottom: 1px solid var(--win-white)`
- App windows must hide when minimized: `.app-window-hidden, .minimized { display: none !important; }`
- Font: `'MS Sans Serif', 'Microsoft Sans Serif', Tahoma, Arial, sans-serif` at `11px`

### Z-index hierarchy
| Layer | Z-index |
|-------|---------|
| App windows (base) | 10 |
| App windows (focused) | 11 |
| Taskbar | 1000 |
| ClippyJS agents (CDN) | 10001 |
| Start menu | 10100 |
| Start menu submenus | 10101 |
| Control Panel dialog | 10200 |
| BSOD | 99999 |
| Boot screen | 999999 |

---

## Shell API Reference

### `Windows97.registerApp(config)`
Registers an app with the shell. Must be called from `window.js` after the DOM is ready.
- `id` — unique app identifier
- `windowId` — id of the window element
- `taskbarId` — id of the taskbar button
- `startMenuId` — id of the Start menu item
- `openByDefault` — `true` to show the window on page load

### `Windows97.showApp(id)` / `Windows97.hideApp(id)`
Show or hide a registered app window and update the taskbar.

### `attachWindowChrome(config)`
Attaches title bar, drag, resize grip, minimize/maximize/close buttons to a window element.
- `allowResize: true` adds a bottom-right resize grip
- `getCanDrag(el)` — return `false` to disable dragging (e.g. when maximized)
- `onClose` — called when the X button is clicked

### `Windows97.bsod([options])`
Triggers the BSOD overlay. Pass `{ clearStorage: true, reload: true }` to wipe state and reload.

---

## Testing

Run tests: `npx playwright test`

The test (`e2e/apps.spec.js`) blocks all external HTTPS requests to prevent CDN and iframe resources from hanging the `load` event. It then:
1. Dismisses the boot screen
2. For each app: opens via Start menu (navigating the Programs subfolder hierarchy), verifies the window is visible, interacts with the app, closes it, and verifies it's hidden

**New apps must be added to the test** — do not ship an untested app.

---

## Build & Deploy

```bash
node scripts/build.js              # Lint/validate local files → dist/
node scripts/build.js --bundle     # Inline all CSS+JS into a single HTML file
node scripts/build.js --obfuscate  # Bundle + mangle JS identifiers
```

Deploys to S3 as a static site. The `dist/` directory is the deployable artifact.

---

## Key Conventions

- **No auto-start**: Apps should not start running on `showApp` — wait for user interaction (e.g. a Start button)
- **No resize by default**: Set `allowResize: false` unless the app genuinely benefits from resizing
- **Desktop icon double-click**: Implement a 350ms double-click timer (see any `window.js` for the pattern)
- **Avoid inline styles**: Use CSS classes; only set `style` for dynamic values (position, size, wallpaper)
- **Don't touch `shell/windows97.js` for new apps**: The shell is generic — apps register themselves
- **Icons**: Prefer icons from `https://win98icons.alexmeub.com/icons/png/<name>.png`; fall back to `assets/icons/executable-0.png`
