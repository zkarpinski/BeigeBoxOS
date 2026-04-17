import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createPlayerSlice } from './store/playerSlice';
import { createUniverseSlice } from './store/universeSlice';
import { createEncounterSlice } from './store/encounterSlice';
import { createGameSlice } from './store/gameSlice';
import { createOptionsSlice } from './store/optionsSlice';
import { createBankSlice } from './store/bankSlice';
import { createQuestSlice } from './store/questSlice';
import { SpaceTraderState } from './store/types';

export const useSpaceTraderGame = create<SpaceTraderState>()(
  persist(
    (...a) => ({
      ...createPlayerSlice(...a),
      ...createUniverseSlice(...a),
      ...createEncounterSlice(...a),
      ...createGameSlice(...a),
      ...createOptionsSlice(...a),
      ...createBankSlice(...a),
      ...createQuestSlice(...a),
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
