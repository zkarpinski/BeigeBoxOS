import {
  shipStrength,
  determineEncounterAction,
  ENCOUNTER_POLICE,
  ENCOUNTER_PIRATE,
  ENCOUNTER_TRADER,
  ENCOUNTER_MONSTER,
  ENCOUNTER_DRAGONFLY,
  ENCOUNTER_SCARAB,
} from '../Encounter';
import { PlayerShip, Shields } from '../DataTypes';

function makeShip(overrides: Partial<PlayerShip> = {}): PlayerShip {
  return {
    type: 1,
    cargo: new Array(10).fill(0),
    weapon: [-1, -1, -1],
    shield: [-1, -1, -1],
    shieldStrength: [-1, -1, -1],
    gadget: [-1, -1, -1],
    escapePod: false,
    fuel: 14,
    hull: 100,
    ...overrides,
  };
}

describe('shipStrength', () => {
  it('returns hull value for unarmed ship', () => {
    const ship = makeShip({ hull: 50 });
    expect(shipStrength(ship)).toBe(50);
  });

  it('adds weapon power * 5', () => {
    const ship = makeShip({ weapon: [0, -1, -1] }); // Pulse laser, power varies
    const str = shipStrength(ship);
    expect(str).toBeGreaterThan(100); // hull 100 + weapon contribution
  });

  it('adds shield power * 2', () => {
    const ship = makeShip({ shield: [0, -1, -1] }); // Energy shield
    const str = shipStrength(ship);
    expect(str).toBe(100 + Shields[0].power * 2);
  });

  it('combines hull, weapons, and shields', () => {
    const ship = makeShip({
      hull: 80,
      weapon: [0, 1, -1], // pulse + beam
      shield: [0, -1, -1],
    });
    const str = shipStrength(ship);
    expect(str).toBeGreaterThan(80);
  });
});

describe('determineEncounterAction', () => {
  const playerShip = makeShip();
  const npcShip = makeShip();

  describe('boss encounters', () => {
    it('returns ATTACK for MONSTER', () => {
      expect(determineEncounterAction(ENCOUNTER_MONSTER, 0, playerShip, npcShip)).toBe('ATTACK');
    });

    it('returns ATTACK for DRAGONFLY', () => {
      expect(determineEncounterAction(ENCOUNTER_DRAGONFLY, 0, playerShip, npcShip)).toBe('ATTACK');
    });

    it('returns ATTACK for SCARAB', () => {
      expect(determineEncounterAction(ENCOUNTER_SCARAB, 0, playerShip, npcShip)).toBe('ATTACK');
    });
  });

  describe('police encounters', () => {
    it('returns INSPECT for clean record', () => {
      expect(determineEncounterAction(ENCOUNTER_POLICE, 5, playerShip, npcShip)).toBe('INSPECT');
    });

    it('returns INSPECT for slightly criminal record (-29)', () => {
      expect(determineEncounterAction(ENCOUNTER_POLICE, -29, playerShip, npcShip)).toBe('INSPECT');
    });

    it('returns ATTACK for criminal record (-30)', () => {
      expect(determineEncounterAction(ENCOUNTER_POLICE, -30, playerShip, npcShip)).toBe('ATTACK');
    });

    it('returns ATTACK for very criminal record (-70)', () => {
      expect(determineEncounterAction(ENCOUNTER_POLICE, -70, playerShip, npcShip)).toBe('ATTACK');
    });
  });

  describe('pirate encounters', () => {
    it('returns ATTACK when NPC is comparable strength', () => {
      const strongNpc = makeShip({ hull: 100, weapon: [1, 1, -1] });
      expect(determineEncounterAction(ENCOUNTER_PIRATE, 0, playerShip, strongNpc)).toBe('ATTACK');
    });

    it('returns FLEE_NPC when NPC is much weaker (strength * 2 < player)', () => {
      const strongPlayer = makeShip({ hull: 200, weapon: [2, 2, 2], shield: [1, 1, -1] });
      const weakNpc = makeShip({ hull: 20, weapon: [-1, -1, -1] });
      expect(determineEncounterAction(ENCOUNTER_PIRATE, 0, strongPlayer, weakNpc)).toBe('FLEE_NPC');
    });
  });

  describe('trader encounters', () => {
    it('returns TRADE_OFFER', () => {
      expect(determineEncounterAction(ENCOUNTER_TRADER, 0, playerShip, npcShip)).toBe(
        'TRADE_OFFER',
      );
    });

    it('returns TRADE_OFFER regardless of police record', () => {
      expect(determineEncounterAction(ENCOUNTER_TRADER, -100, playerShip, npcShip)).toBe(
        'TRADE_OFFER',
      );
    });
  });
});
