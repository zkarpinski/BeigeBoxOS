import { createStore } from 'zustand/vanilla';
import { createBankSlice, calculateNetWorth } from '../store/bankSlice';
import { ShipTypes, Weapons, Shields, Gadgets } from '../DataTypes';

function createTestStore(overrides: any = {}) {
  return createStore<any>()(
    (set, get, api) =>
      ({
        ...createBankSlice(set, get, api),
        credits: 1000,
        debt: 0,
        traderSkill: 5,
        sellPrices: new Array(10).fill(0),
        ship: {
          type: 1, // Gnat
          cargo: new Array(10).fill(0),
          weapon: [-1, -1, -1],
          shield: [-1, -1, -1],
          gadget: [-1, -1, -1],
          hull: ShipTypes[1].hullStrength,
          fuel: ShipTypes[1].fuelTanks,
        },
        ...overrides,
      }) as any,
  );
}

describe('bankSlice', () => {
  describe('calculateNetWorth', () => {
    const baseState = {
      credits: 1000,
      debt: 0,
      sellPrices: new Array(10).fill(0),
      ship: {
        type: 1, // Gnat
        cargo: new Array(10).fill(0),
        weapon: [-1, -1, -1],
        shield: [-1, -1, -1],
        gadget: [-1, -1, -1],
        hull: ShipTypes[1].hullStrength,
        fuel: ShipTypes[1].fuelTanks,
      },
    };

    it('includes credits and ship trade-in value (accounting for status)', () => {
      const state = {
        ...baseState,
        ship: {
          ...baseState.ship,
          hull: 50,
          fuel: 5,
        },
      };

      const shipType = ShipTypes[1];
      let expectedShipValue = Math.floor((shipType.price * 3) / 4);
      expectedShipValue -= (shipType.hullStrength - 50) * shipType.repairCosts;
      expectedShipValue -= (shipType.fuelTanks - 5) * shipType.costOfFuel;

      const worth = calculateNetWorth(state as any);
      expect(worth).toBe(1000 + Math.max(0, expectedShipValue));
    });

    it('subtracts debt', () => {
      const withDebt = { ...baseState, debt: 500 };
      const withoutDebt = calculateNetWorth(baseState as any);
      expect(calculateNetWorth(withDebt as any)).toBe(withoutDebt - 500);
    });

    it('includes cargo value at sell prices', () => {
      const cargo = new Array(10).fill(0);
      cargo[0] = 5; // 5 units of Water
      const sellPrices = new Array(10).fill(0);
      sellPrices[0] = 100; // Water sells for 100
      const withCargo = {
        ...baseState,
        ship: { ...baseState.ship, cargo },
        sellPrices,
      };
      const baseWorth = calculateNetWorth(baseState as any);
      expect(calculateNetWorth(withCargo as any)).toBe(baseWorth + 500);
    });
  });

  describe('borrowCredits', () => {
    it('calculates max loan based on net worth (10% rounded to 500)', () => {
      // Gnat worth is ~7500. Credits 10000. Total worth ~17500.
      // 10% is 1750. Rounded to 500 is 1500.
      const store = createTestStore({ credits: 10000, debt: 0, policeRecordScore: 0 });
      store.getState().borrowCredits(5000);

      // Worth = 10000 + 7500 = 17500. Limit = 1500.
      expect(store.getState().debt).toBe(1500);
    });

    it('limits dubious record to 500 credits', () => {
      const store = createTestStore({ credits: 10000, debt: 0, policeRecordScore: -1 });
      store.getState().borrowCredits(1000);
      expect(store.getState().debt).toBe(500);
    });
  });

  describe('repayDebt', () => {
    it('reduces debt and credits when paying back', () => {
      const store = createTestStore({ credits: 5000, debt: 2000 });
      store.getState().repayDebt(500);
      expect(store.getState().debt).toBe(1500);
      expect(store.getState().credits).toBe(4500);
    });

    it('pays back maximum possible if credits are low during repayment', () => {
      const store = createTestStore({ credits: 100, debt: 2000 });
      store.getState().repayDebt(500);
      expect(store.getState().debt).toBe(1900); // Paid 100
      expect(store.getState().credits).toBe(0);
    });

    it('limits repayment to current debt', () => {
      const store = createTestStore({ credits: 5000, debt: 1000 });
      store.getState().repayDebt(2000);
      expect(store.getState().debt).toBe(0);
      expect(store.getState().credits).toBe(4000);
    });
  });
});
