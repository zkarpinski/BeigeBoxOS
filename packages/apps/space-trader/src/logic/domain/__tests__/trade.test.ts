import { executeBuy, executeSell } from '../trade';
import { PlayerShip } from '../../DataTypes';

describe('trade domain logic', () => {
  const mockShip: PlayerShip = {
    type: 1, // Gnat (15 cargo bays)
    cargo: new Array(10).fill(0),
    weapon: [0, -1, -1],
    shield: [-1, -1, -1],
    shieldStrength: [-1, -1, -1],
    gadget: [-1, -1, -1],
    escapePod: false,
    fuel: 14,
    hull: 100,
  };

  const state = {
    credits: 1000,
    ship: mockShip,
    buyPrices: [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000],
    sellPrices: [90, 180, 270, 360, 450, 540, 630, 720, 810, 900],
    systemQuantities: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
  };

  test('executeBuy - successful purchase', () => {
    const result = executeBuy(0, 5, state); // Buy 5 units of good 0 at 100 cr each
    expect(result).not.toBeNull();
    if (result) {
      expect(result.credits).toBe(500);
      expect(result.cargo[0]).toBe(5);
      expect(result.systemQuantities[0]).toBe(5);
    }
  });

  test('executeBuy - insufficient credits', () => {
    const poorState = { ...state, credits: 50 };
    const result = executeBuy(0, 1, poorState);
    expect(result).toBeNull();
  });

  test('executeBuy - insufficient cargo space', () => {
    const fullShip = { ...mockShip, cargo: [15, 0, 0, 0, 0, 0, 0, 0, 0, 0] };
    const fullState = { ...state, ship: fullShip };
    const result = executeBuy(1, 1, fullState);
    expect(result).toBeNull();
  });

  test('executeSell - successful sale', () => {
    const cargoShip = { ...mockShip, cargo: [5, 0, 0, 0, 0, 0, 0, 0, 0, 0] };
    const sellState = { ...state, ship: cargoShip };
    const result = executeSell(0, 3, sellState); // Sell 3 units at 90 cr each
    expect(result).not.toBeNull();
    if (result) {
      expect(result.credits).toBe(1000 + 3 * 90);
      expect(result.cargo[0]).toBe(2);
      expect(result.systemQuantities[0]).toBe(13);
    }
  });

  test('executeSell - nothing to sell', () => {
    const result = executeSell(1, 1, state);
    expect(result).toBeNull();
  });
});
