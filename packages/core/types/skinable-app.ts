/**
 * Convention for `@retro-web/app-*` packages that ship one implementation across OS shells:
 *
 * - **Logic + UI** live in the package (hooks, components, tests).
 * - **Default theme** CSS ships as `themes/<default>.css` (e.g. Win98).
 * - **Host overrides** import extra sheets (e.g. `themes/karpos.css`) and pass a matching
 *   `skin` prop so scoped selectors like `[data-myapp-skin="karpos"]` apply.
 * - **Window chrome** stays in the host via `useOsShell` / `AppWindow` — not in the app package.
 *
 * Examples: `@retro-web/app-minesweeper` + `data-minesweeper-skin`; `@retro-web/app-calculator` + `data-calculator-skin` (content may stay in core).
 */
export type SkinId = string;
