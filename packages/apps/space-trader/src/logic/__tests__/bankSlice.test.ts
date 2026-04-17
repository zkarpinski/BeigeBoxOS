import { calculateNetWorth } from '../store/bankSlice';
import { ShipTypes, Weapons, Shields, Gadgets } from '../DataTypes';

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
    const withoutDebt = calculateNetWorth(baseState);
    expect(calculateNetWorth(withDebt)).toBe(withoutDebt - 500);
  });

  it('includes weapon value', () => {
    const withWeapon = {
      ...baseState,
      ship: { ...baseState.ship, weapon: [0, -1, -1] },
    };
    const baseWorth = calculateNetWorth(baseState);
    const weaponWorth = calculateNetWorth(withWeapon);
    expect(weaponWorth).toBe(baseWorth + Math.floor((Weapons[0].price * 2) / 3));
  });

  it('includes shield value', () => {
    const withShield = {
      ...baseState,
      ship: { ...baseState.ship, shield: [0, -1, -1] },
    };
    const baseWorth = calculateNetWorth(baseState);
    const shieldWorth = calculateNetWorth(withShield);
    expect(shieldWorth).toBe(baseWorth + Math.floor((Shields[0].price * 2) / 3));
  });

  it('includes gadget value', () => {
    const withGadget = {
      ...baseState,
      ship: { ...baseState.ship, gadget: [0, -1, -1] },
    };
    const baseWorth = calculateNetWorth(baseState);
    const gadgetWorth = calculateNetWorth(withGadget);
    expect(gadgetWorth).toBe(baseWorth + Math.floor((Gadgets[0].price * 2) / 3));
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
    const baseWorth = calculateNetWorth(baseState);
    expect(calculateNetWorth(withCargo)).toBe(baseWorth + 500);
  });

  it('returns correct value for fully-equipped ship', () => {
    const state = {
      credits: 5000,
      debt: 2000,
      sellPrices: [100, 200, 0, 0, 0, 0, 0, 0, 0, 0],
      ship: {
        type: 4, // Bumblebee
        cargo: [3, 2, 0, 0, 0, 0, 0, 0, 0, 0],
        weapon: [1, -1, -1],
        shield: [1, -1, -1],
        gadget: [0, -1, -1],
      },
    };
    const worth = calculateNetWorth(state);
    const expected =
      5000 +
      Math.floor((ShipTypes[4].price * 3) / 4) +
      Math.floor((Weapons[1].price * 2) / 3) +
      Math.floor((Shields[1].price * 2) / 3) +
      Math.floor((Gadgets[0].price * 2) / 3) +
      3 * 100 +
      2 * 200 -
      2000;
    expect(worth).toBe(expected);
  });
});
