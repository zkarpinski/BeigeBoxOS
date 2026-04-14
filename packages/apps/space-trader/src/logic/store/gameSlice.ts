import { StateCreator } from 'zustand';
import { SpaceTraderState, GameSlice } from './types';

export const createGameSlice: StateCreator<SpaceTraderState, [], [], GameSlice> = (set) => ({
  difficulty: 2,
  tradeMode: 'buy',
  viewingShipId: null,
  selectedMapSystemId: null,
  setTradeMode: (mode) => set({ tradeMode: mode }),
  setViewingShipId: (id) => set({ viewingShipId: id }),
  setSelectedMapSystem: (id) => set({ selectedMapSystemId: id }),
  restartGame: () => {
    localStorage.removeItem('space-trader-save');
    window.location.reload(); // Original behavior or full reset
  },
});
