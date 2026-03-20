# Plan: Shell in React

**Goal.** Implement the Windows 98 shell entirely in React with a single source of truth (context + reducer/store) that owns:

- Which apps are registered
- Which apps are open, focused, and minimized
- Window positions and sizes (optional but recommended)

Taskbar and Start menu are pure React views over this state. No `windows97.js` or `windowChrome.js` as the source of truth.

---

## Current State (What Already Exists)

- **`WindowManagerContext`** (`app/context/WindowManagerContext.tsx`)
  - Holds `apps: Record<string, AppState>` with `visible` and `zIndex` per app.
  - Exposes `showApp`, `hideApp`, `focusApp`, `isAppVisible`.
  - Initializes app state from a `registry` (array of `AppConfig`) passed into the provider.
  - Also owns dialogs, BSOD, Run dialog, and Shutdown dialog state.
  - Sets `window.Windows97` as a shim so any remaining legacy callers can still call `showApp`/`hideApp`.

- **Taskbar** (`app/components/shell/Taskbar.tsx`)
  - Pure React. Uses `useWindowManager()` and `registry`.
  - Renders one task per registered app; shows/hides and highlights based on `apps[id].visible` and zIndex.
  - Click: if visible → focus, else → show.
  - No dependency on legacy shell scripts.

- **Start menu** (`StartMenuTree.tsx`)
  - Pure React. Uses `useWindowManager()` for `showApp`, `setRunDialogOpen`, `setShutdownOpen`.
  - Renders tree from `registry` and `startMenu` paths.
  - No legacy shell dependency.

- **Desktop icons** (`DesktopIcons.tsx`)
  - Pure React. Uses `useWindowManager().showApp` and `registry`.
  - No legacy shell dependency.

- **App window chrome** (`AppWindow.tsx`)
  - Uses `useWindowManager()` for visibility and zIndex.
  - Implements **drag, resize, minimize, maximize, close** in React (useEffect + DOM).
  - Does **not** use `windowChrome.js`; minimize currently calls `hideApp()` (window disappears and leaves taskbar).

- **Page** (`app/page.tsx`)
  - Wraps the desktop in `WindowManagerProvider` with `registry={appRegistry}`.
  - Does **not** load `public/shell/windows97.js` or `public/shell/windowChrome.js` for the main Next.js app.

So: the shell is already **mostly** in React. The main gaps are (1) **minimized state** (so minimize keeps the app on the taskbar and restore works), (2) **window positions/sizes in state** (so one place owns them), and (3) **cleanup** so nothing relies on the legacy shell.

---

## What’s Missing for “Shell in React”

1. **Minimized state**  
   Today, “minimize” in `AppWindow` calls `hideApp()`, so the window and its taskbar entry both disappear. In Win98, minimizing keeps the app on the taskbar and only hides the window; clicking the taskbar restores it. The store should distinguish “open and visible,” “open but minimized,” and “closed.”

2. **Window positions and sizes in the store (optional)**  
   Today, `AppWindow` applies drag/resize by mutating `el.style` only. Positions/sizes are not in context, so they are lost on re-render or refresh. To have “one place that owns” them, the store should hold per-window bounds (e.g. `left`, `top`, `width`, `height`) and `AppWindow` should read/update the store on drag/resize.

3. **Explicit “no legacy shell”**  
   Ensure no code path in the Next.js app loads or depends on `windows97.js` or `windowChrome.js`. Remove or narrow the `window.Windows97` shim once no callers need it.

4. **Registration as single source of truth**  
   The registry (`appRegistry`) is already the single list of apps. The context should continue to derive initial app state from this registry (no separate legacy `registerApp`). Any new “registration” would only be “add to registry and pass to provider.”

---

## Implementation Plan

### Phase 1: Add minimized state to the shell store

- **1.1** Extend `AppState` in `WindowManagerContext` with `minimized?: boolean` (default `false`).
  - Semantics: `visible: true` = app has a taskbar entry; `minimized: true` = window is hidden but still “open.”

- **1.2** Add reducer actions:
  - `MINIMIZE` (id): set `minimized: true` for that app (keep `visible: true`).
  - `RESTORE` (id): set `minimized: false`.
  - `SHOW`: when showing an app, set `minimized: false` (restore if it was minimized).
  - `HIDE`: set `visible: false` and `minimized: false` (close and remove from taskbar).

- **1.3** Expose `minimizeApp(id)` and optionally `restoreApp(id)` from context.
  - `showApp(id)` already brings the app to front; ensure it also clears `minimized` so clicking the taskbar restores the window.

- **1.4** In `AppWindow`:
  - Minimize button: dispatch `MINIMIZE` (or call `minimizeApp(appId)`) instead of `hideApp(appId)`.
  - When `appState.minimized === true`, render the window as hidden (e.g. `display: none` or a dedicated class) but keep it mounted so the taskbar entry stays.

- **1.5** Taskbar: no change needed if it already shows every app with `visible === true`; minimized apps will stay on the taskbar. Taskbar click continues to call `showApp(id)`, which will restore (clear minimized) and focus.

### Phase 2: Put window positions and sizes in the store (optional)

- **2.1** Extend `AppState` with optional `bounds`:
  - `{ left: number; top: number; width: number; height: number }`
  - Only set for windows that have been positioned/resized (or use defaults on first open).

- **2.2** Add reducer actions:
  - `SET_BOUNDS` (id, bounds): update stored bounds for that app.
  - Optionally `RESET_BOUNDS` (id) to clear or use default.

- **2.3** In `AppWindow`:
  - On mount and when `bounds` exist in context, apply `bounds` to the window element’s style (position, left, top, width, height).
  - On drag end / resize end, dispatch `SET_BOUNDS` with the current rect (and optionally throttle or debounce during drag/resize).
  - When maximizing, you can either leave `bounds` as-is and only toggle a “maximized” flag, or store “restored” bounds and clear maximized on restore (as you already do with `restoredPos.current`).

- **2.4** Optional: persist bounds (e.g. to `localStorage`) in the reducer or in an effect so window positions/sizes survive refresh. Key by app id.

### Phase 3: Ensure no legacy shell dependency

- **3.1** Search the app (and any remaining legacy entry points) for:
  - Dynamic imports or script tags that load `windows97.js` or `windowChrome.js`.
  - Any logic that assumes `window.Windows97.registerApp` or `attachWindowChrome` to have been called for the shell to work.

- **3.2** Remove or guard such loads in the Next.js app so the only source of truth is `WindowManagerContext` and `AppWindow`.

- **3.3** List every caller of `window.Windows97` (e.g. Run dialog, shutdown, or legacy app code). Either:
  - Migrate them to `useWindowManager()`, or
  - Keep a minimal `window.Windows97` shim that delegates to the context (as today) until those callers are removed. Document that the real state lives in React.

- **3.4** Update comments (e.g. in `TitleBar.tsx`) that reference `windowChrome.js` to say that chrome is handled by `AppWindow` and the shell context.

### Phase 4: Registration and single source of truth

- **4.1** Keep `appRegistry` (and any other config) as the single list of “which apps exist.”
  - The provider continues to receive `registry={appRegistry}` and to initialize `apps` from it (visible/zIndex/minimized/bounds from defaults or persisted state).

- **4.2** Do not reintroduce a legacy-style `registerApp` that mutates DOM or a global object; “registration” = presence in registry + initial state in the reducer.

- **4.3** If you add new apps, add them to `appRegistry` and ensure they use `AppWindow` (or an equivalent that reads from the same context). No separate shell script registration step.

---

## File Checklist

| File / area                                    | Action                                                                                                                                    |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `app/context/WindowManagerContext.tsx`         | Extend `AppState` (minimized, optional bounds); add MINIMIZE/RESTORE/SET_BOUNDS; expose minimizeApp (and optional restoreApp, setBounds). |
| `app/components/win98/AppWindow.tsx`           | Use minimize from context; apply bounds from context; dispatch SET_BOUNDS on drag/resize.                                                 |
| `app/components/shell/Taskbar.tsx`             | No change if it already uses `visible`; ensure taskbar click calls showApp (restore + focus).                                             |
| `app/components/shell/StartMenuTree.tsx`       | No change.                                                                                                                                |
| `app/components/shell/DesktopIcons.tsx`        | No change.                                                                                                                                |
| `app/page.tsx`                                 | Confirm no legacy shell scripts loaded; keep WindowManagerProvider + registry.                                                            |
| `public/shell/windows97.js`, `windowChrome.js` | Leave in repo only for legacy build (e.g. index.html); do not load in Next.js app.                                                        |
| Comments / docs                                | State that shell state lives in React and chrome is implemented in AppWindow.                                                             |

---

## Success Criteria

- One place (WindowManagerContext + reducer) owns: registered apps (from registry), open/focused/minimized, and optionally positions/sizes.
- Taskbar and Start menu are pure React views over this state; no `windows97.js` or `windowChrome.js` in the data flow.
- Minimize keeps the app on the taskbar; clicking the taskbar restores the window.
- Optional: window positions/sizes are stored and optionally persisted.
- No reliance on legacy shell scripts in the Next.js shell path.
