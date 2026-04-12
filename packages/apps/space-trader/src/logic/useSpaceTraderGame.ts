import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  PlayerShip,
  SolarSystem,
  MAXDIFFICULTY,
  TradeItems,
  UNEVENTFUL,
  ShipTypes,
  Weapons,
  Shields,
  Gadgets,
  ESCAPE_POD_PRICE,
  ESCAPE_POD_TECH_LEVEL,
} from './DataTypes';
import { generateGalaxy } from './SystemGenerator';
import { determineSystemPrices, generateSystemQuantities } from './Merchant';
import {
  determineEncounter,
  ENCOUNTER_NONE,
  ENCOUNTER_PIRATE,
  ENCOUNTER_POLICE,
  ENCOUNTER_TRADER,
  generateNPCEncounter,
  NPCEncounterData,
  executeAttack,
  getTotalShieldStrength,
} from './Encounter';

export interface ActiveEncounter {
  type: string; // ENCOUNTER_PIRATE | ENCOUNTER_POLICE | ENCOUNTER_TRADER
  npc: NPCEncounterData;
  log: string[];
  round: number;
  resolved: boolean; // combat ended, show result
  playerWon: boolean;
}

export interface SpaceTraderState {
  credits: number;
  debt: number;
  days: number;
  policeRecordScore: number;
  reputationScore: number;
  currentSystem: number;
  difficulty: number;

  nameCommander: string;
  pilotSkill: number;
  fighterSkill: number;
  traderSkill: number;
  engineerSkill: number;

  ship: PlayerShip;
  systems: SolarSystem[];
  buyPrices: number[];
  sellPrices: number[];
  systemQuantities: number[];
  encounter: ActiveEncounter | null;
  isGameOver: boolean;
  tradeMode: 'buy' | 'sell' | 'price-list';

  // Actions
  startNewGame: (
    name: string,
    diff: number,
    skills: { pilot: number; fighter: number; trader: number; engineer: number },
  ) => void;
  travelTo: (systemId: number) => void;
  buyGood: (goodId: number, amount: number) => void;
  sellGood: (goodId: number, amount: number) => void;
  buyShip: (shipTypeId: number) => void;
  buyWeapon: (weaponId: number) => void;
  buyShield: (shieldId: number) => void;
  buyGadget: (gadgetId: number) => void;
  buyEscapePod: () => void;
  buyFuel: (units: number) => void;
  clearEncounter: () => void;
  takeDamage: (amount: number) => void;
  repairHull: () => void;
  restartGame: () => void;
  setTradeMode: (mode: 'buy' | 'sell' | 'price-list') => void;
  attackInEncounter: () => void;
  fleeFromEncounter: () => void;
  surrenderToEncounter: () => void;
  bribePolice: () => void;
  lootNPC: () => void;
  sellEquipment: (slot: 'weapon' | 'shield' | 'gadget', index: number) => void;
  dumpCargo: (goodId: number, amount: number) => void;
}

export const useSpaceTraderGame = create<SpaceTraderState>()(
  persist(
    (set, get) => ({
      credits: 1000,
      debt: 0,
      days: 0,
      policeRecordScore: 0,
      reputationScore: 0,
      currentSystem: 92, // Sol system is usually index 92 or the wormhole near Sol
      difficulty: 2, // Normal

      nameCommander: '',
      pilotSkill: 4,
      fighterSkill: 4,
      traderSkill: 4,
      engineerSkill: 4,

      ship: {
        type: 1, // Gnat
        cargo: new Array(10).fill(0),
        weapon: [0, -1, -1], // Pulse Laser
        shield: [-1, -1, -1],
        shieldStrength: [-1, -1, -1],
        gadget: [-1, -1, -1],
        escapePod: false,
        fuel: ShipTypes[1].fuelTanks,
        hull: ShipTypes[1].hullStrength,
      },

      systems: [],
      buyPrices: new Array(10).fill(0),
      sellPrices: new Array(10).fill(0),
      systemQuantities: new Array(10).fill(0),
      encounter: null,
      isGameOver: false,
      tradeMode: 'buy',

      startNewGame: (
        name: string,
        diff: number,
        skills: { pilot: number; fighter: number; trader: number; engineer: number },
      ) => {
        const { systems: rawSystems } = generateGalaxy();

        // Initialize persistent market quantities for every system at galaxy creation
        const systems = rawSystems.map((sys) => ({
          ...sys,
          qty: generateSystemQuantities(sys, diff),
        }));

        // Pick a valid starting system: tech level 1–5, at least 3 neighbors in fuel range.
        // Matches StartNewGame logic in NewGame.c (up to 200 attempts).
        const START_FUEL = ShipTypes[1].fuelTanks; // Gnat starting fuel
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

        const initialShip: PlayerShip = {
          type: 1, // Gnat
          cargo: new Array(10).fill(0),
          weapon: [0, -1, -1],
          shield: [-1, -1, -1],
          shieldStrength: [-1, -1, -1],
          gadget: [-1, -1, -1],
          escapePod: false,
          fuel: ShipTypes[1].fuelTanks,
          hull: ShipTypes[1].hullStrength,
        };

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
          ship: initialShip,

          buyPrices,
          sellPrices,
          systemQuantities,
          encounter: null,
          isGameOver: false,
        });
      },

      travelTo: (systemId: number) => {
        const state = get();
        const current = state.systems[state.currentSystem];
        const target = state.systems[systemId];

        const dist = Math.sqrt(
          Math.pow(target.x - current.x, 2) + Math.pow(target.y - current.y, 2),
        );
        const fuelCost = Math.floor(dist);

        if (state.ship.fuel < fuelCost) return;

        const { buyPrices, sellPrices } = determineSystemPrices(
          target,
          state.traderSkill,
          state.policeRecordScore,
        );

        // Use persistent system quantities — don't regenerate on every visit
        const systemQuantities = target.qty ?? new Array(10).fill(0);

        // Original: 21 encounter checks per trip (one click at a time)
        const CLICKS = 21;
        let encounter: ActiveEncounter | null = null;
        let alreadyRaided = false;
        for (let click = 0; click < CLICKS; click++) {
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
            encounter = {
              type: encounterType,
              npc,
              log: [],
              round: 0,
              resolved: false,
              playerWon: false,
            };
            if (encounterType === ENCOUNTER_PIRATE) alreadyRaided = true;
            break;
          }
        }

        // Reset shield strength to full power at start of each warp (matches original DoWarp)
        const newShieldStrength = state.ship.shield.map((s) => (s >= 0 ? Shields[s].power : -1));

        // Police record decay toward clean over time (from DoWarp in Travel.c)
        // CLEANSCORE=0, DUBIOUSSCORE=-5, NORMAL difficulty=2
        const newDays = state.days + 1;
        let newPoliceScore = state.policeRecordScore;
        if (newDays % 3 === 0) {
          if (newPoliceScore > 0) newPoliceScore--;
        }
        if (newPoliceScore < -5 && state.difficulty <= 2) {
          newPoliceScore++;
        }

        // Debt interest: 10% per warp (ceil), matches original DoWarp in Travel.c
        const newDebt = state.debt > 0 ? Math.ceil(state.debt * 1.1) : 0;

        set({
          currentSystem: systemId,
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
          systems: state.systems.map((s, idx) => {
            // Flush current system's traded quantities back to persistent store
            if (idx === state.currentSystem) {
              return { ...s, qty: state.systemQuantities };
            }
            if (idx === systemId) {
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
          }),
          encounter,
        });
      },

      buyGood: (goodId: number, amount: number) => {
        const state = get();
        const price = state.buyPrices[goodId];
        if (price <= 0) return;

        const system = state.systems[state.currentSystem];
        const maxPoss = Math.min(
          Math.floor(state.credits / price),
          state.systemQuantities[goodId] || 0,
        );

        // In actual C code, the amount is checked against cargo space too
        const usedCargo = state.ship.cargo.reduce((a, b) => a + b, 0);
        const shipType = ShipTypes[state.ship.type];
        const freeCargo = shipType.cargoBays - usedCargo;
        const finalAmount = Math.min(amount, maxPoss, freeCargo);

        if (finalAmount <= 0) return;

        const newCargo = [...state.ship.cargo];
        newCargo[goodId] += finalAmount;

        const newQuantities = [...state.systemQuantities];
        newQuantities[goodId] -= finalAmount;

        // Persist depletion back to system so markets don't reset on re-visit
        const newSystems = state.systems.map((s, idx) =>
          idx === state.currentSystem ? { ...s, qty: newQuantities } : s,
        );

        set({
          credits: state.credits - finalAmount * price,
          ship: { ...state.ship, cargo: newCargo },
          systemQuantities: newQuantities,
          systems: newSystems,
        });
      },

      sellGood: (goodId: number, amount: number) => {
        const state = get();
        const price = state.sellPrices[goodId];
        if (price <= 0) return;

        const finalAmount = Math.min(amount, state.ship.cargo[goodId]);
        if (finalAmount <= 0) return;

        const newCargo = [...state.ship.cargo];
        newCargo[goodId] -= finalAmount;

        const newQuantities = [...state.systemQuantities];
        newQuantities[goodId] += finalAmount;

        const newSystems = state.systems.map((s, idx) =>
          idx === state.currentSystem ? { ...s, qty: newQuantities } : s,
        );

        set({
          credits: state.credits + finalAmount * price,
          ship: { ...state.ship, cargo: newCargo },
          systemQuantities: newQuantities,
          systems: newSystems,
        });
      },

      buyShip: (shipTypeId: number) => {
        const state = get();
        const newType = ShipTypes[shipTypeId];
        const oldType = ShipTypes[state.ship.type];

        // Trade-in value (from Shipyard.c):
        // 75% of old ship base price, minus hull damage and fuel deficit, plus 2/3 of equipment
        let tradeIn = Math.floor((oldType.price * 3) / 4);
        tradeIn -= (oldType.hullStrength - state.ship.hull) * oldType.repairCosts;
        tradeIn -= (oldType.fuelTanks - state.ship.fuel) * oldType.costOfFuel;
        for (const w of state.ship.weapon) {
          if (w >= 0) tradeIn += Math.floor((Weapons[w].price * 2) / 3);
        }
        for (const s of state.ship.shield) {
          if (s >= 0) tradeIn += Math.floor((Shields[s].price * 2) / 3);
        }
        for (const g of state.ship.gadget) {
          if (g >= 0) tradeIn += Math.floor((Gadgets[g].price * 2) / 3);
        }
        tradeIn = Math.max(0, tradeIn);

        const netCost = newType.price - tradeIn;
        if (state.credits < netCost) return;

        // Cargo transfers if it fits in the new ship; equipment stays with old ship
        const usedCargo = state.ship.cargo.reduce((a, b) => a + b, 0);
        const newCargo =
          usedCargo <= newType.cargoBays ? [...state.ship.cargo] : new Array(10).fill(0);

        set({
          credits: state.credits - netCost,
          ship: {
            type: shipTypeId,
            cargo: newCargo,
            weapon: [-1, -1, -1],
            shield: [-1, -1, -1],
            shieldStrength: [-1, -1, -1],
            gadget: [-1, -1, -1],
            escapePod: state.ship.escapePod, // escape pod transfers to new ship
            fuel: newType.fuelTanks,
            hull: newType.hullStrength,
          },
        });
      },

      buyWeapon: (weaponId: number) => {
        const state = get();
        const w = Weapons[weaponId];
        if (state.credits < w.price) return;

        const slots = ShipTypes[state.ship.type].weaponSlots;
        const emptySlot = state.ship.weapon.indexOf(-1);

        if (emptySlot === -1 || emptySlot >= slots) return;

        const newWeapons = [...state.ship.weapon];
        newWeapons[emptySlot] = weaponId;

        set({
          credits: state.credits - w.price,
          ship: { ...state.ship, weapon: newWeapons },
        });
      },

      buyShield: (shieldId: number) => {
        const state = get();
        const s = Shields[shieldId];
        if (state.credits < s.price) return;

        const slots = ShipTypes[state.ship.type].shieldSlots;
        const emptySlot = state.ship.shield.indexOf(-1);

        if (emptySlot === -1 || emptySlot >= slots) return;

        const newShields = [...state.ship.shield];
        newShields[emptySlot] = shieldId;

        const newShieldStrength = [...state.ship.shieldStrength];
        newShieldStrength[emptySlot] = s.power; // Initialize to full power when installed

        set({
          credits: state.credits - s.price,
          ship: { ...state.ship, shield: newShields, shieldStrength: newShieldStrength },
        });
      },

      buyGadget: (gadgetId: number) => {
        const state = get();
        const g = Gadgets[gadgetId];
        if (state.credits < g.price) return;

        const slots = ShipTypes[state.ship.type].gadgetSlots;
        const emptySlot = state.ship.gadget.indexOf(-1);

        if (emptySlot === -1 || emptySlot >= slots) return;

        const newGadgets = [...state.ship.gadget];
        newGadgets[emptySlot] = gadgetId;

        set({
          credits: state.credits - g.price,
          ship: { ...state.ship, gadget: newGadgets },
        });
      },

      buyEscapePod: () => {
        const state = get();
        if (state.ship.escapePod) return; // already have one
        if (state.credits < ESCAPE_POD_PRICE) return;
        const system = state.systems[state.currentSystem];
        if (system.techLevel < ESCAPE_POD_TECH_LEVEL) return;
        set({
          credits: state.credits - ESCAPE_POD_PRICE,
          ship: { ...state.ship, escapePod: true },
        });
      },

      // Helper to get effective fighter/pilot/engineer skill accounting for gadgets
      // (called inline below using state)

      attackInEncounter: () => {
        const state = get();
        if (!state.encounter || state.encounter.resolved) return;

        const enc = state.encounter;
        const npcShipCopy: PlayerShip = {
          ...enc.npc.ship,
          shieldStrength: [...enc.npc.ship.shieldStrength],
          hull: enc.npc.ship.hull,
        };
        const playerShipCopy: PlayerShip = {
          ...state.ship,
          shieldStrength: [...state.ship.shieldStrength],
          hull: state.ship.hull,
        };

        // Gadget bonuses to player skills
        const hasTargeting = state.ship.gadget.includes(3);
        const hasAutoRepair = state.ship.gadget.includes(1);
        const hasNav = state.ship.gadget.includes(2);
        const hasCloaking = state.ship.gadget.includes(4);
        const effectiveFighter = state.fighterSkill + (hasTargeting ? 3 : 0);
        const effectivePilot = state.pilotSkill + (hasNav || hasCloaking ? 3 : 0);
        const effectiveEngineer = state.engineerSkill + (hasAutoRepair ? 2 : 0);

        const log: string[] = [...enc.log];

        // Player attacks NPC
        const playerHit = executeAttack(
          playerShipCopy,
          npcShipCopy,
          effectiveEngineer,
          enc.npc.engineerSkill,
          effectiveFighter,
          enc.npc.pilotSkill,
          false,
          state.difficulty,
          false,
        );
        if (playerHit) {
          const shieldLeft = npcShipCopy.shieldStrength.reduce((a, v) => a + Math.max(0, v), 0);
          log.push(
            `Round ${enc.round + 1}: You hit! NPC hull: ${npcShipCopy.hull} / shields: ${shieldLeft}`,
          );
        } else {
          log.push(`Round ${enc.round + 1}: Your shot missed.`);
        }

        // Check if NPC destroyed
        if (npcShipCopy.hull <= 0) {
          const bounty = enc.npc.bounty;
          const repGain = enc.type === ENCOUNTER_PIRATE ? 1 : 0;
          const policeHit = enc.type === ENCOUNTER_POLICE ? -3 : 0;
          log.push(`NPC destroyed! Bounty: ${bounty} cr.`);
          set({
            credits: state.credits + bounty,
            reputationScore: state.reputationScore + repGain,
            policeRecordScore: state.policeRecordScore + policeHit,
            encounter: {
              ...enc,
              npc: { ...enc.npc, ship: npcShipCopy },
              log,
              round: enc.round + 1,
              resolved: true,
              playerWon: true,
            },
          });
          return;
        }

        // NPC attacks player
        const npcHit = executeAttack(
          npcShipCopy,
          playerShipCopy,
          enc.npc.engineerSkill,
          effectiveEngineer,
          enc.npc.fighterSkill,
          effectivePilot,
          false,
          state.difficulty,
          true,
        );
        if (npcHit) {
          const shieldLeft = playerShipCopy.shieldStrength.reduce((a, v) => a + Math.max(0, v), 0);
          log.push(`NPC hits you! Your hull: ${playerShipCopy.hull} / shields: ${shieldLeft}`);
        } else {
          log.push(`NPC missed.`);
        }

        // Check if player destroyed
        if (playerShipCopy.hull <= 0) {
          if (state.ship.escapePod) {
            log.push('Your ship is destroyed! Escape pod activated.');
            set({
              ship: {
                type: 0,
                cargo: new Array(10).fill(0),
                weapon: [-1, -1, -1],
                shield: [-1, -1, -1],
                shieldStrength: [-1, -1, -1],
                gadget: [-1, -1, -1],
                escapePod: false,
                fuel: ShipTypes[0].fuelTanks,
                hull: ShipTypes[0].hullStrength,
              },
              encounter: {
                ...enc,
                npc: { ...enc.npc, ship: npcShipCopy },
                log,
                round: enc.round + 1,
                resolved: true,
                playerWon: false,
              },
            });
          } else {
            set({
              isGameOver: true,
              encounter: null,
            });
          }
          return;
        }

        set({
          ship: { ...playerShipCopy },
          encounter: {
            ...enc,
            npc: { ...enc.npc, ship: npcShipCopy },
            log,
            round: enc.round + 1,
          },
        });
      },

      fleeFromEncounter: () => {
        const state = get();
        if (!state.encounter || state.encounter.resolved) return;

        const enc = state.encounter;
        const log: string[] = [...enc.log];

        // Gadget bonuses
        const hasNav = state.ship.gadget.includes(2);
        const hasCloaking = state.ship.gadget.includes(4);
        const hasAutoRepair = state.ship.gadget.includes(1);
        const effectivePilot = state.pilotSkill + (hasNav || hasCloaking ? 3 : 0);
        const effectiveEngineer = state.engineerSkill + (hasAutoRepair ? 2 : 0);

        // Flee roll: based on pilot skill
        const fleeRoll = Math.random();
        const fleeChance = 0.3 + effectivePilot * 0.04; // 30–70% base
        if (fleeRoll < fleeChance) {
          log.push('You successfully fled!');
          set({ encounter: { ...enc, log, resolved: true, playerWon: false } });
          return;
        }

        // Failed flee: NPC gets a free shot
        log.push('Flee failed! NPC fires...');
        const playerShipCopy: PlayerShip = {
          ...state.ship,
          shieldStrength: [...state.ship.shieldStrength],
          hull: state.ship.hull,
        };
        const npcShipCopy: PlayerShip = {
          ...enc.npc.ship,
          shieldStrength: [...enc.npc.ship.shieldStrength],
        };

        executeAttack(
          npcShipCopy,
          playerShipCopy,
          enc.npc.engineerSkill,
          effectiveEngineer,
          enc.npc.fighterSkill,
          effectivePilot,
          true, // player is fleeing
          state.difficulty,
          true,
        );

        if (playerShipCopy.hull <= 0) {
          if (state.ship.escapePod) {
            log.push('Your ship is destroyed while fleeing! Escape pod activated.');
            set({
              ship: {
                type: 0,
                cargo: new Array(10).fill(0),
                weapon: [-1, -1, -1],
                shield: [-1, -1, -1],
                shieldStrength: [-1, -1, -1],
                gadget: [-1, -1, -1],
                escapePod: false,
                fuel: ShipTypes[0].fuelTanks,
                hull: ShipTypes[0].hullStrength,
              },
              encounter: { ...enc, log, round: enc.round + 1, resolved: true, playerWon: false },
            });
          } else {
            set({ isGameOver: true, encounter: null });
          }
          return;
        }

        const shieldLeft = playerShipCopy.shieldStrength.reduce((a, v) => a + Math.max(0, v), 0);
        log.push(
          `You took a hit while fleeing. Hull: ${playerShipCopy.hull}, shields: ${shieldLeft}. Fled successfully.`,
        );
        set({
          ship: { ...playerShipCopy },
          encounter: { ...enc, log, round: enc.round + 1, resolved: true, playerWon: false },
        });
      },

      surrenderToEncounter: () => {
        const state = get();
        if (!state.encounter || state.encounter.resolved) return;

        const enc = state.encounter;
        const log: string[] = [...enc.log];

        if (enc.type === ENCOUNTER_PIRATE) {
          // Pirates take as much cargo as they can carry
          const npcBays = ShipTypes[enc.npc.ship.type].cargoBays;
          const newCargo = [...state.ship.cargo];
          let taken = 0;
          for (let i = 9; i >= 0 && taken < npcBays; i--) {
            const take = Math.min(newCargo[i], npcBays - taken);
            newCargo[i] -= take;
            taken += take;
          }
          log.push(`Pirates loot ${taken} units of cargo.`);
          // Police record penalty for surrendering to pirates
          set({
            ship: { ...state.ship, cargo: newCargo },
            encounter: { ...enc, log, resolved: true, playerWon: false },
          });
        } else if (enc.type === ENCOUNTER_POLICE) {
          // Police inspect cargo for contraband
          const politics = state.systems[state.currentSystem];
          const hasNarcotics = state.ship.cargo[8] > 0;
          const hasFirearms = state.ship.cargo[5] > 0;
          // TODO: check politics.drugsOk / firearmsOk when PoliticalSystems accessible here
          if (hasNarcotics || hasFirearms) {
            const newCargo = [...state.ship.cargo];
            const narcoticsTaken = newCargo[8];
            const firearmsTaken = newCargo[5];
            newCargo[8] = 0;
            newCargo[5] = 0;
            const fine = (narcoticsTaken + firearmsTaken) * 50 * (state.difficulty + 1);
            const newCredits = Math.max(0, state.credits - fine);
            log.push(
              `Police found contraband! Confiscated ${narcoticsTaken} narcotics, ${firearmsTaken} firearms. Fine: ${fine} cr.`,
            );
            set({
              credits: newCredits,
              ship: { ...state.ship, cargo: newCargo },
              policeRecordScore: state.policeRecordScore - 1,
              encounter: { ...enc, log, resolved: true, playerWon: false },
            });
          } else {
            log.push('Police found nothing illegal. You are free to go.');
            set({ encounter: { ...enc, log, resolved: true, playerWon: false } });
          }
        } else {
          // Trader — pass by peacefully
          log.push('You pass the trader without incident.');
          set({ encounter: { ...enc, log, resolved: true, playerWon: false } });
        }
      },

      bribePolice: () => {
        const state = get();
        if (!state.encounter || state.encounter.resolved) return;
        if (state.encounter.type !== ENCOUNTER_POLICE) return;

        const enc = state.encounter;
        // Bribe cost = player net worth * bribeLevel / 7  (simplified: credits * 0.05 * diff)
        const bribeCost = Math.max(100, Math.floor(state.credits * 0.05 * (state.difficulty + 1)));
        const log = [...enc.log];
        if (state.credits < bribeCost) {
          log.push(`You cannot afford the bribe (${bribeCost} cr).`);
          set({ encounter: { ...enc, log } });
          return;
        }
        log.push(`You paid a bribe of ${bribeCost} cr. Police let you go.`);
        set({
          credits: state.credits - bribeCost,
          encounter: { ...enc, log, resolved: true, playerWon: false },
        });
      },

      lootNPC: () => {
        const state = get();
        if (!state.encounter || !state.encounter.resolved || !state.encounter.playerWon) return;

        const enc = state.encounter;
        const shipType = ShipTypes[state.ship.type];
        const usedCargo = state.ship.cargo.reduce((a, b) => a + b, 0);
        const freeCargo = shipType.cargoBays - usedCargo;

        if (freeCargo <= 0) {
          set({ encounter: null });
          return;
        }

        const newCargo = [...state.ship.cargo];
        let looted = 0;
        for (let i = 0; i < 10 && looted < freeCargo; i++) {
          const take = Math.min(enc.npc.lootCargo[i], freeCargo - looted);
          newCargo[i] += take;
          looted += take;
        }
        set({
          ship: { ...state.ship, cargo: newCargo },
          encounter: null,
        });
      },

      clearEncounter: () => set({ encounter: null }),

      takeDamage: (amount: number) => {
        const state = get();
        const newHull = Math.max(0, state.ship.hull - amount);

        if (newHull <= 0) {
          if (state.ship.escapePod) {
            // Lose ship, cargo, weapons, gadgets; escape pod consumed on use
            set({
              ship: {
                type: 0, // Back to Flea
                cargo: new Array(10).fill(0),
                weapon: [-1, -1, -1],
                shield: [-1, -1, -1],
                shieldStrength: [-1, -1, -1],
                gadget: [-1, -1, -1],
                escapePod: false, // pod is consumed
                fuel: ShipTypes[0].fuelTanks,
                hull: ShipTypes[0].hullStrength,
              },
              encounter: null,
            });
          } else {
            set({ isGameOver: true, encounter: null });
          }
        } else {
          set({ ship: { ...state.ship, hull: newHull } });
        }
      },

      buyFuel: (units: number) => {
        const state = get();
        const shipType = ShipTypes[state.ship.type];
        const maxFuel = shipType.fuelTanks;
        const canBuy = Math.min(units, maxFuel - state.ship.fuel);
        if (canBuy <= 0) return;
        const cost = canBuy * shipType.costOfFuel;
        if (state.credits < cost) return;
        set({
          credits: state.credits - cost,
          ship: { ...state.ship, fuel: state.ship.fuel + canBuy },
        });
      },

      repairHull: () => {
        const state = get();
        const shipType = ShipTypes[state.ship.type];
        const cost = (shipType.hullStrength - state.ship.hull) * shipType.repairCosts;
        if (state.credits >= cost && cost > 0) {
          set({
            credits: state.credits - cost,
            ship: { ...state.ship, hull: shipType.hullStrength },
          });
        }
      },

      restartGame: () => {
        localStorage.removeItem('space-trader-save');
        set({
          nameCommander: '',
          credits: 1000,
          reputationScore: 0,
          policeRecordScore: 0,
          pilotSkill: 0,
          fighterSkill: 0,
          traderSkill: 0,
          engineerSkill: 0,
          ship: {
            type: 0,
            cargo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            weapon: [],
            shield: [],
            shieldStrength: [],
            gadget: [],
            escapePod: false,
            fuel: 14,
            hull: 25,
          },
          encounter: null,
          isGameOver: false,
        });
      },

      sellEquipment: (slot: 'weapon' | 'shield' | 'gadget', index: number) => {
        const state = get();
        const ship = state.ship;
        let refund = 0;
        let newSlot: number[];

        if (slot === 'weapon') {
          if (ship.weapon[index] < 0) return;
          refund = Math.floor(Weapons[ship.weapon[index]].price / 2);
          newSlot = [...ship.weapon];
          newSlot[index] = -1;
          set({
            credits: state.credits + refund,
            ship: { ...ship, weapon: newSlot },
          });
        } else if (slot === 'shield') {
          if (ship.shield[index] < 0) return;
          refund = Math.floor(Shields[ship.shield[index]].price / 2);
          const newShields = [...ship.shield];
          newShields[index] = -1;
          const newShieldStrength = [...ship.shieldStrength];
          newShieldStrength[index] = -1;
          set({
            credits: state.credits + refund,
            ship: { ...ship, shield: newShields, shieldStrength: newShieldStrength },
          });
        } else if (slot === 'gadget') {
          if (ship.gadget[index] < 0) return;
          refund = Math.floor(Gadgets[ship.gadget[index]].price / 2);
          newSlot = [...ship.gadget];
          newSlot[index] = -1;
          set({
            credits: state.credits + refund,
            ship: { ...ship, gadget: newSlot },
          });
        }
      },

      dumpCargo: (goodId: number, amount: number) => {
        const state = get();
        const available = state.ship.cargo[goodId];
        if (available <= 0) return;
        const dumpAmount = Math.min(amount, available);
        const dumpCost = dumpAmount * 5 * (state.difficulty + 1);
        if (state.credits < dumpCost) return;
        const newCargo = [...state.ship.cargo];
        newCargo[goodId] -= dumpAmount;
        set({
          credits: state.credits - dumpCost,
          ship: { ...state.ship, cargo: newCargo },
        });
      },

      setTradeMode: (mode) => set({ tradeMode: mode }),
    }),
    {
      name: 'space-trader-save',
      // Do not persist actions
      partialize: (state) =>
        Object.fromEntries(
          Object.entries(state).filter(
            ([key]) =>
              ![
                'startNewGame',
                'travelTo',
                'buyGood',
                'sellGood',
                'buyShip',
                'buyWeapon',
                'buyShield',
                'buyGadget',
                'buyEscapePod',
                'buyFuel',
                'clearEncounter',
                'takeDamage',
                'repairHull',
                'restartGame',
                'setTradeMode',
                'attackInEncounter',
                'fleeFromEncounter',
                'surrenderToEncounter',
                'bribePolice',
                'lootNPC',
                'sellEquipment',
                'dumpCargo',
              ].includes(key),
          ),
        ) as any,
    },
  ),
);
