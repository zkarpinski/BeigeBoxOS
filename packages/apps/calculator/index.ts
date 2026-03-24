/**
 * @retro-web/app-calculator — window chrome + themes for the core calculator UI.
 *
 * **Logic & keypad markup:** `CalculatorContent` from `@retro-web/core/apps/calculator`
 * (imports core `calculator.css` for inner styles).
 *
 * **Skins:** Host layout imports `themes/win98.css`; KarpOS also imports `themes/karpos.css`
 * and renders `<CalculatorWindow skin="karpos" />`.
 */
export { CalculatorWindow, calculatorAppConfig, CALCULATOR_ICON_SRC } from './src/CalculatorWindow';
export type { CalculatorWindowProps, CalculatorSkin } from './src/CalculatorWindow';
