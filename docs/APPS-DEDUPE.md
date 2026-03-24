# Reducing duplicated apps across OSes

## Principles

1. **`@retro-web/core`** — Portable app **content** (no window chrome): `CalculatorContent`, `NotepadContent`, `PaintContent`, plus shared types, `WindowManagerContext` (target), `useWindowBehavior`.
2. **`@retro-web/app-*`** — Cross-OS “heavy” apps (AIM, Napster, Winamp): one package per app; each OS keeps a **thin** `XxxWindow.tsx` that only wires `AppWindow` + title bar + `appConfig`.
3. **Per-OS tree** — Only **shell** (`Taskbar`, `Desktop`, boot), **window chrome** (`AppWindow`, `TitleBar`), **registry**, and **OS-specific assets** should diverge. App **logic** should not be copy-pasted three ways.

## Done (WinXP aligned with Win98)

- **Calculator** — `CalculatorWindow.tsx` is a thin wrapper; UI lives in `@retro-web/core/apps/calculator`. Removed duplicate `CalculatorButton.tsx`, `calculator.css`, and redundant CSS imports in `layout.tsx`.
- **Paint** — Same pattern with `PaintContent` from `@retro-web/core/apps/paint`. Removed duplicate `paint.css` and layout imports.
- **Notepad** — Win98 / WinXP use `NotepadContent` from `@retro-web/core/apps/notepad`. OS layer keeps `NOTEPAD_PENDING_KEY` hydration, `writeFile`, `hideApp`, and title bar state. Removed duplicate `NotepadMenuBar.tsx` and `notepad.css` per OS; `NotepadContent` syncs when `initial*` props change (open from Desktop).

## Next high-impact steps

| Priority | Action                                                                                                                                                                                           |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1        | **Minesweeper** — Move `MinesweeperLogic.ts` (+ tests) to `packages/core` or `@retro-web/app-minesweeper`; OS folders only keep `MinesweeperWindow` + assets.                                    |
| 2        | **AIM / Napster / Winamp** — Finish `packages/apps/*` exports and replace fat copies in each OS with `<AimApp />` etc. inside chrome.                                                            |
| 3        | **One `WindowManagerContext`** — Delete per-OS copies; import from `@retro-web/core/context` everywhere.                                                                                         |
| 4        | **Layouts** — Drop duplicate global CSS imports for any app whose styles are pulled in by core/app packages (Win98 can drop `paint.css` / `calculator.css` imports too if unused).               |
| 5        | **Tests** — Prefer **one** test suite in `packages/core` for pure logic; OS packages only test shell integration (optional). Align Jest `testMatch` so co-located `*.test.tsx` run where needed. |

## Why duplication happened

Bootstrapping WinXP by **copying** Win98 brought full app sources. Refactoring is **incremental**: each app is switched to shared packages as you touch it.
