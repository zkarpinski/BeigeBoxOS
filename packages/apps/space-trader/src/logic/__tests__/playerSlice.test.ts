import { createStore } from 'zustand/vanilla';
import { createPlayerSlice } from '../store/playerSlice';
import { ShipTypes, Weapons, Shields, Gadgets, ESCAPE_POD_PRICE } from '../DataTypes';
import { SpaceTraderState } from '../store/types';

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
        ...createPlayerSlice(set, get, api),
        credits: 1000,
        difficulty: 1,
        policeRecordScore: 0,
        systems: [{ techLevel: 8, politics: 0, size: 2, qty: new Array(10).fill(10) } as any],
        currentSystem: 0,
        ship: makePlayerShip(),
        buyPrices: new Array(10).fill(100),
        sellPrices: new Array(10).fill(80),
        systemQuantities: new Array(10).fill(10),
        getSpecialCargoBays: () => 0,
        ...overrides,
      }) as any,
  );
}

describe('playerSlice', () => {
  describe('equipment management', () => {
    it('buys a weapon if slot available and enough credits', () => {
      const store = createTestStore({ credits: 5000 });
      store.getState().buyWeapon(0); // Pulse laser

      const state = store.getState();
      expect(state.credits).toBe(5000 - Weapons[0].price);
      expect(state.ship.weapon[0]).toBe(0);
    });

    it('fails to buy weapon if no slots available', () => {
      // Flea has 0 weapon slots
      const store = createTestStore({
        credits: 5000,
        ship: makePlayerShip({ type: 0, weapon: [] }),
      });
      store.getState().buyWeapon(0);
      expect(store.getState().ship.weapon).toHaveLength(0);
    });

    it('buys a shield and initializes its strength', () => {
      // Gnat has 0 shield slots. Use Firefly (type 2) which has 1 slot.
      const store = createTestStore({
        credits: 10000,
        ship: makePlayerShip({ type: 2, shield: [-1], shieldStrength: [-1] }),
      });
      store.getState().buyShield(0); // Energy shield

      const state = store.getState();
      expect(state.ship.shield[0]).toBe(0);
      expect(state.ship.shieldStrength[0]).toBe(Shields[0].power);
    });

    it('buys a gadget', () => {
      const store = createTestStore({ credits: 5000 });
      store.getState().buyGadget(0);
      expect(store.getState().ship.gadget[0]).toBe(0);
    });

    it('sells equipment for half price', () => {
      const store = createTestStore({
        credits: 1000,
        ship: makePlayerShip({ weapon: [0, -1, -1], shield: [0, -1, -1], gadget: [0, -1, -1] }),
      });
      const refundW = Math.floor((Weapons[0].price * 2) / 3);
      store.getState().sellEquipment('weapon', 0);
      expect(store.getState().credits).toBe(1000 + refundW);
      expect(store.getState().ship.weapon[0]).toBe(-1);

      const refundS = Math.floor((Shields[0].price * 2) / 3);
      store.getState().sellEquipment('shield', 0);
      expect(store.getState().credits).toBe(1000 + refundW + refundS);
      expect(store.getState().ship.shield[0]).toBe(-1);

      const refundG = Math.floor((Gadgets[0].price * 2) / 3);
      store.getState().sellEquipment('gadget', 0);
      expect(store.getState().credits).toBe(1000 + refundW + refundS + refundG);
      expect(store.getState().ship.gadget[0]).toBe(-1);
    });

    it('handles buyEscapePod', () => {
      const store = createTestStore({
        credits: 50000,
        currentSystem: 0,
        systems: [{ techLevel: 8 }],
      });
      store.getState().buyEscapePod();
      expect(store.getState().ship.escapePod).toBe(true);
      expect(store.getState().credits).toBe(50000 - ESCAPE_POD_PRICE);
    });

    it('denies buyEscapePod if tech level is too low', () => {
      const store = createTestStore({
        credits: 50000,
        currentSystem: 0,
        systems: [{ techLevel: 1 }],
      });
      store.getState().buyEscapePod();
      expect(store.getState().ship.escapePod).toBe(false);
    });
  });

  describe('ship upgrades', () => {
    it('calculates trade-in value correctly when buying a new ship', () => {
      // Start with Gnat (price 10000)
      // Trade-in should be 7500 if pristine
      const store = createTestStore({
        credits: 30000,
        ship: makePlayerShip({ type: 1, hull: 100, weapon: [0, -1, -1] }),
      });

      const gnatType = ShipTypes[1];
      const beetleType = ShipTypes[5]; // Price 80000

      // Trade-in components:
      // Pristine ship: 75% of 10000 = 7500
      // Pulse laser refund (66% of 2000): 1333
      // Total trade-in: 8833
      // Beetle price: 80000. Net cost: 71167.
      // But we only have 30000 credits. Fails.

      store.getState().buyShip(5);
      expect(store.getState().ship.type).toBe(1); // Still Gnat

      // Give enough credits
      store.setState({ credits: 100000 });
      store.getState().buyShip(5);
      expect(store.getState().ship.type).toBe(5);
      expect(store.getState().credits).toBeLessThan(100000);
    });

    it('transfers cargo if new ship has enough space', () => {
      const cargo = [10, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      const store = createTestStore({
        credits: 1000000,
        ship: makePlayerShip({ type: 1, cargo }), // Gnat has 15 bays
      });

      store.getState().buyShip(4); // Bumblebee has 25 bays
      expect(store.getState().ship.cargo[0]).toBe(10);
    });

    it('erases cargo if new ship is too small', () => {
      const cargo = [15, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      const store = createTestStore({
        credits: 1000000,
        ship: makePlayerShip({ type: 1, cargo }), // Gnat 15 bays
      });

      store.getState().buyShip(0); // Flea has 10 bays
      expect(store.getState().ship.cargo[0]).toBe(0);
    });
  });

  describe('contraband', () => {
    it('dumps cargo for a fee based on difficulty', () => {
      const store = createTestStore({
        credits: 1000,
        difficulty: 1, // Easy
        ship: makePlayerShip({ cargo: [5, 0, 0, 0, 0, 0, 0, 0, 0, 0] }),
      });
      // cost = amount * 5 * (difficulty + 1) = 2 * 5 * 2 = 20
      store.getState().dumpCargo(0, 2);
      expect(store.getState().ship.cargo[0]).toBe(3);
      expect(store.getState().credits).toBe(1000 - 20);
    });
  });

  describe('maintenance', () => {
    it('repairs hull', () => {
      const type = ShipTypes[1];
      const store = createTestStore({
        credits: 5000,
        ship: makePlayerShip({ hull: type.hullStrength - 10 }),
      });
      store.getState().repairHull();
      expect(store.getState().ship.hull).toBe(type.hullStrength);
    });

    it('buys fuel', () => {
      const type = ShipTypes[1];
      const store = createTestStore({
        credits: 5000,
        ship: makePlayerShip({ fuel: type.fuelTanks - 5 }),
      });
      store.getState().buyFuel(5);
      expect(store.getState().ship.fuel).toBe(type.fuelTanks);
    });
  });

  describe('trade wrappers', () => {
    it('buys goods', () => {
      const store = createTestStore({ credits: 5000, currentSystem: 0 });
      store.getState().buyGood(0, 2);
      expect(store.getState().ship.cargo[0]).toBe(2);
      expect(store.getState().systems[0].qty[0]).toBe(8); // Started with 10 from mock
    });

    it('sells goods', () => {
      const store = createTestStore({
        credits: 5000,
        currentSystem: 0,
        ship: makePlayerShip({ cargo: [5, 0, 0, 0, 0, 0, 0, 0, 0, 0] }),
      });
      store.getState().sellGood(0, 2);
      expect(store.getState().ship.cargo[0]).toBe(3);
      expect(store.getState().systems[0].qty[0]).toBe(12); // Started with 10 from mock
    });
  });
});
