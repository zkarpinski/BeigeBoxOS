import { useSpaceTraderGame } from '../useSpaceTraderGame';

describe('Space Trader Logic — Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    // Force reset the store to a known state before each test
    // since the singleton might have carry-over from other tests.
    const { startNewGame } = useSpaceTraderGame.getState();
    startNewGame('Test', 2, { pilot: 4, fighter: 4, trader: 4, engineer: 4 });
  });

  it('filters out functions when persisting state', () => {
    const saved = localStorage.getItem('space-trader-save');
    expect(saved).not.toBeNull();

    const parsed = JSON.parse(saved!).state;

    // Core data should be present
    expect(parsed.nameCommander).toBe('Test');
    expect(parsed.credits).toBe(1000);

    // No functions should be persisted
    Object.values(parsed).forEach((value) => {
      expect(typeof value).not.toBe('function');
    });
  });

  it('can rehydrate state from a JSON string', async () => {
    const mockState = {
      state: {
        nameCommander: 'Rehydrated',
        credits: 99999,
        ship: {
          type: 4,
          hull: 100,
          cargo: [],
          weapon: [],
          shield: [],
          shieldStrength: [],
          gadget: [],
          fuel: 14,
          escapePod: false,
        },
      },
      version: 0,
    };

    localStorage.setItem('space-trader-save', JSON.stringify(mockState));

    // Zustand's persist middleware for localStorage is synchronous, but
    // rehydration happens after store creation. Since the store is a singleton
    // already created, we may need to use the persist API to re-trigger it
    // or just rely on the next access if it's already rehydrated.

    // In our case, initialize another instance or wait for the singleton to sync.
    // Let's use the persist API to manually rehydrate from the new localStorage content.
    await (useSpaceTraderGame.persist as any).rehydrate();

    const state = useSpaceTraderGame.getState();
    expect(state.nameCommander).toBe('Rehydrated');
    expect(state.credits).toBe(99999);
  });
});
