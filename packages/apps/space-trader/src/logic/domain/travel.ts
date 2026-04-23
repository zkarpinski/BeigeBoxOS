import {
  SolarSystem,
  PlayerShip,
  ShipTypes,
  Shields,
  UNEVENTFUL,
  ActiveEncounter,
} from '../DataTypes';
import { determineSystemPrices } from '../Merchant';
import {
  determineEncounter,
  generateNPCEncounter,
  generateQuestEncounter,
  determineEncounterAction,
  ENCOUNTER_NONE,
  ENCOUNTER_PIRATE,
  ENCOUNTER_MONSTER,
  ENCOUNTER_DRAGONFLY,
  ENCOUNTER_SCARAB,
} from '../Encounter';
import {
  ACAMARSYSTEM,
  ZALKONSYSTEM,
  GEMULONSYSTEM,
  DALEDSYSTEM,
  ALIENINVASION,
  GEMULONINVADED,
  EXPERIMENT,
  EXPERIMENTFAILED,
} from '../SpecialEvents';

export interface QuestState {
  monsterStatus: number;
  dragonflyStatus: number;
  scarabStatus: number;
  reactorOnBoard: boolean;
}

export interface TravelResult {
  currentSystem: number;
  days: number;
  debt: number;
  policeRecordScore: number;
  ship: PlayerShip;
  buyPrices: number[];
  sellPrices: number[];
  systemQuantities: number[];
  systems: SolarSystem[];
  encounters: ActiveEncounter[];
}

export function calculateDistance(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
}

export function processWarp(
  targetSystemId: number,
  state: {
    currentSystem: number;
    systems: SolarSystem[];
    ship: PlayerShip;
    traderSkill: number;
    policeRecordScore: number;
    difficulty: number;
    days: number;
    debt: number;
    questState?: QuestState;
  },
): TravelResult {
  const current = state.systems[state.currentSystem];
  const target = state.systems[targetSystemId];

  const dist = calculateDistance(current, target);
  const fuelCost = Math.floor(dist);

  // Prices and quantities for the target system
  const { buyPrices, sellPrices } = determineSystemPrices(
    target,
    state.traderSkill,
    state.policeRecordScore,
  );
  const systemQuantities = target.qty ?? new Array(10).fill(0);

  // Encounter logic
  const CLICKS = Math.max(1, fuelCost);
  const encounters: ActiveEncounter[] = [];
  let alreadyRaided = false;
  for (let click = 1; click <= CLICKS; click++) {
    const encounterType = determineEncounter(
      target,
      state.difficulty,
      state.policeRecordScore,
      state.ship.type,
      alreadyRaided,
    );
    if (encounterType !== ENCOUNTER_NONE) {
      const npc = generateNPCEncounter(
        encounterType,
        state.difficulty,
        state.policeRecordScore,
        state.days,
        target.techLevel,
      );
      const action = determineEncounterAction(
        encounterType,
        state.policeRecordScore,
        state.ship,
        npc.ship,
      );
      encounters.push({
        type: encounterType,
        npc,
        log: [],
        round: 0,
        resolved: false,
        playerWon: false,
        clickNumber: CLICKS - click + 1,
        destinationSystemIdx: targetSystemId,
        encounterAction: action,
      });
      if (encounterType === ENCOUNTER_PIRATE) alreadyRaided = true;
    }
  }

  // Quest encounters — inject boss fights when traveling to relevant systems
  if (state.questState) {
    const qs = state.questState;

    // Space Monster: traveling to Acamar while quest is active
    if (targetSystemId === ACAMARSYSTEM && qs.monsterStatus === 1) {
      encounters.push({
        type: ENCOUNTER_MONSTER,
        npc: generateQuestEncounter(ENCOUNTER_MONSTER),
        log: ['A massive space monster blocks your path!'],
        round: 0,
        resolved: false,
        playerWon: false,
        clickNumber: 1,
        destinationSystemIdx: targetSystemId,
        encounterAction: 'ATTACK',
      });
    }

    // Dragonfly: traveling to Zalkon after tracking through chain
    if (targetSystemId === ZALKONSYSTEM && qs.dragonflyStatus === 4) {
      encounters.push({
        type: ENCOUNTER_DRAGONFLY,
        npc: generateQuestEncounter(ENCOUNTER_DRAGONFLY),
        log: ['The Dragonfly attacks!'],
        round: 0,
        resolved: false,
        playerWon: false,
        clickNumber: 1,
        destinationSystemIdx: targetSystemId,
        encounterAction: 'ATTACK',
      });
    }

    // Scarab: traveling to wormhole systems when scarab quest is active
    if (qs.scarabStatus === 1) {
      // Scarab appears near wormhole systems — check if target has a wormhole
      const targetSys = state.systems[targetSystemId];
      if (targetSys.wormholeDest !== undefined && targetSys.wormholeDest >= 0) {
        encounters.push({
          type: ENCOUNTER_SCARAB,
          npc: generateQuestEncounter(ENCOUNTER_SCARAB),
          log: ['The stolen Scarab ship engages you!'],
          round: 0,
          resolved: false,
          playerWon: false,
          clickNumber: 1,
          destinationSystemIdx: targetSystemId,
          encounterAction: 'ATTACK',
        });
      }
    }
  }

  // Reactor radiation leak: random hull damage
  const newShip = { ...state.ship };
  if (state.questState?.reactorOnBoard && Math.random() < 0.2) {
    const leak = Math.floor(Math.random() * 3) + 1;
    newShip.hull = Math.max(1, newShip.hull - leak);
  }

  // Reset shield strength (matches original DoWarp)
  const newShieldStrength = newShip.shield.map((s) => (s >= 0 ? Shields[s].power : -1));

  // Time and score decay
  const newDays = state.days + 1;
  let newPoliceScore = state.policeRecordScore;
  if (newDays % 3 === 0) {
    if (newPoliceScore > 0) newPoliceScore--;
  }
  if (newPoliceScore < -5 && state.difficulty <= 2) {
    newPoliceScore++;
  }

  // Debt interest
  const newDebt = state.debt > 0 ? Math.ceil(state.debt * 1.1) : 0;

  // System updates (visited status, random status changes, countdowns)
  const newSystems = state.systems.map((s, idx) => {
    let updated = s;

    if (idx === targetSystemId) {
      updated = { ...updated, visited: true };
    }

    // Countdown decrement for time-sensitive quests
    if (updated.countDown > 0) {
      const newCountDown = updated.countDown - 1;
      if (newCountDown === 0) {
        // Time expired — quest failed
        if (updated.special === ALIENINVASION) {
          // Gemulon invasion failed — devastate Gemulon
          updated = { ...updated, countDown: 0, special: -1 };
          // We'll mark GEMULONINVADED on Gemulon in the universe slice
        } else if (updated.special === EXPERIMENT) {
          // Experiment failed
          updated = { ...updated, countDown: 0, special: -1 };
        }
      } else {
        updated = { ...updated, countDown: newCountDown };
      }
    }

    // 10% chance for any system to clear status
    if (updated.status !== UNEVENTFUL && Math.random() < 0.1) {
      updated = { ...updated, status: UNEVENTFUL };
    }
    // 5% chance for a random system to get a new status
    if (updated.status === UNEVENTFUL && Math.random() < 0.05) {
      updated = { ...updated, status: Math.floor(Math.random() * 8) };
    }

    return updated;
  });

  return {
    currentSystem: targetSystemId,
    days: newDays,
    debt: newDebt,
    policeRecordScore: newPoliceScore,
    ship: {
      ...newShip,
      fuel: newShip.fuel - fuelCost,
      shieldStrength: newShieldStrength,
    },
    buyPrices,
    sellPrices,
    systemQuantities,
    systems: newSystems,
    encounters,
  };
}
