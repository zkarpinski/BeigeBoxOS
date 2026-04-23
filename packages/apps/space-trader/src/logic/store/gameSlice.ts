import { StateCreator } from 'zustand';
import { SpaceTraderState, GameSlice } from './types';

export const createGameSlice: StateCreator<SpaceTraderState, [], [], GameSlice> = (set) => ({
  difficulty: 2,
  tradeMode: 'buy',
  activeView: 'newgame',
  viewingShipId: null,
  selectedMapSystemId: null,
  isAiEnabled: false,
  setTradeMode: (mode) => set({ tradeMode: mode }),
  setActiveView: (view) => set({ activeView: view }),
  setViewingShipId: (id) => set({ viewingShipId: id }),
  setSelectedMapSystem: (id) => set({ selectedMapSystemId: id }),
  toggleAi: () => set((state) => ({ isAiEnabled: !state.isAiEnabled })),
  restartGame: () => {
    localStorage.removeItem('space-trader-save');
    set({
      nameCommander: '',
      systems: [],
      currentSystem: 92,
      encounter: null,
      isGameOver: false,
      activeView: 'newgame',
      isAiEnabled: false,
    });
  },
});
