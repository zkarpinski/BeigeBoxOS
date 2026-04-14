import { StateCreator } from 'zustand';
import { SpaceTraderState, OptionsSlice } from './types';

export const createOptionsSlice: StateCreator<SpaceTraderState, [], [], OptionsSlice> = (set) => ({
  optAutoFuel: false,
  optAutoRepair: false,
  optIgnorePolice: true,
  optIgnorePirates: false,
  optIgnoreTraders: false,
  optIgnoreDealingTraders: false,
  optReserveMoney: false,
  optChartToInfo: false,
  optContinuousFight: false,
  optAttackFleeing: false,
  reserveBays: 0,
  optPayForNewspaper: false,
  optShowRangeToTracked: true,
  optStopTrackingOnArrival: true,
  optTextualEncounters: false,
  optRemindAboutLoans: true,
  setOption: (key, value) => set({ [key]: value } as Partial<OptionsSlice>),
});
