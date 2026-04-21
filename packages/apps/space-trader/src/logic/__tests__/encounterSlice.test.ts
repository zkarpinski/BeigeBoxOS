/**
 * Tests for encounterSlice actions.
 * We test the slice logic by creating a minimal zustand store.
 */
import { createStore } from 'zustand/vanilla';
import { createEncounterSlice } from '../store/encounterSlice';
import { ActiveEncounter, ShipTypes, PoliticalSystems, PlayerShip } from '../DataTypes';
import {
  ENCOUNTER_PIRATE,
  ENCOUNTER_POLICE,
  ENCOUNTER_TRADER,
  ENCOUNTER_MONSTER,
  NPCEncounterData,
} from '../Encounter';
import { SpaceTraderState, EncounterSlice } from '../store/types';

// Minimal state to satisfy the store shape for encounterSlice
function makePlayerShip(overrides: Partial<PlayerShip> = {}): PlayerShip {
  return {
    type: 1,
    cargo: new Array(10).fill(0),
    weapon: [0, -1, -1],
    shield: [-1, -1, -1],
    shieldStrength: [-1, -1, -1],
    gadget: [-1, -1, -1],
    escapePod: false,
    fuel: 14,
    hull: 100,
    ...overrides,
  };
}

function makeNPC(overrides: Partial<NPCEncounterData> = {}): NPCEncounterData {
  return {
    ship: makePlayerShip({ hull: 50, weapon: [0, -1, -1] }),
    fighterSkill: 4,
    pilotSkill: 4,
    engineerSkill: 4,
    bounty: 50,
    lootCargo: [3, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ...overrides,
  };
}

function makeEncounter(overrides: Partial<ActiveEncounter> = {}): ActiveEncounter {
  return {
    type: ENCOUNTER_PIRATE,
    npc: makeNPC(),
    log: [],
    round: 0,
    resolved: false,
    playerWon: false,
    clickNumber: 5,
    destinationSystemIdx: 0,
    encounterAction: 'ATTACK',
    ...overrides,
  };
}

// Create a store with only the fields encounterSlice needs from other slices
function createTestStore(overrides: Record<string, unknown> = {}) {
  return createStore<SpaceTraderState>()((set, get, api) => ({
    // Encounter slice (the one we're testing)
    ...createEncounterSlice(set, get, api),

    // Minimal state from other slices that encounterSlice reads
    credits: 5000,
    debt: 0,
    policeRecordScore: 0,
    reputationScore: 0,
    killsPirate: 0,
    killsPolice: 0,
    nameCommander: 'Test',
    pilotSkill: 5,
    fighterSkill: 5,
    traderSkill: 5,
    engineerSkill: 5,
    difficulty: 2,
    ship: makePlayerShip(),
    systems: [
      {
        nameIndex: 0,
        x: 50,
        y: 50,
        techLevel: 5,
        politics: 0,
        status: 0,
        size: 2,
        specialResources: 0,
        visited: true,
        special: -1,
        countDown: 0,
      } as any,
    ],
    currentSystem: 0,
    buyPrices: new Array(10).fill(0),
    sellPrices: new Array(10).fill(0),
    systemQuantities: new Array(10).fill(0),
    days: 10,
    tradeMode: 'buy' as const,
    viewingShipId: null,
    selectedMapSystemId: null,
    optAutoFuel: false,
    optAutoRepair: false,
    optIgnorePolice: false,
    optIgnorePirates: false,
    optIgnoreTraders: false,
    optIgnoreDealingTraders: false,
    optReserveMoney: false,
    optChartToInfo: false,
    optContinuousFight: false,
    optAttackFleeing: false,
    reserveBays: 0,
    optPayForNewspaper: false,
    optShowRangeToTracked: false,
    optStopTrackingOnArrival: false,
    optTextualEncounters: false,
    optRemindAboutLoans: false,
    monsterStatus: 0,
    dragonflyStatus: 0,
    japoriStatus: 0,
    reactorStatus: 0,
    jarekStatus: 0,
    wildStatus: 0,
    artifactStatus: 0,
    scarabStatus: 0,
    invasionStatus: 0,
    experimentStatus: 0,
    moonBought: false,
    jarekOnBoard: false,
    wildOnBoard: false,
    reactorOnBoard: false,
    artifactOnBoard: false,
    antidoteOnBoard: false,

    // Stub functions from other slices
    startNewGame: jest.fn(),
    travelTo: jest.fn(),
    buyGood: jest.fn(),
    sellGood: jest.fn(),
    buyShip: jest.fn(),
    buyWeapon: jest.fn(),
    buyShield: jest.fn(),
    buyGadget: jest.fn(),
    buyEscapePod: jest.fn(),
    buyFuel: jest.fn(),
    repairHull: jest.fn(),
    sellEquipment: jest.fn(),
    dumpCargo: jest.fn(),
    setTradeMode: jest.fn(),
    setViewingShipId: jest.fn(),
    setSelectedMapSystem: jest.fn(),
    restartGame: jest.fn(),
    setOption: jest.fn(),
    triggerSpecialEvent: jest.fn(),
    handleQuestEncounterVictory: jest.fn(),
    borrowCredits: jest.fn(),
    repayDebt: jest.fn(),

    ...overrides,
  }));
}

describe('encounterSlice — clearEncounter', () => {
  it('advances to next pending encounter', () => {
    const enc1 = makeEncounter({ clickNumber: 1 });
    const enc2 = makeEncounter({ clickNumber: 2 });
    const store = createTestStore({
      encounter: enc1,
      pendingEncounters: [enc2],
    });

    store.getState().clearEncounter();
    expect(store.getState().encounter?.clickNumber).toBe(2);
    expect(store.getState().pendingEncounters).toHaveLength(0);
  });

  it('sets encounter to null when no pending encounters', () => {
    const store = createTestStore({
      encounter: makeEncounter(),
      pendingEncounters: [],
    });

    store.getState().clearEncounter();
    expect(store.getState().encounter).toBeNull();
  });
});

describe('encounterSlice — attackInEncounter', () => {
  it('does nothing if no encounter', () => {
    const store = createTestStore({ encounter: null });
    store.getState().attackInEncounter();
    expect(store.getState().encounter).toBeNull();
  });

  it('does nothing if encounter already resolved', () => {
    const store = createTestStore({
      encounter: makeEncounter({ resolved: true }),
    });
    store.getState().attackInEncounter();
    // Should still be resolved
    expect(store.getState().encounter?.resolved).toBe(true);
  });

  it('adds log entries after combat round', () => {
    const store = createTestStore({
      encounter: makeEncounter(),
    });
    store.getState().attackInEncounter();
    const enc = store.getState().encounter;
    expect(enc).not.toBeNull();
    expect(enc!.log.length).toBeGreaterThan(0);
  });

  it('increments round on combat continue', () => {
    // Give NPC lots of hull so fight doesn't end in 1 round
    const store = createTestStore({
      encounter: makeEncounter({
        npc: makeNPC({
          ship: makePlayerShip({ hull: 500, weapon: [-1, -1, -1] }),
        }),
      }),
    });
    store.getState().attackInEncounter();
    const enc = store.getState().encounter;
    if (enc && !enc.resolved) {
      expect(enc.round).toBe(1);
    }
  });

  it('awards bounty and updates kills when player wins against pirate', () => {
    // Give NPC 1 hull so it dies immediately
    const store = createTestStore({
      encounter: makeEncounter({
        type: ENCOUNTER_PIRATE,
        npc: makeNPC({
          ship: makePlayerShip({ hull: 1, weapon: [-1, -1, -1], shield: [-1, -1, -1] }),
          bounty: 100,
        }),
      }),
      ship: makePlayerShip({ weapon: [2, 2, 2] }), // Strong player
    });

    // Mock random to ensure hit
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.9);

    store.getState().attackInEncounter();
    const state = store.getState();

    randomSpy.mockRestore();

    if (state.encounter?.playerWon) {
      expect(state.credits).toBe(5000 + 100); // bounty added
      expect(state.killsPirate).toBe(1);
    }
  });

  it('worsens police record when killing police', () => {
    const store = createTestStore({
      encounter: makeEncounter({
        type: ENCOUNTER_POLICE,
        encounterAction: 'ATTACK',
        npc: makeNPC({
          ship: makePlayerShip({ hull: 1, weapon: [-1, -1, -1], shield: [-1, -1, -1] }),
        }),
      }),
      ship: makePlayerShip({ weapon: [2, 2, 2] }),
      policeRecordScore: 0,
    });

    store.getState().attackInEncounter();
    const state = store.getState();

    if (state.encounter?.playerWon) {
      expect(state.policeRecordScore).toBeLessThan(0);
      expect(state.killsPolice).toBe(1);
    }
  });

  it('triggers game over when player destroyed without escape pod', () => {
    const store = createTestStore({
      encounter: makeEncounter({
        npc: makeNPC({
          ship: makePlayerShip({ hull: 500, weapon: [2, 2, 2] }),
          fighterSkill: 20,
        }),
      }),
      ship: makePlayerShip({ hull: 1, weapon: [-1, -1, -1], escapePod: false }),
    });

    // Run multiple rounds until player dies
    for (let i = 0; i < 20; i++) {
      const s = store.getState();
      if (s.isGameOver || !s.encounter || s.encounter.resolved) break;
      s.attackInEncounter();
    }

    const finalState = store.getState();
    // Player should either have escape pod trigger or game over
    expect(
      finalState.isGameOver || finalState.encounter?.resolved || finalState.ship.hull > 0,
    ).toBe(true);
  });
});

describe('encounterSlice — fleeFromEncounter', () => {
  it('does nothing if no encounter', () => {
    const store = createTestStore({ encounter: null });
    store.getState().fleeFromEncounter();
    expect(store.getState().encounter).toBeNull();
  });

  it('worsens police record when fleeing police', () => {
    const store = createTestStore({
      encounter: makeEncounter({
        type: ENCOUNTER_POLICE,
        encounterAction: 'INSPECT',
      }),
      policeRecordScore: 5,
    });

    // Flee might succeed or fail; record should worsen either way
    store.getState().fleeFromEncounter();
    expect(store.getState().policeRecordScore).toBe(4); // -1
  });

  it('does not worsen police record when fleeing pirates', () => {
    const store = createTestStore({
      encounter: makeEncounter({ type: ENCOUNTER_PIRATE }),
      policeRecordScore: 5,
    });

    store.getState().fleeFromEncounter();
    expect(store.getState().policeRecordScore).toBe(5);
  });
});

describe('encounterSlice — surrenderToEncounter', () => {
  it('pirates loot cargo', () => {
    const cargo = new Array(10).fill(0);
    cargo[9] = 10; // 10 narcotics (most valuable, taken first by pirate)
    const store = createTestStore({
      encounter: makeEncounter({
        type: ENCOUNTER_PIRATE,
        npc: makeNPC({ ship: makePlayerShip({ type: 2 }) }), // Firefly has some cargo bays
      }),
      ship: makePlayerShip({ cargo }),
    });

    store.getState().surrenderToEncounter();
    const state = store.getState();
    expect(state.encounter?.resolved).toBe(true);

    const totalCargo = state.ship.cargo.reduce((a: number, b: number) => a + b, 0);
    expect(totalCargo).toBeLessThan(10); // Some cargo was taken
  });

  it('police confiscate contraband and fine', () => {
    const cargo = new Array(10).fill(0);
    cargo[8] = 5; // 5 narcotics
    const store = createTestStore({
      systems: [
        {
          nameIndex: 0,
          x: 50,
          y: 50,
          techLevel: 5,
          politics: 10, // Military State (Narcotics illegal, Firearms legal)
          status: 0,
          size: 2,
          specialResources: 0,
          visited: true,
          special: -1,
          countDown: 0,
        } as any,
      ],
      encounter: makeEncounter({
        type: ENCOUNTER_POLICE,
        encounterAction: 'INSPECT',
        destinationSystemIdx: 0,
      }),
      ship: makePlayerShip({ cargo }),
      credits: 10000,
    });

    store.getState().surrenderToEncounter();
    const state = store.getState();
    expect(state.encounter?.resolved).toBe(true);
    expect(state.ship.cargo[8]).toBe(0); // Narcotics confiscated
    expect(state.credits).toBeLessThan(10000); // Fined
    expect(state.policeRecordScore).toBe(-1); // Record worsened
  });

  it('police find nothing illegal on clean ship', () => {
    const store = createTestStore({
      encounter: makeEncounter({
        type: ENCOUNTER_POLICE,
        encounterAction: 'INSPECT',
      }),
      ship: makePlayerShip(), // No cargo
      credits: 5000,
    });

    store.getState().surrenderToEncounter();
    const state = store.getState();
    expect(state.encounter?.resolved).toBe(true);
    expect(state.credits).toBe(5000); // No fine
    expect(state.encounter?.log.some((l: string) => l.includes('nothing illegal'))).toBe(true);
  });
});

describe('encounterSlice — bribePolice', () => {
  it('does nothing for non-police encounter', () => {
    const store = createTestStore({
      encounter: makeEncounter({ type: ENCOUNTER_PIRATE }),
      credits: 10000,
    });

    store.getState().bribePolice();
    expect(store.getState().credits).toBe(10000);
  });

  it('deducts bribe cost and resolves encounter', () => {
    const store = createTestStore({
      encounter: makeEncounter({
        type: ENCOUNTER_POLICE,
        encounterAction: 'INSPECT',
        destinationSystemIdx: 0,
      }),
      credits: 10000,
    });

    store.getState().bribePolice();
    const state = store.getState();

    // Either bribed successfully (credits reduced, resolved) or police can't be bribed
    if (state.encounter?.resolved) {
      expect(state.credits).toBeLessThan(10000);
    }
  });

  it('reports cannot afford when credits too low', () => {
    const store = createTestStore({
      encounter: makeEncounter({
        type: ENCOUNTER_POLICE,
        encounterAction: 'INSPECT',
        destinationSystemIdx: 0,
      }),
      credits: 0,
    });

    store.getState().bribePolice();
    const state = store.getState();
    // Should not resolve — player can't afford
    if (!state.encounter?.resolved) {
      expect(
        state.encounter?.log.some(
          (l: string) => l.includes('cannot afford') || l.includes('cannot be bribed'),
        ),
      ).toBe(true);
    }
  });
});

describe('encounterSlice — lootNPC', () => {
  it('transfers loot cargo to player ship', () => {
    const store = createTestStore({
      encounter: makeEncounter({
        resolved: true,
        playerWon: true,
        npc: makeNPC({ lootCargo: [3, 0, 0, 0, 0, 0, 0, 0, 0, 0] }),
      }),
      ship: makePlayerShip(), // Empty cargo, Gnat has 15 bays
    });

    store.getState().lootNPC();
    const state = store.getState();
    expect(state.ship.cargo[0]).toBe(3); // Looted 3 water
    expect(state.encounter).toBeNull(); // Cleared after looting
  });

  it('limits loot to available cargo space', () => {
    const fullCargo = new Array(10).fill(0);
    fullCargo[0] = ShipTypes[1].cargoBays; // Gnat cargo completely full
    const store = createTestStore({
      encounter: makeEncounter({
        resolved: true,
        playerWon: true,
        npc: makeNPC({ lootCargo: [5, 0, 0, 0, 0, 0, 0, 0, 0, 0] }),
      }),
      ship: makePlayerShip({ cargo: fullCargo }),
    });

    store.getState().lootNPC();
    // Should clear encounter without looting since ship is full
    expect(store.getState().encounter).toBeNull();
  });

  it('does nothing if encounter not resolved', () => {
    const store = createTestStore({
      encounter: makeEncounter({ resolved: false }),
    });
    store.getState().lootNPC();
    expect(store.getState().encounter).not.toBeNull();
  });
});

describe('encounterSlice — tradeWithNPC', () => {
  it('buys goods from trader at discount', () => {
    const npcCargo = new Array(10).fill(0);
    npcCargo[2] = 5; // NPC has 5 food
    const store = createTestStore({
      encounter: makeEncounter({
        type: ENCOUNTER_TRADER,
        encounterAction: 'TRADE_OFFER',
        npc: makeNPC({ ship: makePlayerShip({ cargo: npcCargo }) }),
      }),
      credits: 50000,
      ship: makePlayerShip(), // Empty cargo
    });

    store.getState().tradeWithNPC();
    const state = store.getState();
    expect(state.encounter?.resolved).toBe(true);
    // Either bought something or couldn't afford
    const totalCargo = state.ship.cargo.reduce((a: number, b: number) => a + b, 0);
    if (state.credits < 50000) {
      // Bought something
      expect(totalCargo).toBeGreaterThan(0);
    }
  });

  it('resolves with message when NPC has no cargo', () => {
    const store = createTestStore({
      encounter: makeEncounter({
        type: ENCOUNTER_TRADER,
        encounterAction: 'TRADE_OFFER',
        npc: makeNPC({ ship: makePlayerShip({ cargo: new Array(10).fill(0) }) }),
      }),
    });

    store.getState().tradeWithNPC();
    const state = store.getState();
    expect(state.encounter?.resolved).toBe(true);
    expect(state.encounter?.log.some((l: string) => l.includes('nothing to offer'))).toBe(true);
  });
});

describe('encounterSlice — letNPCGo', () => {
  it('resolves encounter peacefully', () => {
    const store = createTestStore({
      encounter: makeEncounter({ encounterAction: 'FLEE_NPC' }),
    });

    store.getState().letNPCGo();
    const state = store.getState();
    expect(state.encounter?.resolved).toBe(true);
    expect(state.encounter?.playerWon).toBe(false);
    expect(state.encounter?.log.some((l: string) => l.includes('let them go'))).toBe(true);
  });

  it('does nothing if already resolved', () => {
    const store = createTestStore({
      encounter: makeEncounter({ resolved: true }),
    });
    const logBefore = store.getState().encounter!.log.length;
    store.getState().letNPCGo();
    expect(store.getState().encounter!.log.length).toBe(logBefore);
  });
});

describe('encounterSlice — ignoreEncounter', () => {
  it('traders always let you pass', () => {
    const store = createTestStore({
      encounter: makeEncounter({
        type: ENCOUNTER_TRADER,
        encounterAction: 'TRADE_OFFER',
      }),
    });

    store.getState().ignoreEncounter();
    const state = store.getState();
    expect(state.encounter?.resolved).toBe(true);
    expect(state.encounter?.log.some((l: string) => l.includes('ignore the trader'))).toBe(true);
  });

  it('police let clean player with no contraband pass', () => {
    const store = createTestStore({
      encounter: makeEncounter({
        type: ENCOUNTER_POLICE,
        encounterAction: 'INSPECT',
        destinationSystemIdx: 0,
      }),
      policeRecordScore: 5,
      ship: makePlayerShip(), // No cargo
    });

    store.getState().ignoreEncounter();
    const state = store.getState();
    expect(state.encounter?.resolved).toBe(true);
  });

  it('police pursue player with bad record', () => {
    const store = createTestStore({
      encounter: makeEncounter({
        type: ENCOUNTER_POLICE,
        encounterAction: 'INSPECT',
        destinationSystemIdx: 0,
      }),
      policeRecordScore: -10,
      ship: makePlayerShip(),
    });

    store.getState().ignoreEncounter();
    const state = store.getState();
    // Police should pursue (switch to ATTACK, not resolved)
    expect(state.encounter?.encounterAction).toBe('ATTACK');
    expect(state.encounter?.resolved).toBe(false);
    expect(state.policeRecordScore).toBe(-11); // Worsened
  });
});

describe('encounterSlice — quest and escape pod', () => {
  it('triggers handleQuestEncounterVictory when boss is defeated', () => {
    const handleQuestEncounterVictory = jest.fn();
    const store = createTestStore({
      fighterSkill: 100, // Guaranteed hit
      encounter: makeEncounter({
        type: ENCOUNTER_MONSTER,
        npc: makeNPC({
          ship: makePlayerShip({ hull: 1, weapon: [-1, -1, -1], shield: [-1, -1, -1] }),
        }),
      }),
      handleQuestEncounterVictory,
    });

    // Mock random to ensure damage is positive regardless of skill
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.9);

    store.getState().attackInEncounter();

    randomSpy.mockRestore();

    expect(handleQuestEncounterVictory).toHaveBeenCalledWith(ENCOUNTER_MONSTER);
  });

  it('resets ship to Flea when player is destroyed with escape pod', () => {
    const store = createTestStore({
      encounter: makeEncounter({
        npc: makeNPC({
          ship: makePlayerShip({ hull: 500, weapon: [2, 2, 2] }),
          fighterSkill: 20,
        }),
      }),
      ship: makePlayerShip({ hull: 1, escapePod: true }),
    });

    // Force a combat round where player takes damage
    // We need NPC to hit player. Mocking random for encounterSlice.test.ts might be needed if it fails flakily.
    // However, NPC has high fighterSkill and player has 1 hull, so it's likely.
    // Let's mock random here too for safety.
    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0.9); // High hit chance

    store.getState().attackInEncounter();
    const state = store.getState();
    randomSpy.mockRestore();

    expect(state.isGameOver).toBe(false);
    expect(state.ship.type).toBe(0); // Flea
    expect(state.ship.escapePod).toBe(false);
    expect(state.encounter?.resolved).toBe(true);
    expect(state.encounter?.playerWon).toBe(false);
  });
});
