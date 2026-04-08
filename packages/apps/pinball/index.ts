/**
 * @retro-web/app-pinball — Nebula Pinball
 *
 * A Space Cadet-inspired pinball game with custom 2D physics.
 * Import theme CSS in the host layout before rendering:
 *   import '@retro-web/app-pinball/themes/karpos.css'
 *
 * Then render:
 *   <PinballWindow skin="karpos" />
 */
export { PinballWindow, pinballAppConfig, PINBALL_ICON_SRC } from './src/PinballWindow';
export type { PinballWindowProps, PinballSkin } from './src/PinballWindow';
