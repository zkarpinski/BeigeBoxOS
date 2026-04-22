import { createStore } from 'zustand/vanilla';
import { createQuestSlice, getSpecialCargoBays } from '../store/questSlice';
import {
  SPACEMONSTER,
  MONSTERKILLED,
  JAPORIDISEASE,
  MEDICINEDELIVERY,
  SKILLINCREASE,
} from '../SpecialEvents';
import { ShipTypes } from '../DataTypes';

function makePlayerShip(overrides: any = {}) {
  const type = overrides.type ?? 1; // Gnat default
  return {
    type,
    cargo: new Array(10).fill(0),
    weapon: new Array(3).fill(-1),
    shield: new Array(3).fill(-1),
    shieldStrength: new Array(3).fill(-1),
    gadget: new Array(3).fill(-1),
    escapePod: false,
    fuel: ShipTypes[type].fuelTanks,
    hull: ShipTypes[type].hullStrength,
    ...overrides,
  };
}

function createTestStore(overrides: Record<string, unknown> = {}) {
  return createStore<any>()(
    (set, get, api) =>
      ({
        ...createQuestSlice(set, get, api),
        credits: 1000,
        reputationScore: 0,
        systems: [{ special: -1 }],
        ship: makePlayerShip(),
        pilotSkill: 1,
        fighterSkill: 1,
        traderSkill: 1,
        engineerSkill: 1,
        ...overrides,
      }) as any,
  );
}

describe('questSlice', () => {
  describe('getSpecialCargoBays', () => {
    it('returns 0 when no special cargo is on board', () => {
      expect(
        getSpecialCargoBays({
          antidoteOnBoard: false,
          reactorOnBoard: false,
          jarekOnBoard: false,
          wildOnBoard: false,
          artifactOnBoard: false,
        }),
      ).toBe(0);
    });

    it('returns 10 for antidote', () => {
      expect(
        getSpecialCargoBays({
          antidoteOnBoard: true,
          reactorOnBoard: false,
          jarekOnBoard: false,
          wildOnBoard: false,
          artifactOnBoard: false,
        }),
      ).toBe(10);
    });

    it('sums all special cargo correctly', () => {
      expect(
        getSpecialCargoBays({
          antidoteOnBoard: true,
          reactorOnBoard: true,
          jarekOnBoard: true,
          wildOnBoard: true,
          artifactOnBoard: true,
        }),
      ).toBe(18); // 10 + 5 + 1 + 1 + 1
    });
  });

  describe('triggerSpecialEvent', () => {
    it('handles SPACEMONSTER event', () => {
      const store = createTestStore({
        systems: [{ special: SPACEMONSTER }],
      });
      store.getState().triggerSpecialEvent(0);
      expect(store.getState().monsterStatus).toBe(1);
      expect(store.getState().systems[0].special).toBe(-1);
    });

    it('handles MONSTERKILLED reward', () => {
      const store = createTestStore({
        credits: 1000,
        reputationScore: 0,
        systems: [{ special: MONSTERKILLED }],
      });
      store.getState().triggerSpecialEvent(0);
      expect(store.getState().monsterStatus).toBe(2);
      expect(store.getState().credits).toBe(16000);
      expect(store.getState().reputationScore).toBe(2);
    });

    it('denies JAPORIDISEASE if not enough cargo bays', () => {
      const store = createTestStore({
        ship: makePlayerShip({ type: 1, cargo: [10, 0, 0, 0, 0, 0, 0, 0, 0, 0] }), // Gnat has 15 bays
        systems: [{ special: JAPORIDISEASE }],
      });
      // Used: 10. Free: 5. Need: 10.
      store.getState().triggerSpecialEvent(0);
      expect(store.getState().antidoteOnBoard).toBe(false);
      expect(store.getState().systems[0].special).toBe(JAPORIDISEASE);
    });

    it('accepts JAPORIDISEASE if enough cargo bays', () => {
      const store = createTestStore({
        ship: makePlayerShip({ type: 1, cargo: new Array(10).fill(0) }),
        systems: [{ special: JAPORIDISEASE }],
      });
      store.getState().triggerSpecialEvent(0);
      expect(store.getState().antidoteOnBoard).toBe(true);
      expect(store.getState().japoriStatus).toBe(1);
    });

    it('increases all skills on MEDICINEDELIVERY', () => {
      const store = createTestStore({
        systems: [{ special: MEDICINEDELIVERY }],
        pilotSkill: 5,
        fighterSkill: 5,
        traderSkill: 5,
        engineerSkill: 5,
      });
      store.getState().triggerSpecialEvent(0);
      expect(store.getState().pilotSkill).toBe(6);
      expect(store.getState().engineerSkill).toBe(6);
      expect(store.getState().japoriStatus).toBe(2);
    });

    it('increases lowest skill on SKILLINCREASE', () => {
      const store = createTestStore({
        systems: [{ special: SKILLINCREASE }],
        pilotSkill: 8,
        fighterSkill: 4, // Lowest
        traderSkill: 6,
        engineerSkill: 7,
      });
      store.getState().triggerSpecialEvent(0);
      expect(store.getState().fighterSkill).toBe(5);
    });
  });
});
