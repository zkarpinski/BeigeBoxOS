import {
  getTotalWeapons,
  getTotalShieldStrength,
  getStrengthPolice,
  determineEncounter,
  ENCOUNTER_POLICE,
  ENCOUNTER_PIRATE,
  ENCOUNTER_NONE,
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

    it('increases police strength for criminals', () => {
      const normalStrength = getStrengthPolice(mockSystem, 0);
      const criminalStrength = getStrengthPolice(mockSystem, -50);
      expect(criminalStrength).toBeGreaterThan(normalStrength);
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
});
