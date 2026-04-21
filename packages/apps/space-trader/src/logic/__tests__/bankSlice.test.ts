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
      },
    };

    it('includes credits and ship base value', () => {
      const worth = calculateNetWorth(baseState);
      const expectedShipValue = Math.floor((ShipTypes[1].price * 3) / 4);
      expect(worth).toBe(1000 + expectedShipValue);
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
    it('allows borrowing up to max loan limit', () => {
      const store = createTestStore({ credits: 0, debt: 0, traderSkill: 10, policeRecordScore: 0 });
      // Max loan = 25000 if record >= 0.
      store.getState().borrowCredits(5000);
      expect(store.getState().credits).toBe(5000);
      expect(store.getState().debt).toBe(5000);
    });

    it('prevents borrowing more than once if at limit', () => {
      const store = createTestStore({
        credits: 25000,
        debt: 25000,
        traderSkill: 10,
        policeRecordScore: 0,
      });
      store.getState().borrowCredits(1000);
      expect(store.getState().debt).toBe(25000);
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
