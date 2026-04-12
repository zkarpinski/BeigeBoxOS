import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createPlayerSlice } from './store/playerSlice';
import { createUniverseSlice } from './store/universeSlice';
import { createEncounterSlice } from './store/encounterSlice';
import { createGameSlice } from './store/gameSlice';
import { SpaceTraderState } from './store/types';

export const useSpaceTraderGame = create<SpaceTraderState>()(
  persist(
    (...a) => ({
      ...createPlayerSlice(...a),
      ...createUniverseSlice(...a),
      ...createEncounterSlice(...a),
      ...createGameSlice(...a),
    }),
    {
      name: 'space-trader-save',
      // Do not persist actions/functions
      partialize: (state) => {
        const persistedEntries = Object.entries(state).filter(
          ([_, value]) => typeof value !== 'function',
        );
        return Object.fromEntries(persistedEntries);
      },
    },
  ),
);
