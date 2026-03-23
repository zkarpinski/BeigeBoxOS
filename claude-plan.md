# Multi-OS Expansion Plan

## Goal

Expand the Win98 desktop simulator into a multi-OS platform supporting Win98 (current),
WinXP, macOS X, and future OSes. *(Windows 95 app removed from the repo for now; can be re-added from git history.)* Each OS builds and deploys as a standalone static site.
Shared code is organized in three tiers of packages — pure logic, cross-era complex apps,
and simple portable app content — with OS-specific code staying in its OS directory.

---

## Architecture: pnpm Workspaces Monorepo

Each OS is its own Next.js app. Shared code lives in workspace packages that each OS imports.
Turborepo manages the build graph so rebuilds are incremental and only affected packages
are rebuilt when something changes.

### Directory Structure

```
website/                              # Repo root (pnpm workspace + Turborepo)
├── packages/
│   ├── core/                         # Tier 1: pure logic — hooks, context, types, simple app content
│   │   ├── context/
│   │   │   └── WindowManagerContext.tsx
│   │   ├── hooks/
│   │   │   └── useWindowBehavior.ts
│   │   ├── types/
│   │   │   └── app-config.ts
│   │   └── apps/                     # Simple portable app content (see promotion criteria)
│   │       ├── calculator/
│   │       ├── notepad/
│   │       └── paint/
│   ├── apps/                         # Tier 2: cross-era complex apps (not simple enough for core)
│   │   ├── aim/                      # @retro-web/app-aim  — used by win98, winxp, macosx
│   │   ├── napster/                  # @retro-web/app-napster — used by win98, winxp
│   │   └── winamp/                   # @retro-web/app-winamp — used by win98, winxp
│   ├── assets/                       # Shared static assets (Windows-era icons, sounds)
│   │   ├── icons/                    # Common shell icons reused across Win98/XP
│   │   └── sounds/                   # Common sounds (startup.wav, error.wav, etc.)
│   └── config/                       # Shared tooling config (consumed by all packages)
│       ├── eslint.js                 # Base ESLint config
│       ├── tsconfig.base.json        # Base TypeScript config
│       └── next.config.base.js       # Shared Next.js config defaults
├── os/
│   ├── win98/                        # Windows 98 Next.js app (migrated from current root)
│   ├── winxp/                        # Windows XP Next.js app
│   └── macosx/                       # Mac OS X (Aqua) Next.js app
├── e2e/                              # Root-level E2E tests (parameterized by OS baseURL)
├── landing/                          # domain.com — plain static HTML OS picker
├── turbo.json                        # Turborepo task graph
├── pnpm-workspace.yaml
├── package.json                      # Root scripts delegating to turbo
└── tsconfig.base.json                # Re-exports packages/config tsconfig.base.json
```

Each OS directory follows this structure:

```
os/{name}/
├── app/
│   ├── page.tsx              # Root page (Desktop component)
│   ├── layout.tsx            # HTML root + CSS imports
│   ├── style.css             # OS-specific CSS variables (theme)
│   └── registry.ts           # Curated app list for this OS (id → component + config)
├── components/
│   ├── AppWindow.tsx         # OS-specific window chrome (uses useWindowBehavior from core)
│   ├── apps/                 # Thin index files: import content, export wrapped window component
│   │   ├── CalculatorWindow.tsx   # import CalculatorContent from core; wrap with AppWindow
│   │   └── AimWindow.tsx          # import AimApp from @retro-web/app-aim; wrap with AppWindow
│   └── shell/                # OS-specific shell (taskbar/dock, start menu/finder, etc.)
├── public/                   # OS-specific static assets (wallpapers, OS-exclusive icons)
├── test/                     # OS-specific Jest tests
└── next.config.js            # Extends packages/config/next.config.base.js
```

---

## Package: `packages/core`

### WindowManagerContext (OS-agnostic)

Extracted from the current `WindowManagerContext.tsx` with Win98-specific details removed:

- **State**: `visible`, `minimized`, `zIndex`, `bounds` per app
- **Actions**: `showApp`, `hideApp`, `focusApp`, `minimizeApp`, `setBounds`
- **Dialog system**: `openDialog`, `openBsod`, `openFatalError` — callbacks, not implementations
  (each OS implements its own BSOD, shutdown screens, etc.)
- **No `window.Windows98` shim** in core — each OS adds its own legacy compat layer if needed

### `useWindowBehavior` hook (new — extracted from AppWindow)

The current `AppWindow.tsx` mixes window chrome UI with drag/resize/focus logic.
Extracting the logic into a hook lets each OS reuse it with its own chrome.

The hook API is **resize-strategy agnostic** — it exposes handlers that an OS attaches
to whatever resize affordance it uses (corner grip for Win98/XP, any edge for macOS).
No Win-only assumptions are baked into the hook.

```typescript
// packages/core/hooks/useWindowBehavior.ts
function useWindowBehavior(options: {
  appId: string;
  getCanDrag?: (el: HTMLElement) => boolean;
  onClose?: () => void;
}) => {
  windowRef,            // attach to root window element
  handleMouseDown,      // focus/z-index management on click
  getResizeHandlers,    // (edge: 'se' | 'e' | 's' | 'sw' | ...) => mousedown handler
                        // Win98 passes 'se' only; macOS can pass all edges
}
```

Each OS's `AppWindow.tsx` calls this hook, attaches the handlers it needs,
and wraps everything in OS-appropriate chrome.

### App Content Components (selectively shared)

Only apps that meet the promotion criteria (see below) live in core.
They export their inner UI with no window chrome — no title bar, no frame.

```typescript
// packages/core/apps/calculator/CalculatorContent.tsx
export function CalculatorContent() {
  // Calculator buttons and display only
}
```

Each OS that includes the app has a **thin wrapper file** in `os/{name}/components/apps/`
that imports the content and wraps it with the OS's `AppWindow`. This is intentional
boilerplate — one small file per app per OS. It's where OS-specific props (icon path,
title label, default size) are set, and it's what the OS registry imports.

```typescript
// os/win98/components/apps/CalculatorWindow.tsx
import { CalculatorContent } from '@retro-web/core/apps/calculator';
import { AppWindow } from '../AppWindow';

export function CalculatorWindow() {
  return (
    <AppWindow appId="calculator" titleBar={{ title: 'Calculator', icon: '/apps/calculator/icon.png' }}>
      <CalculatorContent />
    </AppWindow>
  );
}
```

The `registry.ts` imports `CalculatorWindow` directly — no magic mapping from ID to component.
The registry is the explicit, auditable source of truth for what each OS loads.

Complex apps (Word, Pinball, Navigator, VB6) are **never promoted to core**.
Their window chrome is load-bearing — the toolbar, canvas, or layout is inseparable from
the window itself. These stay in their OS directory permanently.

### AppConfig Type

```typescript
// packages/core/types/app-config.ts
interface AppConfig {
  id: string;
  label: string;
  icon: string;
  desktop?: boolean;
  startMenu?: { path: string[] };
  taskbarLabel?: string;
}
```

No `osOverrides` — each OS registry sets its own values directly.

**Migration note:** Before finalizing the `AppConfig` interface, diff against the current
`app/types/app-config.ts` to confirm all fields still in use are carried over
(e.g. `tray`, `openByDefault`, `startMenu` shape). Fields that are OS-shell-specific
(like `dock` placement for macOS) belong in the OS registry, not the shared type.

---

## Package: `packages/apps/` (Tier 2 — cross-era complex apps)

Cross-era apps that appear in multiple OS registries but are too complex for `packages/core`
(their UI is non-trivial and tightly coupled to their own state) live here as individual
packages. Each is a standalone React component with no `AppWindow` — the OS wraps it.

| Package | Used by |
|---|---|
| `@retro-web/app-aim` | win98, winxp, macosx |
| `@retro-web/app-napster` | win98, winxp |
| `@retro-web/app-winamp` | win98, winxp |

Each OS still has a thin `AimWindow.tsx` wrapper (same pattern as core apps) that imports
from `@retro-web/app-aim` and wraps it with the OS `AppWindow`. The package handles the
app logic and UI; the wrapper handles the chrome and OS-specific config.

If an app only appears in one OS, it stays in that OS directory — it doesn't get its
own package just because it's complex.

---

## Package: `packages/assets/` (shared Windows-era static assets)

Win95, Win98, and WinXP share most of the same shell icons and system sounds.
Rather than duplicating them 3× in each OS's `public/` directory, common assets live here
and are copied into each OS's build output at build time (via a `postinstall` script or
Turborepo `outputs` caching).

```
packages/assets/
├── icons/
│   ├── shell/          # Common shell icons (folder, drive, recycle bin, etc.)
│   └── system/         # System icons (error, warning, info, question)
└── sounds/
    ├── startup.wav
    ├── shutdown.wav
    ├── error.wav
    └── notify.wav
```

macOS X has its own distinct icon set and sounds — these stay in `os/macosx/public/`.
OS-exclusive icons (XP Luna icons, macOS Aqua icons) also stay per-OS.

---

## Package: `packages/config/` (shared tooling)

Prevents version drift and config duplication across all OS Next.js apps.

```
packages/config/
├── eslint.js             # Base ESLint config (extended by each OS)
├── tsconfig.base.json    # Base TypeScript config
└── next.config.base.js   # Shared Next.js defaults (output: 'export', trailingSlash, etc.)
```

Each OS's `next.config.js`:
```javascript
const base = require('@retro-web/config/next.config.base');
module.exports = { ...base, /* OS-specific overrides */ };
```

Root `package.json` and CI enforce that all OS packages use the same Next.js and React
versions (via `pnpm.overrides` or a shared `peerDependencies` check in CI).

---

## App Promotion Criteria

An app belongs in `packages/core/apps/` only if it meets **all** of these:

1. **Portable UI** — the inner UI has no structural dependency on window chrome
   (no toolbars that dock to the window edge, no canvas that fills the frame)
2. **Cross-OS** — it appears in 2+ OS registries
3. **Self-contained logic** — no OS-specific APIs, shims, or shell events
4. **No window-lifecycle state** — doesn't need to know if it's maximized, its current
   pixel size, or respond to resize events

An app that fails criteria 3 or 4 but passes criteria 1 and 2 may belong in `packages/apps/`
(Tier 2) rather than being duplicated per-OS.

**Promoted to `packages/core/apps/` (initial set):**
- Calculator, Notepad, Paint — simple, self-contained, cross-era

**Flagged — verify before promoting:**
- **Minesweeper** — has a Supabase leaderboard (network call, env var). If the leaderboard
  logic can be injected as a prop/callback, it qualifies; otherwise it's OS-local with a
  shared logic-only submodule.
- **Task Manager** — reads `WindowManagerContext` to list running windows. This is an
  OS-shell concern. Likely stays OS-local unless the context read is abstracted out.

**Promoted to `packages/apps/` (Tier 2 — cross-era, complex):**
AIM, Napster, Winamp

**Stays OS-local (single-OS or load-bearing chrome):**
Word 97, Pinball, Navigator, IE, VB6, AOL, My Computer, Control Panel, MS-DOS/cmd,
boot screens, BSOD, all OS-exclusive apps (Safari, iTunes, Terminal, cmd.exe, etc.)

---

## OS-Specific: AppWindow Component

Each OS implements its own `AppWindow` using `useWindowBehavior` for logic,
but rendering its own chrome. This is the most visually distinct part per OS.

### Win98 AppWindow (migrated, no functional change)
- 3D bevel borders (outset/inset CSS)
- Blue gradient active title bar, white text
- 3 small square min/max/close buttons (right side of title bar)
- Resize grip bottom-right

### Win95 AppWindow
- Same 3D bevel structure as Win98
- Slightly different button style (no `X` icon, just a small square)
- No maximize button on some windows
- Title bar text slightly smaller

### WinXP AppWindow (Luna theme)
- Rounded top corners on title bar
- Colorful gradient title bar (`#2f5496` → `#6ea0e0`)
- Larger, rounded close/min/max buttons with icons
- Softer gray body background (`#ece9d8`)

### macOS X AppWindow (Aqua theme)
- White/light-gray body, drop shadow
- Traffic light buttons (red/yellow/green circles) in **top-left** corner
- Title centered, no icon in title bar
- Pinstripe or Brushed Metal variant for some apps (Terminal, iTunes)
- No resize grip — resize from any edge (future enhancement)

---

## OS-Specific: Shell Components

The shell is entirely replaced per OS — these share no components with each other.

### Win98 Shell (migrated from current `app/components/shell/`)
- Bottom taskbar + Start button + system tray + clock
- Start menu tree (Programs, Settings, Run, Shutdown)
- Desktop icons grid
- Win98 boot screen animation

### Win95 Shell
- Same structure as Win98 shell, but:
  - Earlier Win95-style Start button (no color gradient)
  - Slightly different system tray styling
  - Win95 boot screen (different progress bar style)

### WinXP Shell
- Luna-themed taskbar with rounded "Start" button (green, glowing)
- Grouped taskbar buttons (collapse multiple windows of same app)
- System tray with notification balloon tooltips
- XP boot screen (progress bar, no logo animation in static version)
- Welcome screen (user login UI — visual only)

### macOS X Shell
- **Menu bar** (top) — application name + menus, Apple logo left
- **Dock** (bottom, centered) — icon launcher with CSS magnification effect on hover
- **Finder** as file manager (replaces "My Computer")
- No taskbar equivalent — running apps shown by triangle indicator under Dock icon
- macOS X boot screen (gray Apple logo + progress spinner)

---

## CSS Theme Variables

Each OS defines its own CSS variable set. The variable names stay the same across all OSes
so shared components pick up the correct OS theme automatically.

| Variable | Win95 | Win98 | WinXP | macOS X |
|---|---|---|---|---|
| `--win-bg` | `#c0c0c0` | `#c0c0c0` | `#ece9d8` | `#f0f0f0` |
| `--win-dark` | `#808080` | `#808080` | `#a0a0a0` | `#cccccc` |
| `--title-active` | `#000080` | `#0000a0` | `#2f5496` | `#aaaaaa` |
| `--desktop-bg` | `#008080` | `#008080` | (wallpaper) | `#6d7785` |
| `--btn-radius` | `0` | `0` | `3px` | `8px` |
| `--title-font` | `'MS Sans Serif'` | `'MS Sans Serif'` | `'Tahoma'` | `'Lucida Grande'` |

Each OS app also ships its own fonts, icon sets, and sound assets in its `public/` directory.

---

## App Registry Per OS

Each OS has its own `registry.ts` that curates which apps appear and where.
Values are set directly — no shared overrides mechanism.

```typescript
// os/macosx/app/registry.ts
import type { AppConfig } from '@retro-web/core/types';

export const appRegistry: AppConfig[] = [
  { id: 'calculator', label: 'Calculator', desktop: false },
  { id: 'safari', label: 'Safari', desktop: true },  // macOS-only, defined in os/macosx/
  // No 'mycomputer' — macOS uses Finder instead
];
```

All app components (both core-promoted and OS-local) are registered through the OS registry.
The registry doesn't care where the component lives — it's just configuration.

---

## Build & Deploy

### Turborepo task graph

Turborepo handles incremental builds — only packages affected by a change are rebuilt.
A `core` change automatically triggers rebuilds of all OS apps that depend on it.
A change to `os/win98/` only triggers win98's build.

```json
// turbo.json
{
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["out/**", ".next/**"] },
    "test":  { "dependsOn": ["^build"] },
    "dev":   { "cache": false, "persistent": true }
  }
}
```

### Root `package.json` scripts

```json
{
  "scripts": {
    "dev":        "pnpm --filter @retro-web/win98 dev",
    "dev:win98":  "pnpm --filter @retro-web/win98 dev",
    "dev:winxp":  "pnpm --filter @retro-web/winxp dev",
    "dev:macosx": "pnpm --filter @retro-web/macosx dev",
    "build":      "turbo build",
    "build:win98":"turbo build --filter=@retro-web/win98",
    "test":       "turbo test",
    "lint":       "turbo lint",
    "e2e":        "playwright test"
  }
}
```

### Deployment (Cloudflare Pages — subdomains)

Each OS deploys as a separate Cloudflare Pages project mapped to its own subdomain.
The landing page is plain static HTML — no build step, deployed directly.

| Project | Source | Cloudflare Pages project | URL |
|---|---|---|---|
| Landing | `landing/` (static files) | `retro-landing` | `domain.com` |
| Win98 | `os/win98/out/` | `retro-win98` | `win98.domain.com` |
| WinXP | `os/winxp/out/` | `retro-winxp` | `winxp.domain.com` |
| macOS X | `os/macosx/out/` | `retro-macosx` | `macosx.domain.com` |

### CI build graph

Turborepo's dependency graph replaces hand-written path-based trigger rules:
- Any package change → Turborepo determines which downstream packages need rebuilding
- `packages/core` change → all OS builds run (they all depend on core)
- `os/win98` change → only win98 builds
- On `main` branch: full matrix always runs (no skipping) to catch latent breakage
- On PRs: Turborepo affected-package detection limits the build to what changed

E2E tests run against win98 on every PR; other OSes run on a nightly schedule
until the E2E suite is proven stable enough to run on every PR.

### Landing Page (`landing/`)

Plain static HTML/CSS at `domain.com` — no framework, no build step.
Displays an OS selection screen (retro boot-menu or custom design) with links
to each OS subdomain. Fast to load, trivial to update.

Not in `os/` — sits at repo root alongside it:
```
website/
├── landing/
│   ├── index.html    # OS picker UI
│   └── style.css     # Landing page styles
├── packages/
├── os/
└── ...
```

---

## Era-Accurate App Curation

Each OS registry is curated to reflect apps that would have existed/shipped with that OS era.
Apps that are too late (Netscape on XP) or platform-wrong (My Computer on macOS) are excluded.

| App | Win95 | Win98 | WinXP | macOS X |
|---|:---:|:---:|:---:|:---:|
| Calculator | ✓ | ✓ | ✓ | ✓ |
| Notepad | ✓ | ✓ | ✓ | — (TextEdit) |
| Paint | ✓ | ✓ | ✓ | — |
| Minesweeper | ✓ | ✓ | ✓ | — |
| My Computer | ✓ | ✓ | ✓ | — (Finder) |
| MS-DOS Prompt | ✓ | ✓ | — (cmd.exe) | — (Terminal) |
| Task Manager | ✓ | ✓ | ✓ | — (Activity Monitor) |
| Internet Explorer | IE3 | IE4/5 | IE6 | — |
| Netscape Navigator | ✓ | ✓ | — | — |
| Word 97 | — | ✓ | — | — |
| AOL / AIM | — | ✓ | ✓ | ✓ |
| Napster | — | ✓ | ✓ | — |
| Winamp | — | ✓ | ✓ | — |
| Control Panel | ✓ | ✓ | ✓ | ✓ (System Preferences) |
| VB6 | — | ✓ | — | — |
| Safari | — | — | — | ✓ |
| iTunes | — | — | — | ✓ |
| Terminal | — | — | — | ✓ |
| cmd.exe | — | — | ✓ | — |

- **OS-exclusive apps** live in `os/{name}/components/apps/`
- **Simple cross-era apps** (Calculator, Notepad, Paint) live in `packages/core/apps/`
- **Complex cross-era apps** (AIM, Napster, Winamp) live in `packages/apps/{name}/`
- Each OS has a thin wrapper file in `os/{name}/components/apps/` for every app it uses,
  regardless of which tier the content comes from

---

## Testing Strategy

Tests are split across three levels:

### `packages/core/test/` — shared logic tests
- `WindowManagerContext` state and actions
- `useWindowBehavior` drag/resize/focus/resize-handler logic
- `AppConfig` type utilities
- Promoted app content components (Calculator, Notepad, Paint)
- Run on **every CI build** — any change to core triggers these

### `os/{name}/test/` — OS-specific Jest tests
- OS shell behavior (taskbar, start menu, dock, etc.)
- OS-specific `AppWindow` chrome (button positions, title bar rendering)
- Boot screen, BSOD, shutdown overlays
- Integration: app wrapper mounts correctly inside the OS shell
- Run when that OS's files change **or** core changes

### `e2e/` — root-level Playwright tests (parameterized by OS)
A single E2E suite at the repo root, parameterized by `baseURL` so the same test
scenarios run against each OS without duplicating spec files.

```typescript
// e2e/playwright.config.ts
export default defineConfig({
  projects: [
    { name: 'win98', use: { baseURL: 'http://localhost:3098' } },
    { name: 'winxp', use: { baseURL: 'http://localhost:3100' } },
    { name: 'macosx', use: { baseURL: 'http://localhost:3200' } },
  ],
});
```

OS-specific behavior that differs across OSes uses `test.skip` guards or separate
spec files under `e2e/os/{name}/`. Shared scenarios (open app, drag window, close)
live in `e2e/shared/`.

Current `e2e/` at repo root moves to `e2e/os/win98/` during Phase 1, then is
restructured to the parameterized layout in Phase 3.

Coverage thresholds are per-package (core has its own threshold, each OS has its own).

---

## Migration Plan

All work on the current `mutli-os` branch.

### Phase 0: Monorepo setup (no functional changes)
- [ ] Install pnpm, convert from npm → pnpm (`pnpm import` from `package-lock.json`)
- [ ] Install Turborepo (`pnpm add -Dw turbo`), add `turbo.json`
- [ ] Add `pnpm-workspace.yaml` at repo root
- [ ] Add `packages/config/` with `eslint.js`, `tsconfig.base.json`, `next.config.base.js`
- [ ] Add `packages/core/` stub `package.json` (`name: "@retro-web/core"`)
- [ ] Add `packages/apps/` stub (empty, ready for cross-era app packages)
- [ ] Add `packages/assets/` — move common Win shell icons and sounds here
- [ ] Verify nothing broken: `pnpm dev` still works, `turbo build` runs

### Phase 1: Move Win98 into `os/win98/`
- [ ] Create `os/win98/` directory structure
- [ ] Move `app/`, `public/`, `next.config.js` → `os/win98/`
- [ ] Update `os/win98/next.config.js` to extend `@retro-web/config/next.config.base.js`
- [ ] Move `test/` → `os/win98/test/`, update Jest paths
- [ ] Move `e2e/` → `e2e/os/win98/` (root-level, begins parameterized E2E structure)
- [ ] Update root `package.json` scripts to use `turbo`
- [ ] Verify: `pnpm dev`, `turbo build`, `turbo test` all pass from root

### Phase 2: Extract shared logic into `packages/core`
- [ ] Diff current `app/types/app-config.ts` against the proposed interface; carry over all
      fields still in use, drop `osOverrides`
- [ ] Move `WindowManagerContext.tsx` → `packages/core/context/`
- [ ] Move `app-config.ts` → `packages/core/types/`
- [ ] Extract `useWindowBehavior` from `AppWindow.tsx` → `packages/core/hooks/`
      (design `getResizeHandlers` to be edge-agnostic from the start)
- [ ] Verify Minesweeper and Task Manager against promotion criteria before including;
      default to OS-local if uncertain
- [ ] Promote confirmed qualifiers → `packages/core/apps/` (Calculator, Notepad, Paint)
- [ ] Add `packages/core/test/` with Jest config; port tests for promoted apps and the hook
- [ ] Update win98 imports to `@retro-web/core/...`
- [ ] All existing tests pass

### Phase 3: Refactor Win98 to consume core + extract packages/apps
- [ ] Win98 `AppWindow.tsx` uses `useWindowBehavior` from core (chrome stays identical)
- [ ] Win98 shell imports `WindowManagerContext` from core
- [ ] Create thin wrapper files in `os/win98/components/apps/` for all promoted core apps
- [ ] Extract AIM → `packages/apps/aim/`, Napster → `packages/apps/napster/`,
      Winamp → `packages/apps/winamp/`; create win98 wrapper files for each
- [ ] Complex single-OS apps (Word, Navigator, VB6, etc.) remain untouched in `os/win98/`
- [ ] No win98-specific logic leaks into core or packages/apps; full test suite green
- [ ] Restructure `e2e/` to parameterized layout with `e2e/shared/` and `e2e/os/win98/`

### Phase 4: Landing page
- [ ] Create `landing/index.html` + `landing/style.css` (no framework)
- [ ] OS picker UI — retro boot-menu style or custom design
- [ ] Links to each subdomain (win98 first, others stubbed)
- [ ] Deploy `landing/` directly to Cloudflare Pages → `domain.com`

### Phase 5: Add Win95 — **Deferred / removed from repo**
A Win95 app existed under `os/win95/`; it was removed to simplify the monorepo. Restore from git history if needed, then re-add scripts, CI matrix, Playwright project, and `landing` link.

### Phase 6: Add WinXP
- [ ] Create `os/winxp/` with Next.js setup
- [ ] Luna-themed `AppWindow` (rounded corners, colorful gradient, pill buttons)
- [ ] WinXP shell (Luna taskbar, rounded Start button, grouped buttons, balloon tips, Welcome screen)
- [ ] Thin wrapper files for XP apps; XP gets AIM/Napster/Winamp via `packages/apps/`
- [ ] XP-exclusive apps: IE6, cmd.exe (defined in `os/winxp/`)
- [ ] `os/winxp/test/`
- [ ] Add winxp project to `e2e/playwright.config.ts`
- [ ] Add `winxp.domain.com` link to `landing/index.html`

### Phase 7: Add macOS X
- [ ] Create `os/macosx/` with Next.js setup
- [ ] Aqua `AppWindow` (traffic lights top-left, centered title, drop shadow, pinstripe/metal variants)
      — attach all resize edge handlers from `getResizeHandlers`, not just corner
- [ ] macOS shell (top Menu bar, centered Dock with magnification, Finder, boot spinner)
- [ ] macOS gets AIM via `packages/apps/aim/`; all other apps are macOS-exclusive
- [ ] macOS-exclusive apps: Safari, iTunes shell, Terminal, Activity Monitor (all in `os/macosx/`)
- [ ] `os/macosx/test/`
- [ ] Add macosx project to `e2e/playwright.config.ts`
- [ ] Add `macosx.domain.com` link to `landing/index.html`
