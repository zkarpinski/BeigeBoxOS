import { processWarp, QuestState } from '../domain/travel';
import { SolarSystem, PlayerShip } from '../DataTypes';
import { ENCOUNTER_MONSTER, ENCOUNTER_DRAGONFLY, ENCOUNTER_SCARAB } from '../Encounter';
import { ACAMARSYSTEM, ZALKONSYSTEM, ALIENINVASION, EXPERIMENT } from '../SpecialEvents';
import { generateGalaxy } from '../SystemGenerator';

function makeShip(): PlayerShip {
  return {
    type: 3,
    cargo: new Array(10).fill(0),
    weapon: [2, -1, -1],
    shield: [0, -1, -1],
    shieldStrength: [25, -1, -1],
    gadget: [-1, -1, -1],
    escapePod: false,
    fuel: 30,
    hull: 100,
  };
}

function makeBaseState(systems: SolarSystem[]) {
  return {
    currentSystem: 0,
    systems,
    ship: makeShip(),
    traderSkill: 5,
    policeRecordScore: 0,
    difficulty: 2,
    days: 10,
    debt: 0,
  };
}

describe('processWarp quest encounters', () => {
  it('injects Monster encounter when traveling to Acamar with monsterStatus=1', () => {
    const { systems } = generateGalaxy();
    const state = makeBaseState(systems);
    // Ensure we can reach Acamar — set fuel high and start nearby
    state.ship.fuel = 200;
    const qs: QuestState = {
      monsterStatus: 1,
      dragonflyStatus: 0,
      scarabStatus: 0,
      reactorOnBoard: false,
    };

    const result = processWarp(ACAMARSYSTEM, { ...state, questState: qs });
    const monsterEnc = result.encounters.find((e) => e.type === ENCOUNTER_MONSTER);
    expect(monsterEnc).toBeDefined();
    expect(monsterEnc!.npc.ship.hull).toBe(150);
  });

  it('does NOT inject Monster encounter if monsterStatus is 0', () => {
    const { systems } = generateGalaxy();
    const state = makeBaseState(systems);
    state.ship.fuel = 200;
    const qs: QuestState = {
      monsterStatus: 0,
      dragonflyStatus: 0,
      scarabStatus: 0,
      reactorOnBoard: false,
    };

    const result = processWarp(ACAMARSYSTEM, { ...state, questState: qs });
    const monsterEnc = result.encounters.find((e) => e.type === ENCOUNTER_MONSTER);
    expect(monsterEnc).toBeUndefined();
  });

  it('injects Dragonfly encounter when traveling to Zalkon with dragonflyStatus=4', () => {
    const { systems } = generateGalaxy();
    const state = makeBaseState(systems);
    state.ship.fuel = 200;
    const qs: QuestState = {
      monsterStatus: 0,
      dragonflyStatus: 4,
      scarabStatus: 0,
      reactorOnBoard: false,
    };

    const result = processWarp(ZALKONSYSTEM, { ...state, questState: qs });
    const dfEnc = result.encounters.find((e) => e.type === ENCOUNTER_DRAGONFLY);
    expect(dfEnc).toBeDefined();
    expect(dfEnc!.npc.ship.hull).toBe(100);
  });

  it('injects Scarab encounter at wormhole systems when scarabStatus=1', () => {
    const { systems } = generateGalaxy();
    // Find a system with a wormhole
    const whIdx = systems.findIndex((s) => s.wormholeDest !== undefined && s.wormholeDest >= 0);
    if (whIdx < 0) return; // skip if no wormholes (unlikely)

    const state = makeBaseState(systems);
    state.ship.fuel = 200;
    const qs: QuestState = {
      monsterStatus: 0,
      dragonflyStatus: 0,
      scarabStatus: 1,
      reactorOnBoard: false,
    };

    const result = processWarp(whIdx, { ...state, questState: qs });
    const scarabEnc = result.encounters.find((e) => e.type === ENCOUNTER_SCARAB);
    expect(scarabEnc).toBeDefined();
    expect(scarabEnc!.npc.ship.hull).toBe(200);
  });
});

describe('processWarp reactor radiation leak', () => {
  it('can cause hull damage when reactor is on board', () => {
    const { systems } = generateGalaxy();
    const state = makeBaseState(systems);
    state.ship.fuel = 200;
    state.ship.hull = 50;

    // Run many warps to statistically trigger the 20% radiation leak
    let tookDamage = false;
    for (let i = 0; i < 50; i++) {
      const qs: QuestState = {
        monsterStatus: 0,
        dragonflyStatus: 0,
        scarabStatus: 0,
        reactorOnBoard: true,
      };
      const result = processWarp(1, {
        ...state,
        questState: qs,
      });
      if (result.ship.hull < 50) {
        tookDamage = true;
        break;
      }
    }
    expect(tookDamage).toBe(true);
  });

  it('never kills the player outright (hull >= 1)', () => {
    const { systems } = generateGalaxy();
    const state = makeBaseState(systems);
    state.ship.fuel = 200;
    state.ship.hull = 1; // Minimum hull

    const qs: QuestState = {
      monsterStatus: 0,
      dragonflyStatus: 0,
      scarabStatus: 0,
      reactorOnBoard: true,
    };
    for (let i = 0; i < 50; i++) {
      const result = processWarp(1, { ...state, questState: qs });
      expect(result.ship.hull).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('processWarp countdown decrement', () => {
  it('decrements countDown on systems each warp', () => {
    const { systems } = generateGalaxy();
    // Find a system with a countdown
    const invasionIdx = systems.findIndex((s) => s.special === ALIENINVASION);
    if (invasionIdx < 0) return;

    const originalCountDown = systems[invasionIdx].countDown;
    expect(originalCountDown).toBeGreaterThan(0);

    const state = makeBaseState(systems);
    state.ship.fuel = 200;

    const result = processWarp(1, state);
    expect(result.systems[invasionIdx].countDown).toBe(originalCountDown - 1);
  });

  it('clears special when countdown reaches 0', () => {
    const { systems } = generateGalaxy();
    const invasionIdx = systems.findIndex((s) => s.special === ALIENINVASION);
    if (invasionIdx < 0) return;

    // Set countdown to 1 so next warp expires it
    systems[invasionIdx] = { ...systems[invasionIdx], countDown: 1 };

    const state = makeBaseState(systems);
    state.ship.fuel = 200;

    const result = processWarp(1, state);
    expect(result.systems[invasionIdx].countDown).toBe(0);
    expect(result.systems[invasionIdx].special).toBe(-1);
  });
});
