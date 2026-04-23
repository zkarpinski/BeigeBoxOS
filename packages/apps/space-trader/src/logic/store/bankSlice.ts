import { StateCreator } from 'zustand';
import { ShipTypes, Weapons, Shields, Gadgets } from '../DataTypes';
import { SpaceTraderState, BankSlice } from './types';

/** OG: Calculate player's net worth (credits + ship trade-in value - debt) */
export function calculateNetWorth(state: SpaceTraderState): number {
  const shipType = ShipTypes[state.ship.type];
  let worth = state.credits;

  // Ship trade-in value (75% of price, minus repairs/fuel)
  let shipValue = Math.floor((shipType.price * 3) / 4);
  shipValue -= (shipType.hullStrength - state.ship.hull) * shipType.repairCosts;
  shipValue -= (shipType.fuelTanks - state.ship.fuel) * shipType.costOfFuel;
  worth += Math.max(0, shipValue);

  // Equipment value (2/3 of price)
  for (const w of state.ship.weapon) if (w >= 0) worth += Math.floor((Weapons[w].price * 2) / 3);
  for (const s of state.ship.shield) if (s >= 0) worth += Math.floor((Shields[s].price * 2) / 3);
  for (const g of state.ship.gadget) if (g >= 0) worth += Math.floor((Gadgets[g].price * 2) / 3);

  // Cargo value at current sell prices
  for (let i = 0; i < state.ship.cargo.length; i++) {
    worth += state.ship.cargo[i] * (state.sellPrices[i] ?? 0);
  }

  worth -= state.debt;
  return worth;
}

export const createBankSlice: StateCreator<SpaceTraderState, [], [], BankSlice> = (set, get) => ({
  borrowCredits: (amount) => {
    const state = get();
    // OG: If record is Dubious (< 0), max loan is 500.
    // If clean, max loan is min(25000, 10% of worth rounded down to nearest 500).
    let maxLoan = 0;
    if (state.policeRecordScore < 0) {
      maxLoan = 500;
    } else {
      const worthLimit = Math.floor(calculateNetWorth(state) / 10 / 500) * 500;
      maxLoan = Math.min(25000, Math.max(1000, worthLimit));
    }

    const canBorrow = Math.max(0, maxLoan - state.debt);
    const toBorrow = Math.min(amount, canBorrow);
    if (toBorrow <= 0) return;

    set({
      credits: state.credits + toBorrow,
      debt: state.debt + toBorrow,
    });
  },

  repayDebt: (amount) => {
    const state = get();
    if (state.debt <= 0) return;
    const toRepay = Math.min(amount, state.debt, state.credits);
    if (toRepay <= 0) return;

    set({
      credits: state.credits - toRepay,
      debt: state.debt - toRepay,
    });
  },
});
