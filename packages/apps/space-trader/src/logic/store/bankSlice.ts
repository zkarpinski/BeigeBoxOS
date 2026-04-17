import { StateCreator } from 'zustand';
import { ShipTypes, Weapons, Shields, Gadgets } from '../DataTypes';
import { SpaceTraderState, BankSlice } from './types';

/** OG: Calculate player's net worth (credits + ship value - debt) */
export function calculateNetWorth(state: {
  credits: number;
  debt: number;
  ship: { type: number; cargo: number[]; weapon: number[]; shield: number[]; gadget: number[] };
  sellPrices: number[];
}): number {
  const shipType = ShipTypes[state.ship.type];
  let worth = state.credits;

  // Ship base value (75% of price, like trade-in)
  worth += Math.floor((shipType.price * 3) / 4);

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
    const maxLoan = state.policeRecordScore >= 0 ? 25000 : 5000;
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
