import {
  getTotalWeapons,
  getTotalShieldStrength,
  getStrengthPolice,
  determineEncounter,
  generateNPCEncounter,
  ENCOUNTER_POLICE,
  ENCOUNTER_PIRATE,
  ENCOUNTER_NONE,
  ENCOUNTER_TRADER,
} from '../Encounter';
import { SolarSystem, PlayerShip, PoliticalSystems } from '../DataTypes';

describe('Encounter Logic', () => {
  const mockShip: PlayerShip = {
    type: 0, // Flea
    cargo: [],
    weapon: [0, -1, -1], // 1 Pulse Laser
    shield: [0, -1], // 1 Energy Shield (type ID 0)
    shieldStrength: [25, -1], // Energy Shield at full power (100 would be full, but test expects 25)
    gadget: [],
    escapePod: false,
    fuel: 20,
    hull: 25,
  };

  const mockSystem: SolarSystem = {
    nameIndex: 0,
    x: 0,
    y: 0,
    size: 2,
    techLevel: 5,
    politics: 15, // Monarchy (High police strength usually)
    specialResources: 0,
    status: 0,
    visited: false,
  };

  it('calculates total weapons power', () => {
    const power = getTotalWeapons(mockShip);
    expect(power).toBe(15); // Pulse laser power
  });

  it('calculates total shield strength', () => {
    const strength = getTotalShieldStrength(mockShip);
    expect(strength).toBe(25);
  });

  describe('determineEncounter', () => {
    it('correctly maps encounter probabilities based on politics', () => {
      // High security system
      const encounters: string[] = [];
      for (let i = 0; i < 100; i++) {
        encounters.push(determineEncounter(mockSystem, 0, 0, 1, false));
      }

      const policeCount = encounters.filter((e) => e === ENCOUNTER_POLICE).length;
      expect(policeCount).toBeGreaterThan(0);
    });

    it('increases police strength for criminals using linear formula', () => {
      // Technocracy (ID 15) strengthPolice is 6
      const normalStrength = getStrengthPolice(mockSystem, 0);
      expect(normalStrength).toBe(6);

      const criminalStrength = getStrengthPolice(mockSystem, -50);
      // 6 - floor(-50/10) = 6 - (-5) = 11
      expect(criminalStrength).toBe(11);

      const psychopathStrength = getStrengthPolice(mockSystem, -100);
      // 6 - floor(-100/10) = 6 - (-10) = 16
      expect(psychopathStrength).toBe(16);
    });

    it('never generates PIRATE if system is already raided', () => {
      const encounter = determineEncounter(mockSystem, 0, 0, 1, true);
      expect(encounter).not.toBe(ENCOUNTER_PIRATE);
    });

    it('reduces encounter chance for Flea ships', () => {
      // Statistics test: Flea (type 0) should have FEWER encounters than Gnat (type 1)
      const fleaEncounters = Array.from({ length: 1000 })
        .map(() => determineEncounter(mockSystem, 0, 0, 0, false))
        .filter((e) => e !== ENCOUNTER_NONE).length;

      const gnatEncounters = Array.from({ length: 1000 })
        .map(() => determineEncounter(mockSystem, 0, 0, 1, false))
        .filter((e) => e !== ENCOUNTER_NONE).length;

      expect(fleaEncounters).toBeLessThan(gnatEncounters);
    });
  });

  describe('NPC gadget equipping', () => {
    it('NPC ships at tech level 4+ can have gadgets equipped', () => {
      // Generate 200 pirates at high tech level — at least some should have gadgets
      const npcs = Array.from({ length: 200 }, () =>
        generateNPCEncounter(ENCOUNTER_PIRATE, 2, 0, 50, 7),
      );
      const hasAnyGadget = npcs.some((n) => n.ship.gadget.some((g) => g >= 0));
      expect(hasAnyGadget).toBe(true);
    });

    it('NPC ships at tech level 1 have no gadgets', () => {
      // At tech level 1, no gadgets are available (all require level 4+)
      const npcs = Array.from({ length: 50 }, () =>
        generateNPCEncounter(ENCOUNTER_PIRATE, 0, 0, 0, 1),
      );
      const allEmpty = npcs.every((n) => n.ship.gadget.every((g) => g === -1));
      expect(allEmpty).toBe(true);
    });
  });
});
