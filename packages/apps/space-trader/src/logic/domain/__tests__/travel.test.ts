import { processWarp, calculateDistance } from '../travel';
import { PlayerShip, SolarSystem, UNEVENTFUL } from '../../DataTypes';

describe('travel domain logic', () => {
  const mockShip: PlayerShip = {
    type: 1, // Gnat
    cargo: new Array(10).fill(0),
    weapon: [0, -1, -1],
    shield: [-1, -1, -1],
    shieldStrength: [-1, -1, -1],
    gadget: [-1, -1, -1],
    escapePod: false,
    fuel: 14,
    hull: 100,
  };

  const mockSystems: SolarSystem[] = [
    {
      nameIndex: 0,
      x: 10,
      y: 10,
      techLevel: 5,
      politics: 1,
      status: UNEVENTFUL,
      size: 2,
      specialResources: 0,
      visited: true,
    },
    {
      nameIndex: 1,
      x: 15,
      y: 15,
      techLevel: 5,
      politics: 1,
      status: UNEVENTFUL,
      size: 2,
      specialResources: 0,
      visited: false,
    },
  ];

  test('calculateDistance', () => {
    const dist = calculateDistance({ x: 0, y: 0 }, { x: 3, y: 4 });
    expect(dist).toBe(5);
  });

  test('processWarp - successful jump', () => {
    const state = {
      currentSystem: 0,
      systems: mockSystems,
      ship: mockShip,
      traderSkill: 5,
      policeRecordScore: 0,
      difficulty: 1,
      days: 0,
      debt: 1000,
    };

    const result = processWarp(1, state);

    expect(result.currentSystem).toBe(1);
    expect(result.days).toBe(1);
    expect(result.debt).toBe(1100); // 1.1x interest
    expect(result.ship.fuel).toBeLessThan(14);
    expect(result.systems[1].visited).toBe(true);
    // Prices should be generated
    expect(result.buyPrices.length).toBe(10);
    expect(result.sellPrices.length).toBe(10);
  });

  test('processWarp - encounter generation probability', () => {
    // This is probabilistic, but we can verify that price generation and fuel consumption always happen
    const state = {
      currentSystem: 0,
      systems: mockSystems,
      ship: mockShip,
      traderSkill: 5,
      policeRecordScore: 0,
      difficulty: 5, // High difficulty for more encounters
      days: 0,
      debt: 0,
    };

    const result = processWarp(1, state);
    expect(result.ship.fuel).toBe(
      14 - Math.floor(calculateDistance(mockSystems[0], mockSystems[1])),
    );
  });
});
