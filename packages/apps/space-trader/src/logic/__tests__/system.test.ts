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

  it('ensures systems are spaced out slightly (no identical coords)', () => {
    const { systems } = generateGalaxy();
    const coords = new Set();
    systems.forEach((s) => {
      const key = `${s.x},${s.y}`;
      expect(coords.has(key)).toBe(false);
      coords.add(key);
    });
  });
});
