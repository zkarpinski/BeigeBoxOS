# AGENTS.md — Retro web desktops

Monorepo: **`os/win98`**, **`os/winxp`**, **`os/karpos`**, plus **`packages/core`** and **`packages/apps/*`** (e.g. `@retro-web/app-minesweeper`, `@retro-web/app-winamp`). Each OS is its own Next.js app (static export). Shared logic lives in `@retro-web/core`; most Win98 app UIs live under `os/win98/app/components/apps/` and are reused by KarpOS via TypeScript path aliases (`@win98/*`, `@/app/*` → win98 app). **Packaged apps** that ship one implementation across OSes live under `packages/apps/<name>` with default theme CSS and optional per-host skin sheets (see **Packaged apps** below).

### Packaged apps (`@retro-web/app-*`)

Complex or cross-desktop apps may live in **`packages/apps/<name>`** (workspace package `@retro-web/app-<name>`): game logic, hooks, presentational components, and tests stay in the package; **window chrome** still comes from the host via **`useOsShell()`**. **Default look** is shipped as **`themes/<default>.css`** (e.g. Win98 for Minesweeper). Hosts that need a different look import an extra sheet (e.g. **`themes/karpos.css`**) **after** the default and pass a matching **`skin`** prop so selectors like **`[data-minesweeper-skin="karpos"]`** apply. Convention and types: **`packages/core/types/skinable-app.ts`**; Minesweeper is the reference implementation.

**KarpOS** (`os/karpos`) — Personal playground shell: **neo-brutalist** theme (see `karpos-theme.css`), not a replica of a real OS. It provides its own `AppWindow` / `TitleBar` (`components/karpos-shell/`), **`KarposTaskbar`** (`components/karpos-desktop/KarposTaskbar.tsx`) + **`KarposApplicationsMenu`** (Win98’s `Taskbar` / `StartMenuTree` are **not** modified for KarpOS), imports the same app windows as Win98, and uses a separate virtual FS key (`karpos-filesystem`). KarpOS passes **`applyOpenByDefault={false}`** on **`WindowManagerProvider`** so nothing opens at boot from registry `openByDefault` (shared Win98 apps like AIM would otherwise auto-open). **`?app=`** / **`initialOpenAppId`** still opens a single app. The **Start** button opens a **macOS-style Applications** grid (`KarposApplicationsMenu.tsx`): every app with a `startMenu` config appears either in the main grid (**`path` has one segment**, e.g. `['Programs']`, `['Settings']`) or inside a **folder tile** when **`path` has two or more segments** (grouped by `path.slice(1).join(' / ')` — same idea as Win98’s Programs › Accessories). `startMenu: false` excludes an app from the launcher. Run: `pnpm dev:karpos` / `pnpm build:karpos`.

- **Static assets** — `os/karpos/public` is a real directory: KarpOS favicons / PWA icons, `site.webmanifest`, **`robots.txt`**, and **`sitemap.xml`** (karpos.zkarpinski.com) live here. **`apps/`**, **`shell/`**, `boot-check.js`, `_headers`, `_redirects` are **symlinks** into `os/win98/public` so shared app/shell media is not duplicated.

### OS shell theming (`OsShellProvider` / `useOsShell`)

- **Window chrome** — In shared or cross-OS app windows, get **`AppWindow`**, **`TitleBar`**, and **`MenuBar`** from **`useOsShell()`** (`@retro-web/core/context`). Do **not** import those from `../win98`, `../winxp`, or `../karpos-shell` inside `*Window.tsx` files that should match whichever desktop is running (Win98, WinXP, or KarpOS). Each OS **`Desktop.tsx`** wraps the tree with **`OsShellProvider`** and passes that OS’s implementations (see `packages/core/context/OsShellContext.tsx`, `packages/core/types/os-shell.ts`).
- **Inside the window** — Toolbars (`ToolbarRow`, …), custom menus (e.g. Word’s `WordMenuBar`), and app-specific CSS may still live under `os/<name>/app/components/apps/<name>/` or use per-OS CSS variables (`--win-bg`, etc.) so content can differ by OS without duplicating window chrome.
- **KarpOS** currently reuses the Win98 **`MenuBar`** implementation via path alias for consistency with imported Win98 apps; the **title bar** remains KarpOS-styled via `karpos-shell`.

---

## Architecture (Win 98 package)

- **Shell state** — `WindowManagerContext` (`app/context/WindowManagerContext.tsx`): visibility, focus, minimize, bounds. Use `useWindowManager()` for `showApp`, `hideApp`, `focusApp`, `minimizeApp`, `setBounds`.
- **App windows** — React components wrapped in **`AppWindow`** (`app/components/win98/`), which handles title bar, drag, resize, min/max/close, z-index.
- **Registry** — `app/registry.ts` holds `appRegistry` (array of `AppConfig`). Page renders all windows + shell (BootScreen, DesktopIcons, Taskbar, ShellOverlays) inside `WindowManagerProvider`.
- **Shared Win98 UI** — `app/components/win98/`: `AppWindow`, `TitleBar`, `MenuBar`, and **toolbar** (`ToolbarRow`, `Toolbar`, `ToolbarButton`, `ToolbarSeparator`, `ToolbarSelect`). For apps reused on multiple OSes, prefer **`useOsShell()`** for `AppWindow` / `TitleBar` / `MenuBar` (see above).

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

- `app/components/apps/<name>/<Name>Window.tsx` — React component that renders inside `AppWindow` with `TitleBar` and app content. Use **`useOsShell()`** for `AppWindow`, `TitleBar`, and **`MenuBar`** when the app should match the host OS shell (Win98 / WinXP / KarpOS).
- `app/components/apps/<name>/<name>.css` — window and app-specific styles.
- Export `{Name}Window` and `{Name}AppConfig` from `app/components/apps/<name>/index.ts` (or from the window file and re-export).

### 2. Wire up shell and layout

- **Registry:** Add the app’s `AppConfig` to the `appRegistry` array in `app/registry.ts`.
- **Page:** Import and render `<{Name}Window />` in `app/page.tsx` (inside `WindowManagerProvider`).
- **CSS:** Import the app’s CSS in `app/layout.tsx` (e.g. `'./components/apps/<name>/<name>.css'`).
- **Assets:** Put images/audio in `public/apps/<name>/` and reference with root-relative paths (e.g. `apps/<name>/icon.png`).

### 3. Use AppWindow and shell state

- In `<Name>Window.tsx`, use **`const { AppWindow, TitleBar, MenuBar } = useOsShell()`** (and `writeFile` if saving files). Wrap content with `<AppWindow id="<name>-window" appId="<name>" className="app-window ..." titleBar={<TitleBar ... />} ...>`. Use `useWindowManager()` for `hideApp`, `showApp`, etc. as needed.
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

- **Monorepo (Jest via Turbo):** `npm run test` — runs `turbo test` across packages (`@retro-web/core`, `@retro-web/win98`, `@retro-web/karpos`, `@retro-web/winxp`, etc.). **Do not merge** if this fails.
- **Single package:** e.g. `pnpm --filter @retro-web/win98 test`, `pnpm --filter @retro-web/karpos test`.
- **E2E (Playwright):** `npm run e2e` / `npx playwright test` — Win98 `e2e/os/win98/apps.spec.js` opens apps from the Start menu; `e2e/os/win98/performance.spec.js` checks load and paint timings.

### Format + verify (agents & CI)

Every change that touches tracked files should **pass Prettier** and **`npm run test`** before merge:

1. **Prettier** — Config: `.prettierrc`. **Check (no writes):** `pnpm exec prettier --check .` — must report _All matched files use Prettier code style!_ **Fix:** `pnpm fmt` (root script: `prettier --write .`) or `pnpm exec prettier --write .` on specific paths.
2. **Tests** — `npm run test` (see above).

Run both after substantive edits; CI should enforce the same.

### Adding tests

**Unit / functional (Jest)**

- Add `*.test.ts` or `*.test.tsx` next to the module or under `test/`. Use React Testing Library for components (`render`, `screen`, `userEvent`). Mock browser APIs in `test/setup.js` if needed (e.g. `document.execCommand`). Run with `pnpm --filter @retro-web/<package> test` or `npm run test` for the whole monorepo.
- Cover core behavior: rendering, user actions, and any non-trivial logic (e.g. sanitizer, persistence). Path alias `@/` is resolved via Jest `moduleNameMapper` in `package.json`.

**E2E (Playwright)**

- Add the app to the `apps` array in `e2e/apps.spec.js`. Each entry needs: `subFolder` (e.g. `'Accessories'`, `'Games'`, or `null` for Programs root), `startId` (e.g. `'#start-menu-<appId>'`), `windowId` (e.g. `'#<appId>-window'`), optional `titleSelector`, and `interact(page)` — at least one meaningful action (click, fill) inside the window. The spec closes the window via the title bar `[data-win-close]` button. See the comment at the top of `e2e/apps.spec.js` for the full template.

---

## Key Conventions

- **Registry:** Add `AppConfig` to `appRegistry`; shell uses it for Taskbar, Start menu, Desktop.
- **OsShell:** Use `useOsShell()` for `AppWindow`, `TitleBar`, and `MenuBar` in cross-OS windows; do not hard-import shell components from a single OS package.
- **AppWindow:** `allowResize: false` by default. If using `getCanDrag`, include the enabling class in initial `className` so the window is draggable on load (e.g. Word’s `windowed`).
- **Icons:** `public/apps/<name>/` or `public/shell/icons/`. See `MISSING_ICONS.md` if present.
- **Styles:** Prefer CSS classes; `style` only for dynamic values (position, size).
- **Tests:** Add new apps to E2E `apps` array; add unit tests as needed. **Prettier + `npm run test`** before merge (see **Format + verify** above).
