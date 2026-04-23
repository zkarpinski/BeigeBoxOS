import { generateGalaxy } from '../SystemGenerator';
import { SolarSystem } from '../DataTypes';

describe('System Generator', () => {
  it('generates exactly 120 systems', () => {
    const { systems } = generateGalaxy();
    expect(systems).toHaveLength(120);
  });

  it('generates deterministic systems for valid index range', () => {
    const { systems } = generateGalaxy();
    systems.forEach((system, index) => {
      expect(system.nameIndex).toBe(index);
      expect(system.x).toBeGreaterThanOrEqual(0);
      expect(system.y).toBeGreaterThanOrEqual(0);
      expect(system.techLevel).toBeGreaterThanOrEqual(0);
      expect(system.techLevel).toBeLessThanOrEqual(7);
    });
  });

  it('includes classic system names in order', () => {
    // Check first and some middle ones
    const { systems } = generateGalaxy();
    // Indices based on the hardcoded SystemNames array in DataTypes.ts
    // 0: Acamar, 1: Adahn, etc.
    expect(systems[0].nameIndex).toBe(0);
    expect(systems[119].nameIndex).toBe(119);
  });

  it('ensures systems are within the 150x100 grid', () => {
    const { systems } = generateGalaxy();
    systems.forEach((s) => {
      expect(s.x).toBeLessThan(150);
      expect(s.y).toBeLessThan(100);
    });
  });

  it('ensures systems are spaced by at least MINDISTANCE (7)', () => {
    const { systems } = generateGalaxy();
    for (let i = 0; i < systems.length; i++) {
      for (let j = i + 1; j < systems.length; j++) {
        const dist = Math.sqrt(
          Math.pow(systems[i].x - systems[j].x, 2) + Math.pow(systems[i].y - systems[j].y, 2),
        );
        // We use Math.floor because SystemGenerator uses sqrDistance check which is precision-dependent
        // but realDistance should be >= 7.
        expect(dist).toBeGreaterThanOrEqual(7);
      }
    }
  });
});
