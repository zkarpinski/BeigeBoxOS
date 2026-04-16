import { StateCreator } from 'zustand';
import { ActiveEncounter, ShipTypes, PoliticalSystems } from '../DataTypes';
import {
  ENCOUNTER_PIRATE,
  ENCOUNTER_POLICE,
  ENCOUNTER_TRADER,
  ENCOUNTER_MONSTER,
  ENCOUNTER_DRAGONFLY,
  ENCOUNTER_SCARAB,
} from '../Encounter';
import { resolveCombatRound, resolveFlee } from '../domain/combat';
import { SpaceTraderState, EncounterSlice } from './types';

export const createEncounterSlice: StateCreator<SpaceTraderState, [], [], EncounterSlice> = (
  set,
  get,
) => ({
  encounter: null,
  pendingEncounters: [],
  isGameOver: false,

  clearEncounter: () => {
    const { pendingEncounters } = get();
    if (pendingEncounters.length > 0) {
      const [next, ...rest] = pendingEncounters;
      set({ encounter: next, pendingEncounters: rest });
    } else {
      set({ encounter: null });
    }
  },

  attackInEncounter: () => {
    const state = get();
    if (!state.encounter || state.encounter.resolved) return;

    const result = resolveCombatRound(
      state.ship,
      state.encounter.npc,
      state.difficulty,
      { pilot: state.pilotSkill, fighter: state.fighterSkill, engineer: state.engineerSkill },
      state.encounter.log,
      state.encounter.round,
    );

    if (state.isGameOver || result.playerShip.hull <= 0) {
      if (state.ship.escapePod) {
        // Handle escape pod activation if not handled by combat logic fully
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
          encounter: { ...state.encounter, log: result.log, resolved: true, playerWon: false },
        });
      } else {
        set({ isGameOver: true, encounter: null });
      }
      return;
    }

    // Handle Victory
    if (result.playerWon) {
      const isPirate = state.encounter.type === ENCOUNTER_PIRATE;
      const isPolice = state.encounter.type === ENCOUNTER_POLICE;
      const repGain = isPirate ? 1 : 0;
      const policeHit = isPolice ? -3 : state.encounter.type === ENCOUNTER_TRADER ? -2 : 0;

      set({
        credits: state.credits + result.bounty,
        reputationScore: state.reputationScore + repGain,
        policeRecordScore: state.policeRecordScore + policeHit,
        killsPirate: state.killsPirate + (isPirate ? 1 : 0),
        killsPolice: state.killsPolice + (isPolice ? 1 : 0),
        encounter: {
          ...state.encounter,
          npc: { ...state.encounter.npc, ship: result.npcShip },
          log: result.log,
          round: state.encounter.round + 1,
          resolved: true,
          playerWon: true,
        },
      });

      // Quest encounter victory hooks
      const encType = state.encounter.type;
      if (
        encType === ENCOUNTER_MONSTER ||
        encType === ENCOUNTER_DRAGONFLY ||
        encType === ENCOUNTER_SCARAB
      ) {
        state.handleQuestEncounterVictory(encType);
      }
      return;
    }

    set({
      ship: result.playerShip,
      encounter: {
        ...state.encounter,
        npc: { ...state.encounter.npc, ship: result.npcShip },
        log: result.log,
        round: state.encounter.round + 1,
      },
    });
  },

  fleeFromEncounter: () => {
    const state = get();
    if (!state.encounter || state.encounter.resolved) return;

    const result = resolveFlee(
      state.ship,
      state.encounter.npc,
      state.difficulty,
      { pilot: state.pilotSkill, engineer: state.engineerSkill },
      state.encounter.log,
      state.encounter.round,
    );

    if (result.playerShip.hull <= 0) {
      if (state.ship.escapePod) {
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
          encounter: { ...state.encounter, log: result.log, resolved: true, playerWon: false },
        });
      } else {
        set({ isGameOver: true, encounter: null });
      }
      return;
    }

    set({
      ship: result.playerShip,
      encounter: {
        ...state.encounter,
        log: result.log,
        resolved: result.resolved,
      },
    });
  },

  surrenderToEncounter: () => {
    const state = get();
    if (!state.encounter || state.encounter.resolved) return;

    const enc = state.encounter;
    const log = [...enc.log];

    if (enc.type === ENCOUNTER_PIRATE) {
      const npcBays = ShipTypes[enc.npc.ship.type].cargoBays;
      const newCargo = [...state.ship.cargo];
      let taken = 0;
      for (let i = 9; i >= 0 && taken < npcBays; i--) {
        const take = Math.min(newCargo[i], npcBays - taken);
        newCargo[i] -= take;
        taken += take;
      }
      log.push(`Pirates loot ${taken} units of cargo.`);
      set({
        ship: { ...state.ship, cargo: newCargo },
        encounter: { ...enc, log, resolved: true, playerWon: false },
      });
    } else if (enc.type === ENCOUNTER_POLICE) {
      const pol = PoliticalSystems[state.systems[state.currentSystem].politics];
      const hasNarcotics = state.ship.cargo[8] > 0 && !pol.drugsOk;
      const hasFirearms = state.ship.cargo[5] > 0 && !pol.firearmsOk;
      if (hasNarcotics || hasFirearms) {
        const newCargo = [...state.ship.cargo];
        const narcoticsTaken = hasNarcotics ? newCargo[8] : 0;
        const firearmsTaken = hasFirearms ? newCargo[5] : 0;
        if (hasNarcotics) newCargo[8] = 0;
        if (hasFirearms) newCargo[5] = 0;
        const fine = (narcoticsTaken + firearmsTaken) * 50 * (state.difficulty + 1);
        log.push(
          `Police found contraband! Confiscated ${narcoticsTaken} narcotics, ${firearmsTaken} firearms. Fine: ${fine} cr.`,
        );
        set({
          credits: Math.max(0, state.credits - fine),
          ship: { ...state.ship, cargo: newCargo },
          policeRecordScore: state.policeRecordScore - 1,
          encounter: { ...enc, log, resolved: true, playerWon: false },
        });
      } else {
        log.push('Police found nothing illegal. You are free to go.');
        set({ encounter: { ...enc, log, resolved: true, playerWon: false } });
      }
    } else {
      log.push('You pass the trader without incident.');
      set({ encounter: { ...enc, log, resolved: true, playerWon: false } });
    }
  },

  bribePolice: () => {
    const state = get();
    if (!state.encounter || state.encounter.resolved || state.encounter.type !== ENCOUNTER_POLICE)
      return;
    const pol = PoliticalSystems[state.systems[state.currentSystem].politics];
    const log = [...state.encounter.log];
    if (pol.bribeLevel === 0) {
      log.push('These police cannot be bribed.');
      set({ encounter: { ...state.encounter, log } });
      return;
    }
    // Net worth proxy: credits + ship trade-in value (90% of ship price)
    const netWorth =
      state.credits + Math.floor(ShipTypes[state.ship.type].price * 0.9) - state.debt;
    const bribeCost = Math.max(10, Math.floor(netWorth / (10 * pol.bribeLevel)));
    if (state.credits < bribeCost) {
      log.push(`You cannot afford the bribe (${bribeCost} cr).`);
      set({ encounter: { ...state.encounter, log } });
      return;
    }
    log.push(`You paid a bribe of ${bribeCost} cr. Police let you go.`);
    set({
      credits: state.credits - bribeCost,
      encounter: { ...state.encounter, log, resolved: true, playerWon: false },
    });
  },

  lootNPC: () => {
    const state = get();
    if (!state.encounter || !state.encounter.resolved || !state.encounter.playerWon) return;
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
      const take = Math.min(state.encounter.npc.lootCargo[i], freeCargo - looted);
      newCargo[i] += take;
      looted += take;
    }
    set({ ship: { ...state.ship, cargo: newCargo }, encounter: null });
  },

  tradeWithNPC: () => {
    const state = get();
    if (!state.encounter || state.encounter.resolved) return;
    const log = [...state.encounter.log, 'You traded goods with the merchant.'];
    set({ encounter: { ...state.encounter, log, resolved: true, playerWon: true } });
  },
});
