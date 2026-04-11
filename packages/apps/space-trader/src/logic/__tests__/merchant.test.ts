import { getStandardPrice, generateSystemQuantities, determineSystemPrices } from '../Merchant';
import { TradeItems, SolarSystem, NARCOTICS, FIREARMS, WATER, ROBOTS } from '../DataTypes';

describe('Merchant Logic', () => {
  const mockSystem: SolarSystem = {
    nameIndex: 0,
    x: 100,
    y: 100,
    size: 2, // Large
    techLevel: 5, // Industrial
    politics: 0, // Anarchy (Drugs/Firearms typically ok, check PoliticalSystems if needed)
    specialResources: 0,
    status: 0,
    visited: false,
  };

  describe('getStandardPrice', () => {
    it('returns 0 for illegal goods in restricted politics', () => {
      // Cybernetic State (id 5) restricts drugs
      const restrictedPolitics = 5;
      const narcotics = TradeItems[NARCOTICS];
      const price = getStandardPrice(narcotics, 2, 5, restrictedPolitics, 0);
      expect(price).toBe(0);
    });

    it('calculates price based on tech level increment', () => {
      const water = TradeItems[WATER];
      const lowTechPrice = getStandardPrice(water, 0, 0, 0, 0);
      const highTechPrice = getStandardPrice(water, 0, 7, 0, 0);
      expect(highTechPrice).toBeGreaterThan(lowTechPrice);
    });

    it('reduces price in large systems', () => {
      const water = TradeItems[WATER];
      const smallSystemPrice = getStandardPrice(water, 0, 3, 0, 0);
      const largeSystemPrice = getStandardPrice(water, 4, 3, 0, 0);
      expect(largeSystemPrice).toBeLessThan(smallSystemPrice);
    });

    it('returns 0 if tech level is below usage requirements', () => {
      const robots = TradeItems[ROBOTS]; // TechUsage is usually 4+
      const price = getStandardPrice(robots, 2, 0, 0, 0);
      expect(price).toBe(0);
    });
  });

  describe('generateSystemQuantities', () => {
    it('generates 0 quantity for items above system tech level', () => {
      const lowTechSystem = { ...mockSystem, techLevel: 0 };
      const qtys = generateSystemQuantities(lowTechSystem, 0);
      expect(qtys[ROBOTS]).toBe(0);
    });

    it('respects system size for quantity base', () => {
      const smallSystem = { ...mockSystem, size: 0 };
      const largeSystem = { ...mockSystem, size: 4 };
      const smallQtys = generateSystemQuantities(smallSystem, 0);
      const largeQtys = generateSystemQuantities(largeSystem, 0);

      // Summing all qtys to compare productivity
      const smallTotal = smallQtys.reduce((a, b) => a + b, 0);
      const largeTotal = largeQtys.reduce((a, b) => a + b, 0);
      expect(largeTotal).toBeGreaterThan(smallTotal);
    });
  });

  describe('determineSystemPrices', () => {
    let randomSpy: jest.SpyInstance;
    beforeEach(() => {
      randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.5);
    });
    afterEach(() => {
      randomSpy.mockRestore();
    });

    it('adjusts buy prices based on trader skill', () => {
      const lowSkillPrices = determineSystemPrices(mockSystem, 0, 0);
      const highSkillPrices = determineSystemPrices(mockSystem, 10, 0);

      // Higher skill should lead to lower buy prices
      expect(highSkillPrices.buyPrices[WATER]).toBeLessThan(lowSkillPrices.buyPrices[WATER]);
    });

    it('always keeps buy price higher than sell price', () => {
      const prices = determineSystemPrices(mockSystem, 10, 0);
      for (let i = 0; i < 10; i++) {
        if (prices.buyPrices[i] > 0) {
          expect(prices.buyPrices[i]).toBeGreaterThan(prices.sellPrices[i]);
        }
      }
    });

    it('reduces sell price for criminals', () => {
      const spy = jest.spyOn(Math, 'random').mockReturnValue(0.5);
      const normalPrices = determineSystemPrices(mockSystem, 5, 0);
      const criminalPrices = determineSystemPrices(mockSystem, 5, -50); // Dubious/Criminal record

      expect(criminalPrices.sellPrices[WATER]).toBeLessThan(normalPrices.sellPrices[WATER]);
      spy.mockRestore();
    });
  });
});
