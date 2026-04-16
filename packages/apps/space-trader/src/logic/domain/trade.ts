import { PlayerShip, ShipTypes } from '../DataTypes';

export interface TransactionResult {
  credits: number;
  cargo: number[];
  systemQuantities: number[];
}

export function executeBuy(
  goodId: number,
  amount: number,
  state: {
    credits: number;
    ship: PlayerShip;
    buyPrices: number[];
    systemQuantities: number[];
    specialCargoBays?: number;
  },
): TransactionResult | null {
  const price = state.buyPrices[goodId];
  if (price <= 0) return null;

  const maxPoss = Math.min(Math.floor(state.credits / price), state.systemQuantities[goodId] || 0);

  const usedCargo = state.ship.cargo.reduce((a, b) => a + b, 0);
  const shipType = ShipTypes[state.ship.type];
  const freeCargo = shipType.cargoBays - usedCargo - (state.specialCargoBays ?? 0);
  const finalAmount = Math.min(amount, maxPoss, freeCargo);

  if (finalAmount <= 0) return null;

  const newCargo = [...state.ship.cargo];
  newCargo[goodId] += finalAmount;

  const newQuantities = [...state.systemQuantities];
  newQuantities[goodId] -= finalAmount;

  return {
    credits: state.credits - finalAmount * price,
    cargo: newCargo,
    systemQuantities: newQuantities,
  };
}

export function executeSell(
  goodId: number,
  amount: number,
  state: {
    credits: number;
    ship: PlayerShip;
    sellPrices: number[];
    systemQuantities: number[];
  },
): TransactionResult | null {
  const price = state.sellPrices[goodId];
  if (price <= 0) return null;

  const finalAmount = Math.min(amount, state.ship.cargo[goodId]);
  if (finalAmount <= 0) return null;

  const newCargo = [...state.ship.cargo];
  newCargo[goodId] -= finalAmount;

  const newQuantities = [...state.systemQuantities];
  newQuantities[goodId] += finalAmount;

  return {
    credits: state.credits + finalAmount * price,
    cargo: newCargo,
    systemQuantities: newQuantities,
  };
}
