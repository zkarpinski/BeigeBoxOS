/**
 * @retro-web/app-minesweeper — portable Minesweeper with skinnable themes.
 *
 * **Skins:** Import default Win98 chrome in the host layout:
 * `import '@retro-web/app-minesweeper/themes/win98.css'`
 * Optional overrides (e.g. KarpOS): import `themes/karpos.css` after win98.
 * Pass the same id to {@link MinesweeperWindow}: `<MinesweeperWindow skin="karpos" />`.
 *
 * **Pattern:** Core logic + presentational components live here; hosts only supply
 * shell chrome via `useOsShell` (already wired inside {@link MinesweeperWindow}).
 * For other apps, follow the same split: `@retro-web/app-*` + `themes/*.css` + `data-*-skin`.
 */
export {
  MinesweeperWindow,
  minesweeperAppConfig,
  MINESWEEPER_ICON_SRC,
} from './src/MinesweeperWindow';
export type { MinesweeperWindowProps, MinesweeperSkin } from './src/MinesweeperWindow';
export { useMinesweeperGame } from './src/useMinesweeperGame';
export * from './src/logic/MinesweeperLogic';
export * from './src/leaderboard/leaderboard';
