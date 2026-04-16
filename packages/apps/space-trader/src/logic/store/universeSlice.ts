import { StateCreator } from 'zustand';
import { SolarSystem, ShipTypes } from '../DataTypes';
import { generateGalaxy } from '../SystemGenerator';
import { generateSystemQuantities, determineSystemPrices } from '../Merchant';
import { processWarp } from '../domain/travel';
import { ENCOUNTER_POLICE, ENCOUNTER_PIRATE, ENCOUNTER_TRADER } from '../Encounter';
import { SpaceTraderState, UniverseSlice } from './types';
import {
  GEMULONSYSTEM,
  DALEDSYSTEM,
  GEMULONINVADED,
  EXPERIMENTFAILED,
  ALIENINVASION,
  EXPERIMENT,
} from '../SpecialEvents';

export const createUniverseSlice: StateCreator<SpaceTraderState, [], [], UniverseSlice> = (
  set,
  get,
) => ({
  systems: [],
  currentSystem: 92,
  buyPrices: new Array(10).fill(0),
  sellPrices: new Array(10).fill(0),
  systemQuantities: new Array(10).fill(0),
  days: 0,

  startNewGame: (name, diff, skills) => {
    const { systems: rawSystems } = generateGalaxy();
    const systems = rawSystems.map((sys) => ({
      ...sys,
      qty: generateSystemQuantities(sys, diff),
    }));

    const START_FUEL = ShipTypes[1].fuelTanks;
    let startSystem = 0;
    for (let attempt = 0; attempt < 200; attempt++) {
      const candidate = Math.floor(Math.random() * systems.length);
      const sys = systems[candidate];
      if (sys.techLevel < 1 || sys.techLevel > 5) continue;
      const neighbors = systems.filter((s, idx) => {
        if (idx === candidate) return false;
        return Math.sqrt(Math.pow(s.x - sys.x, 2) + Math.pow(s.y - sys.y, 2)) <= START_FUEL;
      });
      if (neighbors.length >= 3) {
        startSystem = candidate;
        break;
      }
    }

    const sys = systems[startSystem];
    const { buyPrices, sellPrices } = determineSystemPrices(sys, skills.trader, 0);
    const systemQuantities = sys.qty ?? new Array(10).fill(0);

    set({
      nameCommander: name,
      difficulty: diff,
      credits: 1000,
      debt: 0,
      days: 0,
      policeRecordScore: 0,
      reputationScore: 0,
      killsPirate: 0,
      killsPolice: 0,
      pilotSkill: skills.pilot,
      fighterSkill: skills.fighter,
      traderSkill: skills.trader,
      engineerSkill: skills.engineer,
      systems,
      currentSystem: startSystem,
      ship: {
        type: 1,
        cargo: new Array(10).fill(0),
        weapon: [0, -1, -1],
        shield: [-1, -1, -1],
        shieldStrength: [-1, -1, -1],
        gadget: [-1, -1, -1],
        escapePod: false,
        fuel: ShipTypes[1].fuelTanks,
        hull: ShipTypes[1].hullStrength,
      },
      buyPrices,
      sellPrices,
      systemQuantities,
      encounter: null,
      pendingEncounters: [],
      isGameOver: false,
      // Reset quest state
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
    });
  },

  travelTo: (systemId) => {
    const state = get();
    // Flush current system quantities before leaving
    const preWarpSystems = state.systems.map((s, idx) =>
      idx === state.currentSystem ? { ...s, qty: state.systemQuantities } : s,
    );

    const result = processWarp(systemId, {
      currentSystem: state.currentSystem,
      systems: preWarpSystems,
      ship: state.ship,
      traderSkill: state.traderSkill,
      policeRecordScore: state.policeRecordScore,
      difficulty: state.difficulty,
      days: state.days,
      debt: state.debt,
      questState: {
        monsterStatus: state.monsterStatus,
        dragonflyStatus: state.dragonflyStatus,
        scarabStatus: state.scarabStatus,
        reactorOnBoard: state.reactorOnBoard,
      },
    });

    const arrivedShip = { ...result.ship };
    let creditsAfter = state.credits;
    const arrivedType = ShipTypes[arrivedShip.type];

    if (state.optAutoFuel) {
      const fuelNeeded = arrivedType.fuelTanks - arrivedShip.fuel;
      const fuelCostTotal = fuelNeeded * arrivedType.costOfFuel;
      if (fuelNeeded > 0 && creditsAfter >= fuelCostTotal) {
        arrivedShip.fuel = arrivedType.fuelTanks;
        creditsAfter -= fuelCostTotal;
      }
    }

    if (state.optAutoRepair) {
      const hullNeeded = arrivedType.hullStrength - arrivedShip.hull;
      const repairCostTotal = hullNeeded * arrivedType.repairCosts;
      if (hullNeeded > 0 && creditsAfter >= repairCostTotal) {
        arrivedShip.hull = arrivedType.hullStrength;
        creditsAfter -= repairCostTotal;
      }
    }

    // Filter encounters based on "ignore when safe" options
    const hasNoCargo = state.ship.cargo.every((q) => q === 0);
    const policeRecordSafe = state.policeRecordScore >= -10;
    const filteredEncounters = result.encounters.filter((enc) => {
      if (enc.type === ENCOUNTER_POLICE && state.optIgnorePolice && policeRecordSafe) return false;
      if (enc.type === ENCOUNTER_PIRATE && state.optIgnorePirates && hasNoCargo) return false;
      if (enc.type === ENCOUNTER_TRADER && state.optIgnoreTraders) return false;
      return true;
    });

    const arrivedAtTracked =
      state.optStopTrackingOnArrival && state.selectedMapSystemId === systemId;

    // Check for time-sensitive quest failures after countdown decrement
    const postWarpSystems = [...result.systems];
    const questUpdates: Record<string, number> = {};

    // Check if invasion countdown expired (the countdown was decremented in processWarp)
    if (state.invasionStatus === 1) {
      const invasionExpired = !postWarpSystems.some(
        (s) => s.special === ALIENINVASION && s.countDown > 0,
      );
      if (invasionExpired) {
        // Check if player arrived at Gemulon in time
        if (systemId !== GEMULONSYSTEM) {
          postWarpSystems[GEMULONSYSTEM] = {
            ...postWarpSystems[GEMULONSYSTEM],
            special: GEMULONINVADED,
            techLevel: 0,
          };
          questUpdates.invasionStatus = -1;
        }
      }
    }

    // Check if experiment countdown expired
    if (state.experimentStatus === 1) {
      const experimentExpired = !postWarpSystems.some(
        (s) => s.special === EXPERIMENT && s.countDown > 0,
      );
      if (experimentExpired) {
        if (systemId !== DALEDSYSTEM) {
          postWarpSystems[DALEDSYSTEM] = {
            ...postWarpSystems[DALEDSYSTEM],
            special: EXPERIMENTFAILED,
            techLevel: 0,
          };
          questUpdates.experimentStatus = -1;
        }
      }
    }

    set({
      currentSystem: result.currentSystem,
      days: result.days,
      debt: result.debt,
      policeRecordScore: result.policeRecordScore,
      ship: arrivedShip,
      credits: creditsAfter,
      buyPrices: result.buyPrices,
      sellPrices: result.sellPrices,
      systemQuantities: result.systemQuantities,
      systems: postWarpSystems,
      encounter: filteredEncounters[0] ?? null,
      pendingEncounters: filteredEncounters.slice(1),
      ...(arrivedAtTracked ? { selectedMapSystemId: null } : {}),
      ...questUpdates,
    });
  },
});
