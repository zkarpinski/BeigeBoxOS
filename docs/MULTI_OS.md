# Multi-OS maintenance

Apps should **not** import `AppWindow` / `TitleBar` from a specific OS package. Shared UI lives in `@retro-web/core/apps/*` and uses:

1. **`OsShellProvider`** — Each OS `Desktop` passes its native `AppWindow`, `TitleBar`, and `writeFile` (virtual FS). Shared windows call `useOsShell()` so the **window shell** (title bar, borders, controls) matches the running OS (Win98 vs XP Luna).

2. **Theme tokens** — App inner styles (menus, inset borders, fonts) should use CSS variables such as `--win-bg`, `--win-dark`, `--title-active`, etc., defined in each OS `style.css` / `:root`. The same component code then **looks native** per OS without branching in React.

3. **When to keep code in `os/<name>/`** — Window shell, taskbar, start menu, boot screen, and anything that must differ strongly per era. Optional: thin `*Window.tsx` files that only wire `appConfig` + `useOsShell` until the app is moved to core.

4. **Contracts** — `AppWindowProps`, `TitleBarProps`, and `OsShellValue` live in `@retro-web/core/types/os-shell`. OS implementations re-export these types for local imports.

5. **Legacy globals** — The Win98 build exposes `window.Windows98` (see `Windows98GlobalShim.tsx`). WinXP uses `WindowsXP`.

## Adding a new OS

- Copy an existing `os/winxp`-style package (Next config, `public/`, `app/style.css` with its own `:root` tokens).
- Implement `AppWindow` + `TitleBar` for that shell (or reuse if the chrome is identical).
- Wrap the desktop tree with `WindowManagerProvider` → `OsShellProvider` (see any `Desktop.tsx`).

## Migrating an existing app to shared core

1. Move logic + styles into `@retro-web/core/apps/<name>/` (content component + CSS using tokens).
2. Replace OS `*Window.tsx` with a single `*Window` in core that uses `useOsShell()` for chrome and `useWindowManager()` for visibility.
3. Register `appConfig` from core in each OS `registry.ts` if the app ships everywhere.

## Shared music helpers (`@retro-web/core/music`)

- **`MOCK_STREAMING_SONGS`** — tuple catalog for Napster-style search and demo libraries (e.g. iTunes 8 on WinXP).
- **`spotifySearchUrlForTrack` / `openSpotifyForTrack`** — open Spotify web search for a track (no API keys).
- **`formatDurationMmSs` / `formatDurationLegacy`** — display track lengths consistently across players.

Use these when building additional music apps so Napster-like and iTunes-like UIs stay in sync.
