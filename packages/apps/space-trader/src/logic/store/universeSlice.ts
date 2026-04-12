import { StateCreator } from 'zustand';
import { SolarSystem, ShipTypes } from '../DataTypes';
import { generateGalaxy } from '../SystemGenerator';
import { generateSystemQuantities, determineSystemPrices } from '../Merchant';
import { processWarp } from '../domain/travel';
import { SpaceTraderState, UniverseSlice } from './types';

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
      isGameOver: false,
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
    });

    set({
      currentSystem: result.currentSystem,
      days: result.days,
      debt: result.debt,
      policeRecordScore: result.policeRecordScore,
      ship: result.ship,
      buyPrices: result.buyPrices,
      sellPrices: result.sellPrices,
      systemQuantities: result.systemQuantities,
      systems: result.systems,
      encounter: result.encounter,
    });
  },
});
