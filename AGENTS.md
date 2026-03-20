# AGENTS.md — Windows 98 Desktop Site

A nostalgic Windows 98 desktop simulator. **React/Next.js** app with static export. Apps and shell are React components.

---

## Architecture

- **Shell state** — `WindowManagerContext` (`app/context/WindowManagerContext.tsx`): visibility, focus, minimize, bounds. Use `useWindowManager()` for `showApp`, `hideApp`, `focusApp`, `minimizeApp`, `setBounds`.
- **App windows** — React components wrapped in **`AppWindow`** (`app/components/win98/`), which handles title bar, drag, resize, min/max/close, z-index.
- **Registry** — `app/registry.ts` holds `appRegistry` (array of `AppConfig`). Page renders all windows + shell (BootScreen, DesktopIcons, Taskbar, ShellOverlays) inside `WindowManagerProvider`.
- **Shared Win98 UI** — `app/components/win98/`: `AppWindow`, `TitleBar`, `MenuBar`, and **toolbar** (`ToolbarRow`, `Toolbar`, `ToolbarButton`, `ToolbarSeparator`, `ToolbarSelect`).

---

## Project Structure

```
app/
  layout.tsx            — Metadata, global CSS imports (style, shell, win98/toolbar, apps)
  page.tsx              — Client page: WindowManagerProvider, all app windows, BootScreen, DesktopIcons, Taskbar, ShellOverlays
  style.css             — Global styles, CSS variables, app-window base (e.g. position for z-index)
  globals.css           — Minimal baseline
  context/
    WindowManagerContext.tsx  — Shell state: apps visibility, focus, bounds, dialogs, BSOD
  components/
    shell/              — React shell (BootScreen, Taskbar, DesktopIcons, StartMenuTree, ShellOverlays) + CSS
    win98/               — Shared Win98 UI
      AppWindow.tsx      — Window chrome: drag, resize, min/max/close, z-index
      TitleBar.tsx       — Title bar with optional min/max/close
      MenuBar.tsx        — Menu bar with dropdowns
      toolbar/           — Shared toolbar components (see below)
        Toolbar.tsx      — ToolbarRow, Toolbar, ToolbarButton, ToolbarSeparator, ToolbarSelect
        toolbar.css      — Win98 toolbar styles (imported in layout)
        index.ts
    apps/<name>/        — One folder per app: <Name>Window.tsx, app config, CSS, tests
  registry.ts           — appRegistry: AppConfig[] (used by Taskbar, DesktopIcons, page)
  types/app-config.ts   — AppConfig interface
public/                 — Static assets
  shell/, apps/<name>/  — Icons, images, sounds per shell or app
e2e/                    — Playwright E2E tests
test/                   — Jest unit tests (e.g. word, shell, calculator)
```

**Build & run:** `npm run build` → static export (e.g. `out/`). `npm run dev` → Next.js dev server.

---

## Shared Components (win98)

### AppWindow

Wraps each app window; handles visibility, z-index, bounds, and attaches drag/resize/min/max/close to the title bar.

- **Props:** `id`, `appId`, `className`, `titleBar`, `children`, `allowResize`, `maximizedClass`, `onClose`, `getCanDrag`.
- **Drag:** Active only when `getCanDrag(el)` is true (default: element does not have `maximizedClass`). To be draggable on load, include the enabling class in initial `className` (e.g. Word: `windowed`).

### TitleBar, MenuBar

- **TitleBar:** Renders the title bar; `AppWindow` finds `.title-bar` and `[data-win-min]` / `[data-win-max]` / `[data-win-close]` to wire minimize/maximize/close and drag.
- **MenuBar:** Optional menu bar with dropdowns; see existing apps for `MenuItemConfig` / `MenuDropdownItem`.

### Toolbar (win98/toolbar)

Shared toolbar primitives for Word, VB6, and other apps. Styles live in `app/components/win98/toolbar/toolbar.css` (imported in `layout.tsx`).

| Component            | Purpose                                                                                                                                            |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ToolbarRow**       | One row; optional left gripper. Props: `children`, `showGripper?` (default true), `className?`.                                                    |
| **Toolbar**          | Flex container for buttons/selects. Props: `children`, `className?` (e.g. `"standard-toolbar"`, `"vb6-toolbar"`).                                  |
| **ToolbarButton**    | Single button. Props: `children`, `title?`, `onClick?`, `active?`, `className?`, `style?`. Use `<span className="icon">…</span>` for icon content. |
| **ToolbarSeparator** | Vertical divider between groups.                                                                                                                   |
| **ToolbarSelect**    | `<select>` in toolbar. Props: `children`, `value?`, `defaultValue?`, `onChange?`, `title?`, `className?`.                                          |

**Example (add a toolbar to an app):**

```tsx
import { ToolbarRow, Toolbar, ToolbarButton, ToolbarSeparator } from '@/app/components/win98';

<ToolbarRow>
  <Toolbar>
    <ToolbarButton title="New" onClick={onNew}>
      <span className="icon">📄</span>
    </ToolbarButton>
    <ToolbarSeparator />
    <ToolbarButton title="Bold" active={bold} onClick={onBold}>
      B
    </ToolbarButton>
  </Toolbar>
</ToolbarRow>;
```

Use `showGripper={false}` on `ToolbarRow` for a bar without the gripper (e.g. VB6). App-specific classes (e.g. Word’s `format-btn`, `zoom-select`) can be passed via `className` and styled in the app’s CSS.

---

## Adding a New App — Checklist

Every new app must complete **all** of these steps:

### 1. Create app files

- `app/components/apps/<name>/<Name>Window.tsx` — React component that renders inside `AppWindow` (from win98) with `TitleBar` and app content.
- `app/components/apps/<name>/<name>.css` — window and app-specific styles.
- Export `{Name}Window` and `{Name}AppConfig` from `app/components/apps/<name>/index.ts` (or from the window file and re-export).

### 2. Wire up shell and layout

- **Registry:** Add the app’s `AppConfig` to the `appRegistry` array in `app/registry.ts`.
- **Page:** Import and render `<{Name}Window />` in `app/page.tsx` (inside `WindowManagerProvider`).
- **CSS:** Import the app’s CSS in `app/layout.tsx` (e.g. `'./components/apps/<name>/<name>.css'`).
- **Assets:** Put images/audio in `public/apps/<name>/` and reference with root-relative paths (e.g. `apps/<name>/icon.png`).

### 3. Use AppWindow and shell state

- In `<Name>Window.tsx`, wrap content with `<AppWindow id="<name>-window" appId="<name>" className="app-window ..." titleBar={<TitleBar ... />} ...>`. Use `useWindowManager()` for `hideApp`, `showApp`, etc. as needed.
- Ensure the window has a stable `id` and `appId` that match the `AppConfig.id` used in the registry (so Taskbar and Start menu can show/focus the correct window).

### 4. Add to Start menu under Programs

All apps must appear under **Programs** in the Start menu. Place them in the appropriate subfolder:

| Subfolder         | Apps                                  |
| ----------------- | ------------------------------------- |
| Accessories       | Calculator, Notepad, Paint            |
| Entertainment     | Winamp                                |
| Games             | Minesweeper, 3D Pinball, THPS2, TIM   |
| Internet          | AIM, IE5, Napster, Netscape Navigator |
| System Tools      | Defrag                                |
| _(Programs root)_ | Word, VB6                             |

Set `AppConfig.startMenu` (e.g. `{ path: ['Programs', 'Accessories'] }`) so the app appears in the Start menu.

### 5. Add to Playwright tests (`e2e/apps.spec.js`)

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

### TypeScript / React

- Use `AppConfig` from `app/types/app-config`. Prefer `const`/`let`. Path alias `@/` for app imports when configured.

### CSS

- All app windows use CSS variables from `app/style.css`:
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
- Asset URLs in CSS must be absolute: `url('/apps/<name>/image.png')` not relative paths

### Z-index hierarchy

- **App windows** use inline `zIndex` from `WindowManagerContext` (base 10, focused 11). The base class `.app-window` has `position: relative` in `style.css` so that `z-index` takes effect and windows stack above the desktop icons (z-index 1).
  | Layer | Z-index |
  |-------|---------|
  | Desktop icons | 1 |
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

## Shell API Reference (WindowManagerContext)

Use **`useWindowManager()`** from `app/context/WindowManagerContext` inside any component under `WindowManagerProvider`. It provides:

| Method / state                                                           | Description                                                                                    |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| **showApp(id)**                                                          | Show the app window and bring it to front.                                                     |
| **hideApp(id)**                                                          | Hide the app window (and update taskbar).                                                      |
| **focusApp(id)**                                                         | Bring the app to front (higher z-index). Called by `AppWindow` on mousedown inside the window. |
| **minimizeApp(id)**                                                      | Hide the window but keep it on the taskbar (visible/minimized state).                          |
| **setBounds(id, bounds)**                                                | Update stored position/size (used by `AppWindow` after drag/resize).                           |
| **apps**                                                                 | `Record<string, AppState>` — visibility, minimized, zIndex, bounds per app.                    |
| **openDialog**, **openBsod**, **openFatalError**, **shutdownOpen**, etc. | Shell overlays and dialogs.                                                                    |

Add **`AppConfig`** to **`appRegistry`** in `app/registry.ts` to register an app.

Use `getCanDrag` and `maximizedClass` on `AppWindow` to control draggability. **BSOD:** `openBsod({ clearStorage: true, reload: true })`.

---

## Testing

- **Unit (Jest):** `npm run test:unit` — tests live under `test/` and next to app code (e.g. `app/components/apps/word/*.test.ts(x)`).
- **E2E (Playwright):** `npx playwright test` — `e2e/apps.spec.js` opens each app from the Start menu, interacts, then closes. `e2e/performance.spec.js` checks load and paint timings.

### Adding tests

**Unit / functional (Jest)**

- Add `*.test.ts` or `*.test.tsx` next to the module or under `test/`. Use React Testing Library for components (`render`, `screen`, `userEvent`). Mock browser APIs in `test/setup.js` if needed (e.g. `document.execCommand`). Run with `npm run test:unit` or `npm run test:unit -- --testPathPattern=word`.
- Cover core behavior: rendering, user actions, and any non-trivial logic (e.g. sanitizer, persistence). Path alias `@/` is resolved via Jest `moduleNameMapper` in `package.json`.

**E2E (Playwright)**

- Add the app to the `apps` array in `e2e/apps.spec.js`. Each entry needs: `subFolder` (e.g. `'Accessories'`, `'Games'`, or `null` for Programs root), `startId` (e.g. `'#start-menu-<appId>'`), `windowId` (e.g. `'#<appId>-window'`), optional `titleSelector`, and `interact(page)` — at least one meaningful action (click, fill) inside the window. The spec closes the window via the title bar `[data-win-close]` button. See the comment at the top of `e2e/apps.spec.js` for the full template.

---

## Key Conventions

- **Registry:** Add `AppConfig` to `appRegistry`; shell uses it for Taskbar, Start menu, Desktop.
- **AppWindow:** `allowResize: false` by default. If using `getCanDrag`, include the enabling class in initial `className` so the window is draggable on load (e.g. Word’s `windowed`).
- **Icons:** `public/apps/<name>/` or `public/shell/icons/`. See `MISSING_ICONS.md` if present.
- **Styles:** Prefer CSS classes; `style` only for dynamic values (position, size).
- **Tests:** Add new apps to E2E `apps` array; add unit tests as needed.
