import {
  generateQuestEncounter,
  ENCOUNTER_MONSTER,
  ENCOUNTER_DRAGONFLY,
  ENCOUNTER_SCARAB,
} from '../Encounter';

describe('generateQuestEncounter', () => {
  describe('Space Monster', () => {
    const enc = generateQuestEncounter(ENCOUNTER_MONSTER);

    it('has hull of 150', () => {
      expect(enc.ship.hull).toBe(150);
    });

    it('has three pulse lasers (weapon id 0)', () => {
      expect(enc.ship.weapon).toEqual([0, 0, 0]);
    });

    it('has no shields', () => {
      expect(enc.ship.shield).toEqual([-1, -1, -1]);
    });

    it('has high fighter skill', () => {
      expect(enc.fighterSkill).toBe(10);
    });

    it('has zero bounty', () => {
      expect(enc.bounty).toBe(0);
    });

    it('has empty loot cargo', () => {
      expect(enc.lootCargo.every((v) => v === 0)).toBe(true);
    });
  });

  describe('Dragonfly', () => {
    const enc = generateQuestEncounter(ENCOUNTER_DRAGONFLY);

    it('has hull of 100', () => {
      expect(enc.ship.hull).toBe(100);
    });

    it('has two beam lasers (weapon id 1)', () => {
      expect(enc.ship.weapon).toEqual([1, 1, -1]);
    });

    it('has an energy shield', () => {
      expect(enc.ship.shield).toEqual([0, -1, -1]);
    });

    it('has very high pilot skill (fast)', () => {
      expect(enc.pilotSkill).toBe(12);
    });
  });

  describe('Scarab', () => {
    const enc = generateQuestEncounter(ENCOUNTER_SCARAB);

    it('has hull of 200', () => {
      expect(enc.ship.hull).toBe(200);
    });

    it('has two military lasers (weapon id 2)', () => {
      expect(enc.ship.weapon).toEqual([2, 2, -1]);
    });

    it('has two reflective shields', () => {
      expect(enc.ship.shield).toEqual([1, 1, -1]);
      expect(enc.ship.shieldStrength).toEqual([60, 60, -1]);
    });

    it('has high fighter and engineer skill', () => {
      expect(enc.fighterSkill).toBe(10);
      expect(enc.engineerSkill).toBe(10);
    });
  });
});
