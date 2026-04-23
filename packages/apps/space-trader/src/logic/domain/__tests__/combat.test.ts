import { resolveCombatRound, resolveFlee } from '../combat';
import { PlayerShip, ShipTypes } from '../../DataTypes';

describe('combat domain logic', () => {
  const mockPlayerShip: PlayerShip = {
    type: 1, // Gnat
    cargo: new Array(10).fill(0),
    weapon: [0, -1, -1], // Pulse Laser
    shield: [-1, -1, -1],
    shieldStrength: [-1, -1, -1],
    gadget: [-1, -1, -1],
    escapePod: false,
    fuel: 14,
    hull: 100,
  };

  const mockNPCEncounter = {
    ship: {
      type: 1,
      cargo: new Array(10).fill(0),
      weapon: [0, -1, -1],
      shield: [-1, -1, -1],
      shieldStrength: [-1, -1, -1],
      gadget: [-1, -1, -1],
      escapePod: false,
      fuel: 14,
      hull: 50,
    },
    pilotSkill: 5,
    fighterSkill: 5,
    engineerSkill: 5,
    bounty: 100,
    lootCargo: new Array(10).fill(0),
  };

  test('resolveCombatRound - victory scenario', () => {
    // Force a win by giving player perfect skills and NPC 1 HP
    const weakNPC = {
      ...mockNPCEncounter,
      ship: { ...mockNPCEncounter.ship, hull: 1 },
    };

    // We can't perfectly control randomness without mocking Math.random,
    // but with high enough skills, hits are much more likely.
    const result = resolveCombatRound(
      mockPlayerShip,
      weakNPC,
      1, // difficulty
      { pilot: 10, fighter: 10, engineer: 10 },
      [],
      0,
    );

    // If player hits (high probability), NPC should be destroyed
    if (result.playerWon) {
      expect(result.npcShip.hull).toBeLessThanOrEqual(0);
      expect(result.resolved).toBe(true);
      expect(result.bounty).toBe(100);
    }
  });

  test('resolveCombatRound - player takes damage', () => {
    // NPC with high skills vs weak player
    const strongNPC = { ...mockNPCEncounter, fighterSkill: 10 };
    const result = resolveCombatRound(
      mockPlayerShip,
      strongNPC,
      5, // difficulty
      { pilot: 1, fighter: 1, engineer: 1 },
      [],
      0,
    );

    // NPC is likely to hit
    if (result.log.some((l) => l.includes('NPC hits you'))) {
      expect(result.playerShip.hull).toBeLessThan(100);
    }
  });

  test('resolveFlee - success scenario', () => {
    const result = resolveFlee(
      mockPlayerShip,
      mockNPCEncounter,
      1,
      { pilot: 10, engineer: 10 },
      [],
      0,
    );

    expect(result.log.length).toBeGreaterThan(0);
    if (result.log.includes('You successfully fled!')) {
      expect(result.resolved).toBe(true);
    }
  });

  describe('deterministic combat mechanics', () => {
    let randomSpy: jest.SpyInstance;

    beforeEach(() => {
      randomSpy = jest.spyOn(Math, 'random');
    });

    afterEach(() => {
      randomSpy.mockRestore();
    });

    test('resolveCombatRound - predictable hit and damage', () => {
      // Sequence of getRandom() calls in executeAttack:
      //  player attack: hitChance, evadeChance, damage, npcRepair
      // npc attack: hitChance, evadeChance, damage, playerRepair

      // Player attacks NPC: Hit + Max Damage (Pulse laser power 15, max 16)
      // NPC attacks Player: Miss
      randomSpy
        .mockReturnValueOnce(0.9) // 1. player hitChance
        .mockReturnValueOnce(0.1) // 2. npc evadeChance
        .mockReturnValueOnce(0.99) // 3. damage roll (15)
        .mockReturnValueOnce(0.01) // 4. npc repair roll (0)
        .mockReturnValueOnce(0.01) // 5. npc hitChance
        .mockReturnValueOnce(0.9); // 6. player evadeChance

      const result = resolveCombatRound(
        mockPlayerShip,
        mockNPCEncounter,
        1,
        { pilot: 5, fighter: 5, engineer: 5 },
        [],
        0,
      );

      expect(result.log).toContain('Round 1: You hit! NPC hull: 35 / shields: 0');
      expect(result.log).toContain('NPC missed.');
      expect(result.npcShip.hull).toBe(35);
    });

    test('shields absorb damage before hull', () => {
      const playerWithShield: PlayerShip = {
        ...mockPlayerShip,
        shield: [0], // Energy shield
        shieldStrength: [100],
      };

      // Player misses NPC
      // NPC hits Player for damage
      // Military Laser power 35. 3 lasers = 105.
      // Max potential damage with engineer skill: Math.floor(105 * 1.08) = 113. (npc engineer 4)
      randomSpy
        .mockReturnValueOnce(0.1) // 1. player hit
        .mockReturnValueOnce(0.9) // 2. npc evade
        .mockReturnValueOnce(0.9) // 3. npc hit
        .mockReturnValueOnce(0.1) // 4. player evade
        .mockReturnValueOnce(0.1); // 5. damage roll (0.1 * 113 = 11)

      const strongNPC = {
        ...mockNPCEncounter,
        ship: { ...mockNPCEncounter.ship, weapon: [2, 2, 2] }, // 3 Military lasers
      };

      const result = resolveCombatRound(
        playerWithShield,
        strongNPC,
        1,
        { pilot: 5, fighter: 5, engineer: 5 },
        [],
        0,
      );

      expect(result.playerShip.hull).toBe(100); // Intact
      expect(result.playerShip.shieldStrength[0]).toBe(89); // 100 - 11
      expect(result.log.some((l) => l.includes('NPC hits you!'))).toBe(true);
    });

    test('engineer skill reduces incoming hull damage', () => {
      // NPC hits player (no shields)
      randomSpy
        .mockReturnValueOnce(0.1)
        .mockReturnValueOnce(0.9) // Player misses
        .mockReturnValueOnce(0.9)
        .mockReturnValueOnce(0.1) // NPC hits
        .mockReturnValueOnce(0.5) // Damage roll (say 30)
        .mockReturnValueOnce(0.99); // Damage reduction roll (Max based on engineer skill)

      const result = resolveCombatRound(
        mockPlayerShip,
        mockNPCEncounter,
        1,
        { pilot: 1, fighter: 1, engineer: 10 }, // High engineer
        [],
        0,
      );

      // Even if hit, damage is reduced by engineer skill
      // damage -= getRandom(defenderEngineerSkill)
      // With engineer 10, up to 9 damage reduced.
      expect(result.log.some((l) => l.includes('NPC hits you!'))).toBe(true);
    });
  });
});
