# Adding a New OS to retro-web

This guide explains how to scaffold a new OS in the monorepo, following the established patterns from `os/win98`, `os/karpos`, and `os/macosx`.

## Directory structure

```
os/<osname>/
  package.json          # @retro-web/<osname>, references shared packages
  next.config.js        # extends @retro-web/config/next, transpiles packages
  tsconfig.json         # extends @retro-web/config/tsconfig, adds @/* path
  app/
    globals.css         # box-sizing reset, html/body 100%
    layout.tsx          # Next.js RootLayout — imports CSS, sets <body className="<osname>-desktop">
    page.tsx            # default export renders <Desktop />
    registry.ts         # appRegistry: AppConfig[] — list of apps for this OS
    fileSystem.ts       # localStorage-backed virtual FS (copy and adapt from karpos)
    styles/
      <osname>-theme.css  # CSS custom properties on body.<osname>-desktop
      <osname>-shell.css  # Window chrome, taskbar/dock/menubar, desktop icons, overlays
      <osname>-apps.css   # Per-app default sizes, skin overrides
    components/
      <osname>-shell/     # OS chrome components (AppWindow, TitleBar, MenuBar, GlobalShim)
        AppWindow.tsx
        TitleBar.tsx
        MenuBar.tsx
        <Os>GlobalShim.tsx
        index.ts
      <osname>-desktop/   # Layout components (Desktop, Dock/Taskbar, Icons, Overlays)
        desktop.tsx
        <Os>Taskbar.tsx   # or <Os>Dock.tsx
        <Os>DesktopIcons.tsx
        <Os>ShellOverlays.tsx
        <Os>MenuBar.tsx   # (if system-level menu bar)
```

## Step-by-step

### 1. Create `os/<osname>/package.json`

```json
{
  "name": "@retro-web/<osname>",
  "version": "0.0.1",
  "private": true,
  "scripts": { "dev": "next dev", "build": "next build", "start": "next start" },
  "dependencies": {
    "@retro-web/core": "workspace:*",
    "@retro-web/app-calculator": "workspace:*",
    "@retro-web/app-minesweeper": "workspace:*",
    "next": "catalog:default",
    "react": "catalog:default",
    "react-dom": "catalog:default"
  },
  "devDependencies": {
    "@retro-web/config": "workspace:*",
    "@types/react": "catalog:default"
  }
}
```

### 2. Create `next.config.js`

```js
// @ts-check
const { createNextConfig } = require('@retro-web/config/next');
module.exports = createNextConfig({
  transpilePackages: ['@retro-web/core', '@retro-web/app-calculator', ...],
});
```

### 3. Create `tsconfig.json`

```json
{
  "extends": "@retro-web/config/tsconfig",
  "compilerOptions": {
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"],
      "@win98/*": ["../win98/app/*"] // only if you reuse Win98 components
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 4. Implement `OsShellValue` in shell components

`OsShellProvider` (from `@retro-web/core/context`) requires:

```ts
interface OsShellValue {
  AppWindow: React.ComponentType<AppWindowProps>;
  TitleBar: React.ComponentType<TitleBarProps>;
  MenuBar: React.ComponentType<MenuBarProps>;
  writeFile: (path: string, content: string) => void;
}
```

**`AppWindow.tsx`**: Copy `os/win98/app/components/win98/AppWindow.tsx`. For OSes with active-window styles, compare `appState.zIndex === Z_FOCUSED` (exported from `@retro-web/core/context`) and toggle a CSS class (`mac-active`, etc.).

**`TitleBar.tsx`**: Render OS-specific chrome. Wire `data-win-close`, `data-win-min`, `data-win-max` attributes — `AppWindow` queries these after mount. Put the close/min/max buttons inside a `title-bar-controls` class element so dragging works correctly (the drag handler ignores events inside `.title-bar-controls`).

**`MenuBar.tsx`**: Either a standalone component or wrap the shared Win98 `MenuBar` in an OS-styled container (see `os/macosx`).

### 5. Style tokens in `<osname>-theme.css`

Use `body.<osname>-desktop { --token: value; }` scoping. Remap Win98 compat tokens so shared apps work:

```css
body.<osname > -desktop {
  --win-bg: /* window background */;
  --win-dark: /* shadow color */;
  --title-active: /* active title bar color */;
  --taskbar-bg: /* taskbar/dock background */;
}
```

### 6. Window skin overrides in `<osname>-apps.css`

Shared apps (calculator, minesweeper) read a `data-*-skin` attribute:

```css
body.<osname>-desktop [data-calculator-skin='<osname>'] { ... }
body.<osname>-desktop [data-minesweeper-skin='<osname>'] { ... }
```

Pass `skin="<osname>"` to `<CalculatorWindow>` and `<MinesweeperWindow>`.

### 7. Wire up `taskbarReservePx()` in `useWindowBehavior`

If your OS has a dock/taskbar at the bottom, add your body class to the check in `packages/core/hooks/useWindowBehavior.ts`:

```ts
function taskbarReservePx(): number {
  if (typeof document === 'undefined') return 28;
  const cl = document.body.classList;
  return cl.contains('karpos-desktop') || cl.contains('<osname>-desktop') ? 52 : 28;
}
```

### 8. Register in root `package.json`

```json
{
  "scripts": {
    "dev:<osname>": "pnpm --filter @retro-web/<osname> dev",
    "build:<osname>": "turbo build --filter=@retro-web/<osname>"
  }
}
```

## Shared components you can reuse

| Component           | Source                                         | Notes                                                                               |
| ------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| `DialogModal`       | `@win98/components/shell/overlays/DialogModal` | Win98 dialog box; restyled via CSS overrides on `body.<osname>-desktop .dialog-box` |
| `MenuBar`           | `@win98/components/win98/MenuBar`              | Generic dropdown menu bar; wrap in an OS-styled container                           |
| `AppWindow` logic   | `os/win98/app/components/win98/AppWindow.tsx`  | Copy and extend for OS-specific active/inactive state                               |
| `NotepadWindow`     | `@retro-web/core/apps/notepad`                 | Shared TextEdit/Notepad app                                                         |
| `CalculatorWindow`  | `@retro-web/app-calculator`                    | Pass `skin="<osname>"`                                                              |
| `MinesweeperWindow` | `@retro-web/app-minesweeper`                   | Pass `skin="<osname>"`                                                              |
| `PdfReaderWindow`   | `@retro-web/app-pdf-reader`                    | No skin prop needed                                                                 |

## CSS selector conventions

- `body.<osname>-desktop` — all OS-specific rules live under this scope
- `.app-window-hidden` — hidden window (display: none)
- `.win-minimizing` — minimize animation class
- `.win-resize-grip` — bottom-right resize handle
- `[data-<app>-skin='<osname>']` — per-app skin overrides
- `#taskbar` / `#mac-dock` — fixed shell bars (queried by boot/reveal logic)
- `#desktop-icons` — fixed desktop icon container

## Running locally

```bash
pnpm install          # pick up the new workspace package
pnpm dev:<osname>     # start Next.js dev server
```
