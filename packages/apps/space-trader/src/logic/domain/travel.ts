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
  ENCOUNTER_NONE,
  ENCOUNTER_PIRATE,
} from '../Encounter';

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
      encounters.push({
        type: encounterType,
        npc,
        log: [],
        round: 0,
        resolved: false,
        playerWon: false,
        clickNumber: click,
        destinationSystemIdx: targetSystemId,
      });
      if (encounterType === ENCOUNTER_PIRATE) alreadyRaided = true;
    }
  }

  // Reset shield strength (matches original DoWarp)
  const newShieldStrength = state.ship.shield.map((s) => (s >= 0 ? Shields[s].power : -1));

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

  // System updates (visited status, random status changes)
  const newSystems = state.systems.map((s, idx) => {
    // Note: the original code flushed state.systemQuantities back to currentSystem here.
    // We'll maintain that logic in the caller or handle it here if we passed it in.
    if (idx === targetSystemId) {
      return { ...s, visited: true };
    }
    // 10% chance for any system to clear status
    if (s.status !== UNEVENTFUL && Math.random() < 0.1) {
      return { ...s, status: UNEVENTFUL };
    }
    // 5% chance for a random system to get a new status
    if (s.status === UNEVENTFUL && Math.random() < 0.05) {
      return { ...s, status: Math.floor(Math.random() * 8) };
    }
    return s;
  });

  return {
    currentSystem: targetSystemId,
    days: newDays,
    debt: newDebt,
    policeRecordScore: newPoliceScore,
    ship: {
      ...state.ship,
      fuel: state.ship.fuel - fuelCost,
      shieldStrength: newShieldStrength,
    },
    buyPrices,
    sellPrices,
    systemQuantities,
    systems: newSystems,
    encounters,
  };
}
