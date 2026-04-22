import { getAiDecision, findBestTrade } from './strategy';
import { SpaceTraderState } from '../store/types';
import { ShipTypes, TradeItems, ActiveEncounter } from '../DataTypes';

// ── Minimal state factory ─────────────────────────────────────────────────────

function makeSystem(overrides: Record<string, unknown> = {}) {
  return {
    nameIndex: 0,
    x: 0,
    y: 0,
    techLevel: 5,
    politics: 0, // Anarchy — drugsOk=true, firearmsOk=true
    status: 0,
    size: 2,
    specialResources: 0,
    visited: true,
    special: -1,
    countDown: 0,
    qty: new Array(10).fill(10),
    ...overrides,
  } as any;
}

function makeState(overrides: Partial<SpaceTraderState> = {}): SpaceTraderState {
  // Two systems: current (tech 5, [0,0]) and neighbor (tech 7, [10,0])
  const systems = [
    makeSystem({ x: 0, y: 0, techLevel: 5 }),
    makeSystem({ x: 10, y: 0, techLevel: 7 }),
  ];

  const base: Partial<SpaceTraderState> = {
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
    ship: {
      type: 1, // Gnat: 15 cargo, fuel=14
      cargo: new Array(10).fill(0),
      weapon: [0, -1, -1],
      shield: [-1, -1, -1],
      shieldStrength: [-1, -1, -1],
      gadget: [-1, -1, -1],
      escapePod: false,
      fuel: 14,
      hull: 100,
    },
    systems,
    currentSystem: 0,
    buyPrices: new Array(10).fill(0),
    sellPrices: new Array(10).fill(0),
    systemQuantities: new Array(10).fill(10),
    days: 10,
    encounter: null,
    isGameOver: false,
    pendingEncounters: [],
    tradeMode: 'buy' as const,
    activeView: 'trade' as any,
    viewingShipId: null,
    selectedMapSystemId: null,
    isAiEnabled: true,
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
    moonDestIndex: -1,
  };

  return { ...base, ...overrides } as SpaceTraderState;
}

function makeEncounter(overrides: Partial<ActiveEncounter> = {}): ActiveEncounter {
  return {
    type: 'PIRATE',
    npc: {
      ship: {
        type: 1,
        cargo: new Array(10).fill(0),
        weapon: [0, -1, -1],
        shield: [-1, -1, -1],
        shieldStrength: [-1, -1, -1],
        gadget: [-1, -1, -1],
        escapePod: false,
        fuel: 14,
        hull: 50,
      },
      fighterSkill: 4,
      pilotSkill: 4,
      engineerSkill: 4,
      bounty: 50,
      lootCargo: new Array(10).fill(0),
    },
    log: [],
    round: 0,
    resolved: false,
    playerWon: false,
    clickNumber: 1,
    destinationSystemIdx: 0,
    encounterAction: 'ATTACK',
    ...overrides,
  };
}

// ── Tests: encounter handling ─────────────────────────────────────────────────

describe('getAiDecision — encounters', () => {
  it('loot pirate after winning combat', () => {
    const state = makeState({
      encounter: makeEncounter({ resolved: true, playerWon: true, type: 'PIRATE' }),
    });
    const decision = getAiDecision(state);
    expect(decision).toEqual({ type: 'ENCOUNTER_ACTION', action: 'LOOT' });
  });

  it('clears encounter after non-pirate resolution', () => {
    const state = makeState({
      encounter: makeEncounter({ resolved: true, playerWon: false, type: 'POLICE' }),
    });
    const decision = getAiDecision(state);
    expect(decision).toEqual({ type: 'ENCOUNTER_ACTION', action: 'DONE' });
  });

  it('clears encounter after pirate defeat (no loot if lost)', () => {
    const state = makeState({
      encounter: makeEncounter({ resolved: true, playerWon: false, type: 'PIRATE' }),
    });
    const decision = getAiDecision(state);
    expect(decision).toEqual({ type: 'ENCOUNTER_ACTION', action: 'DONE' });
  });

  it('attacks fleeing pirate', () => {
    const state = makeState({
      encounter: makeEncounter({ encounterAction: 'FLEE_NPC', type: 'PIRATE' }),
    });
    const decision = getAiDecision(state);
    expect(decision).toEqual({ type: 'ENCOUNTER_ACTION', action: 'ATTACK' });
  });

  it('lets fleeing police go', () => {
    const state = makeState({
      encounter: makeEncounter({ encounterAction: 'FLEE_NPC', type: 'POLICE' }),
    });
    const decision = getAiDecision(state);
    expect(decision).toEqual({ type: 'ENCOUNTER_ACTION', action: 'LET_GO' });
  });

  it('lets fleeing trader go', () => {
    const state = makeState({
      encounter: makeEncounter({ encounterAction: 'FLEE_NPC', type: 'TRADER' }),
    });
    const decision = getAiDecision(state);
    expect(decision).toEqual({ type: 'ENCOUNTER_ACTION', action: 'LET_GO' });
  });

  it('passes NPC that is ignoring player', () => {
    const state = makeState({
      encounter: makeEncounter({ encounterAction: 'IGNORE' }),
    });
    const decision = getAiDecision(state);
    expect(decision).toEqual({ type: 'ENCOUNTER_ACTION', action: 'LET_GO' });
  });

  it('ignores trader trade offer', () => {
    const state = makeState({
      encounter: makeEncounter({ encounterAction: 'TRADE_OFFER', type: 'TRADER' }),
    });
    const decision = getAiDecision(state);
    expect(decision).toEqual({ type: 'ENCOUNTER_ACTION', action: 'IGNORE' });
  });

  it('surrenders to police inspection when cargo is clean', () => {
    const state = makeState({
      encounter: makeEncounter({ encounterAction: 'INSPECT', type: 'POLICE' }),
    });
    const decision = getAiDecision(state);
    expect(decision).toEqual({ type: 'ENCOUNTER_ACTION', action: 'SURRENDER' });
  });

  it('flees police inspection when carrying narcotics', () => {
    const cargo = new Array(10).fill(0);
    cargo[8] = 5; // narcotics
    const state = makeState({
      ship: {
        type: 1,
        cargo,
        weapon: [0, -1, -1],
        shield: [-1, -1, -1],
        shieldStrength: [-1, -1, -1],
        gadget: [-1, -1, -1],
        escapePod: false,
        fuel: 14,
        hull: 100,
      },
      encounter: makeEncounter({ encounterAction: 'INSPECT', type: 'POLICE' }),
    });
    const decision = getAiDecision(state);
    expect(decision).toEqual({ type: 'ENCOUNTER_ACTION', action: 'FLEE' });
  });

  it('flees from attacking police', () => {
    const state = makeState({
      encounter: makeEncounter({ encounterAction: 'ATTACK', type: 'POLICE' }),
    });
    const decision = getAiDecision(state);
    expect(decision).toEqual({ type: 'ENCOUNTER_ACTION', action: 'FLEE' });
  });

  it('attacks weaker pirate', () => {
    const state = makeState({
      ship: {
        type: 6, // Hornet — 3 weapon slots, strong ship
        cargo: new Array(10).fill(0),
        weapon: [2, 2, 2], // 3x military laser
        shield: [1, 1, -1],
        shieldStrength: [200, 200, -1],
        gadget: [-1, -1, -1],
        escapePod: true,
        fuel: 14,
        hull: 150,
      },
      fighterSkill: 8,
      encounter: makeEncounter({
        encounterAction: 'ATTACK',
        type: 'PIRATE',
        npc: {
          ship: {
            type: 0, // Flea — weakest ship
            cargo: new Array(10).fill(0),
            weapon: [0, -1, -1],
            shield: [-1, -1, -1],
            shieldStrength: [-1, -1, -1],
            gadget: [-1, -1, -1],
            escapePod: false,
            fuel: 20,
            hull: 25,
          },
          fighterSkill: 2,
          pilotSkill: 2,
          engineerSkill: 2,
          bounty: 50,
          lootCargo: new Array(10).fill(0),
        } as any,
      }),
    });
    const decision = getAiDecision(state);
    expect(decision).toEqual({ type: 'ENCOUNTER_ACTION', action: 'ATTACK' });
  });
});

// ── Tests: maintenance ────────────────────────────────────────────────────────

describe('getAiDecision — maintenance', () => {
  it('buys fuel when below 60% tank', () => {
    const state = makeState({ ship: { ...makeState().ship, fuel: 5, hull: 100 } });
    const decision = getAiDecision(state);
    expect(decision.type).toBe('FUEL');
  });

  it('does not buy fuel when tank is full', () => {
    const state = makeState({ ship: { ...makeState().ship, fuel: 14, hull: 100 } });
    // With no trades available (all buy prices 0), might idle or warp
    const decision = getAiDecision(state);
    expect(decision.type).not.toBe('FUEL');
  });

  it('repairs hull below 75%', () => {
    const state = makeState({
      credits: 50000,
      ship: { ...makeState().ship, fuel: 14, hull: 60 },
    });
    const decision = getAiDecision(state);
    expect(decision.type).toBe('REPAIR');
  });
});

// ── Tests: win condition ──────────────────────────────────────────────────────

describe('getAiDecision — win condition', () => {
  it('triggers special event at Utopia (system 109) when rich enough', () => {
    // Build 110-element systems array with Utopia at index 109
    const systems = Array.from({ length: 110 }, (_, i) =>
      makeSystem({ x: i * 100, y: 0, techLevel: 5 }),
    );
    systems[109] = makeSystem({ x: 0, y: 0, techLevel: 7, special: 5 }); // co-located with player
    const state = makeState({
      credits: 600000,
      currentSystem: 109, // We're AT Utopia
      systems,
      ship: {
        type: 1,
        cargo: new Array(10).fill(0),
        weapon: [0, -1, -1],
        shield: [0, -1, -1],
        shieldStrength: [100, -1, -1],
        gadget: [-1, -1, -1],
        escapePod: true,
        fuel: 14,
        hull: 100,
      },
    });
    const decision = getAiDecision(state);
    expect(decision).toEqual({ type: 'SPECIAL_EVENT' });
  });

  it('warps toward Utopia when rich enough but not there yet', () => {
    // Utopia = system index 109. Place it 10 parsecs away (in fuel range)
    const systems = Array.from(
      { length: 110 },
      (_, i) => makeSystem({ x: i * 500, y: 0, techLevel: 5 }), // far apart so only Utopia at 10 is reachable
    );
    systems[109] = makeSystem({ x: 10, y: 0, techLevel: 7 }); // close to player at system 0
    const state = makeState({
      credits: 600000,
      currentSystem: 0,
      systems,
      ship: {
        type: 1,
        cargo: new Array(10).fill(0),
        weapon: [0, -1, -1],
        shield: [0, -1, -1],
        shieldStrength: [100, -1, -1],
        gadget: [-1, -1, -1],
        escapePod: true,
        fuel: 14,
        hull: 100,
      },
    });
    const decision = getAiDecision(state);
    expect(decision.type).toBe('WARP');
    if (decision.type === 'WARP') {
      expect(decision.systemId).toBe(109);
    }
  });
});

// ── Tests: findBestTrade ──────────────────────────────────────────────────────

describe('findBestTrade', () => {
  it('returns null when no systems', () => {
    const state = makeState({ systems: [] });
    expect(findBestTrade(state)).toBeNull();
  });

  it('finds a profitable trade to higher-tech system', () => {
    // Water (id=0): priceLowTech=30, priceInc=3
    // At tech 5: estSell = 30 + 5*3 = 45
    // Buy price at current (tech 5) is set to 25 → profit = 20
    const state = makeState({
      buyPrices: [25, 0, 0, 0, 0, 0, 0, 0, 0, 0], // water available for 25
      systemQuantities: [10, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    });
    const trade = findBestTrade(state);
    expect(trade).not.toBeNull();
    expect(trade!.goodId).toBe(0); // Water
    expect(trade!.profit).toBeGreaterThan(0);
  });

  it('skips goods illegal at target', () => {
    // Politics index 5 = Theocracy: drugsOk=false, firearmsOk=false
    const systems = [
      makeSystem({ x: 0, y: 0, techLevel: 3, politics: 0 }), // source: allows everything
      makeSystem({ x: 5, y: 0, techLevel: 7, politics: 5 }), // dest: Theocracy, no drugs/firearms
    ];
    const state = makeState({
      systems,
      buyPrices: [0, 0, 0, 0, 0, 1250, 0, 0, 3500, 0], // firearms(5) and narcotics(8) available
      systemQuantities: [0, 0, 0, 0, 0, 5, 0, 0, 5, 0],
    });
    const trade = findBestTrade(state);
    // Should not route narcotics or firearms to a Theocracy (politics 5 bans both)
    if (trade) {
      expect(trade.goodId).not.toBe(5);
      expect(trade.goodId).not.toBe(8);
    }
  });

  it('prefers narcotics with 2x score bias when profitable', () => {
    // Narcotics (id 8): priceLowTech=3500, priceInc=-125 (cheaper at higher tech, expensive at low tech)
    // Strategy: buy at HIGH-tech source (cheap), sell at LOW-tech destination (expensive)
    // Source system: tech 7, narcotics buyPrice ≈ 3500+7*(-125) = 2625
    // Destination system: tech 0, narcotics estSell ≈ 3500+0*(-125) = 3500. Profit = 875 * 2.0 bias
    // Water: buyPrice 25, estSell at tech 0 = 30 + 0*3 = 30. Profit = 5, no bias
    // Narcotics should clearly win
    const systems = [
      makeSystem({ x: 0, y: 0, techLevel: 7, politics: 0 }), // high-tech source
      makeSystem({ x: 10, y: 0, techLevel: 0, politics: 0 }), // primitive destination (drugs ok in anarchy)
    ];
    const state = makeState({
      systems,
      buyPrices: [25, 0, 0, 0, 0, 0, 0, 0, 2625, 0], // cheap narcotics at high-tech source
      systemQuantities: [10, 0, 0, 0, 0, 0, 0, 0, 10, 0],
    });
    const trade = findBestTrade(state);
    expect(trade).not.toBeNull();
    expect(trade!.goodId).toBe(8); // Narcotics win
  });

  it('returns direct hop when target is in fuel range', () => {
    const state = makeState({
      buyPrices: [25, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      systemQuantities: [10, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ship: { ...makeState().ship, fuel: 14 },
      // systems[1] is at x=10, dist=10 which is <= 14
    });
    const trade = findBestTrade(state);
    expect(trade).not.toBeNull();
    // Direct hop: nextHopId === targetSystemId when in range
    expect(trade!.nextHopId).toBe(trade!.targetSystemId);
  });

  it('finds intermediate hop when target is out of fuel range', () => {
    // 3 systems: start at 0, intermediate at x=10, far target at x=30
    // Make the far target WAR status to boost ore price by 1.5x so it beats the closer hop
    // Ore (id 3): priceLowTech=350, priceInc=20, doublePriceStatus=WAR(3)
    // Source buyPrice = 100 (cheap ore at source)
    // System 1 (tech 5, no war): estSell = 350+5*20 = 450, profit = 350, score = 350*10/(10+20) = 117
    // System 2 (tech 7, WAR): estSell = (350+7*20)*1.5 = 490*1.5 = 735, profit = 635, score = 635*10/(30+20) = 127 > 117
    const systems = [
      makeSystem({ x: 0, y: 0, techLevel: 7, politics: 0, status: 0 }), // source
      makeSystem({ x: 10, y: 0, techLevel: 5, politics: 0, status: 0 }), // reachable hop, mediocre
      makeSystem({ x: 30, y: 0, techLevel: 7, politics: 0, status: 1 }), // far target, WAR(1) = ore 1.5x
    ];
    const oreIdx = 3;
    const buyPrices = new Array(10).fill(0);
    buyPrices[oreIdx] = 100;
    const systemQuantities = new Array(10).fill(0);
    systemQuantities[oreIdx] = 10;
    const state = makeState({
      systems,
      ship: { ...makeState().ship, fuel: 14 },
      buyPrices,
      systemQuantities,
    });
    const trade = findBestTrade(state);
    expect(trade).not.toBeNull();
    expect(trade!.targetSystemId).toBe(2); // far system is the goal
    expect(trade!.nextHopId).toBe(1); // intermediate hop toward it
  });
});

// ── Tests: trading decisions ──────────────────────────────────────────────────

describe('getAiDecision — trading', () => {
  it('buys goods when profitable trade found at current system', () => {
    const state = makeState({
      credits: 10000,
      buyPrices: [25, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      systemQuantities: [10, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      ship: { ...makeState().ship, fuel: 14, hull: 100 },
    });
    const decision = getAiDecision(state);
    expect(decision.type).toBe('BUY');
    if (decision.type === 'BUY') {
      expect(decision.goodId).toBe(0);
      expect(decision.amount).toBeGreaterThan(0);
    }
  });

  it('sells cargo at destination with good sell price', () => {
    const cargo = new Array(10).fill(0);
    cargo[0] = 5; // 5 units of water
    const state = makeState({
      credits: 5000,
      ship: { ...makeState().ship, cargo, fuel: 14, hull: 100 },
      sellPrices: [60, 0, 0, 0, 0, 0, 0, 0, 0, 0], // water at 60 > priceLowTech(30)*1.1=33
    });
    const decision = getAiDecision(state);
    expect(decision.type).toBe('SELL');
    if (decision.type === 'SELL') {
      expect(decision.goodId).toBe(0);
      expect(decision.amount).toBe(5);
    }
  });

  it('does not sell cargo when sell price is below threshold', () => {
    const cargo = new Array(10).fill(0);
    cargo[0] = 5; // water
    const state = makeState({
      credits: 5000,
      ship: { ...makeState().ship, cargo, fuel: 14, hull: 100 },
      sellPrices: [31, 0, 0, 0, 0, 0, 0, 0, 0, 0], // water at 31 ≤ priceLowTech(30)*1.1=33
    });
    const decision = getAiDecision(state);
    // Should not sell at this poor price — will warp toward better market
    expect(decision.type).not.toBe('SELL');
  });

  it('warps when cargo is full and no buyable goods here', () => {
    const cargo = new Array(10).fill(0);
    cargo[0] = 15; // Gnat holds 15 cargo (full)
    const state = makeState({
      credits: 5000,
      ship: { ...makeState().ship, cargo, fuel: 14, hull: 100 },
      buyPrices: new Array(10).fill(0), // nothing to buy
      sellPrices: new Array(10).fill(0), // nothing sells here
    });
    const decision = getAiDecision(state);
    // With sellPrices all 0, can't sell. With cargo full, should warp toward better system
    expect(['WARP', 'IDLE']).toContain(decision.type);
  });
});

// ── Tests: equipment ─────────────────────────────────────────────────────────

describe('getAiDecision — equipment', () => {
  it('buys escape pod when missing and at tech 5+ system', () => {
    const state = makeState({
      credits: 100000,
      ship: {
        ...makeState().ship,
        escapePod: false,
        weapon: [0, -1, -1], // already has weapon
        shield: [0, -1, -1], // already has shield
        fuel: 14,
        hull: 100,
      },
    });
    const decision = getAiDecision(state);
    expect(decision.type).toBe('BUY_ESCAPE_POD');
  });

  it('buys weapon when ship has empty weapon slot and has no weapons', () => {
    const state = makeState({
      credits: 50000,
      ship: {
        type: 1, // Gnat: 1 weapon slot
        cargo: new Array(10).fill(0),
        weapon: [-1, -1, -1], // no weapons
        shield: [0, -1, -1],
        shieldStrength: [100, -1, -1],
        gadget: [-1, -1, -1],
        escapePod: true, // pod already owned
        fuel: 14,
        hull: 100,
      },
    });
    const decision = getAiDecision(state);
    expect(decision.type).toBe('BUY_WEAPON');
  });
});

// ── Tests: ship upgrades ──────────────────────────────────────────────────────

describe('getAiDecision — ship upgrades', () => {
  it('upgrades Gnat to Bumblebee when credit threshold met', () => {
    const state = makeState({
      credits: 100000, // > 75000 + UPGRADE_BUFFER(15000) = 90000
      ship: {
        type: 1, // Gnat
        cargo: new Array(10).fill(0),
        weapon: [0, -1, -1],
        shield: [0, -1, -1],
        shieldStrength: [100, -1, -1],
        gadget: [-1, -1, -1],
        escapePod: true,
        fuel: 14,
        hull: 100,
      },
    });
    const decision = getAiDecision(state);
    expect(decision).toEqual({ type: 'BUY_SHIP', shipTypeId: 4 }); // Bumblebee
  });

  it('does not upgrade when credits are insufficient', () => {
    const state = makeState({
      credits: 50000, // < 90000 threshold
      ship: {
        type: 1,
        cargo: new Array(10).fill(0),
        weapon: [0, -1, -1],
        shield: [0, -1, -1],
        shieldStrength: [100, -1, -1],
        gadget: [-1, -1, -1],
        escapePod: true,
        fuel: 14,
        hull: 100,
      },
    });
    const decision = getAiDecision(state);
    expect(decision.type).not.toBe('BUY_SHIP');
  });
});
