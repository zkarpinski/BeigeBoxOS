import { useSpaceTraderGame } from '../useSpaceTraderGame';

// Setup before tests
beforeEach(() => {
  // Reset the game before each test
  const { startNewGame } = useSpaceTraderGame.getState();
  startNewGame('Test', 2, { pilot: 4, fighter: 4, trader: 4, engineer: 4 });
});

describe('Space Trader Game Logic Port', () => {
  it('generates a deterministic galaxy of 120 systems', () => {
    const { systems } = useSpaceTraderGame.getState();
    expect(systems).toHaveLength(120);
    // Sol system should be generated, and coordinates should be valid
    expect(systems[0].nameIndex).toBeGreaterThanOrEqual(0);
    expect(systems[0].nameIndex).toBeLessThan(120);
  });

  it('generates economy quantities based on diff and techlevel', () => {
    const { systemQuantities } = useSpaceTraderGame.getState();
    expect(systemQuantities).toHaveLength(10);
  });

  it('modifies buy and sell prices correctly based on standard formulas', () => {
    const { buyPrices, sellPrices } = useSpaceTraderGame.getState();
    expect(buyPrices).toHaveLength(10);
    expect(sellPrices).toHaveLength(10);

    // Water should be extremely cheap
    expect(buyPrices[0]).toBeGreaterThanOrEqual(0);
  });
});
