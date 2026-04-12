import { StateCreator } from 'zustand';
import { SpaceTraderState, GameSlice } from './types';

export const createGameSlice: StateCreator<SpaceTraderState, [], [], GameSlice> = (set) => ({
  difficulty: 2,
  tradeMode: 'buy',
  setTradeMode: (mode) => set({ tradeMode: mode }),
  restartGame: () => {
    localStorage.removeItem('space-trader-save');
    window.location.reload(); // Original behavior or full reset
  },
});
