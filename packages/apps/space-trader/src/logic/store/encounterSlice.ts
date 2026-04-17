import { StateCreator } from 'zustand';
import { ActiveEncounter, ShipTypes, PoliticalSystems, TradeItems } from '../DataTypes';
import {
  ENCOUNTER_PIRATE,
  ENCOUNTER_POLICE,
  ENCOUNTER_TRADER,
  ENCOUNTER_MONSTER,
  ENCOUNTER_DRAGONFLY,
  ENCOUNTER_SCARAB,
  shipStrength,
} from '../Encounter';
import { resolveCombatRound, resolveFlee } from '../domain/combat';
import { SpaceTraderState, EncounterSlice } from './types';

const getRandom = (max: number) => Math.floor(Math.random() * max);

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

    // If NPC was fleeing and player attacks (pursue), NPC gets a free shot first
    const npcWasFleeing = state.encounter.encounterAction === 'FLEE_NPC';

    // Switch encounter to combat mode
    const enc = npcWasFleeing
      ? { ...state.encounter, encounterAction: 'ATTACK' as const }
      : state.encounter;

    const result = resolveCombatRound(
      state.ship,
      enc.npc,
      state.difficulty,
      { pilot: state.pilotSkill, fighter: state.fighterSkill, engineer: state.engineerSkill },
      enc.log,
      enc.round,
    );

    // Player destroyed
    if (state.isGameOver || result.playerShip.hull <= 0) {
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
          encounter: { ...enc, log: result.log, resolved: true, playerWon: false },
        });
      } else {
        set({ isGameOver: true, encounter: null });
      }
      return;
    }

    // Player wins — NPC destroyed
    if (result.playerWon) {
      const isPirate = enc.type === ENCOUNTER_PIRATE;
      const isPolice = enc.type === ENCOUNTER_POLICE;
      const isTrader = enc.type === ENCOUNTER_TRADER;
      const repGain = isPirate ? 1 : 0;
      const policeHit = isPolice ? -3 : isTrader ? -2 : 0;

      set({
        credits: state.credits + result.bounty,
        reputationScore: state.reputationScore + repGain,
        policeRecordScore: state.policeRecordScore + policeHit,
        killsPirate: state.killsPirate + (isPirate ? 1 : 0),
        killsPolice: state.killsPolice + (isPolice ? 1 : 0),
        encounter: {
          ...enc,
          npc: { ...enc.npc, ship: result.npcShip },
          log: result.log,
          round: enc.round + 1,
          resolved: true,
          playerWon: true,
        },
      });

      // Quest encounter victory hooks
      if (
        enc.type === ENCOUNTER_MONSTER ||
        enc.type === ENCOUNTER_DRAGONFLY ||
        enc.type === ENCOUNTER_SCARAB
      ) {
        state.handleQuestEncounterVictory(enc.type);
      }
      return;
    }

    // Combat continues — check if NPC should try to flee (OG behavior)
    const npcMaxHull = ShipTypes[enc.npc.ship.type].hullStrength;
    const npcHullPct = npcMaxHull > 0 ? result.npcShip.hull / npcMaxHull : 1;
    const isBoss =
      enc.type === ENCOUNTER_MONSTER ||
      enc.type === ENCOUNTER_DRAGONFLY ||
      enc.type === ENCOUNTER_SCARAB;

    let newAction = enc.encounterAction;
    const log = [...result.log];

    // NPCs flee when hull < 30% (pirates and traders, not police or bosses)
    if (
      !isBoss &&
      enc.type !== ENCOUNTER_POLICE &&
      npcHullPct < 0.3 &&
      enc.encounterAction === 'ATTACK'
    ) {
      // NPC attempts to flee
      const npcPilot = enc.npc.pilotSkill;
      const playerPilot = state.pilotSkill;
      const fleeChance = 0.3 + npcPilot * 0.04 - playerPilot * 0.02;
      if (Math.random() < Math.max(0.05, fleeChance)) {
        newAction = 'FLEE_NPC';
        const label = enc.type === ENCOUNTER_PIRATE ? 'pirate' : 'trader';
        log.push(`The ${label} is trying to flee!`);
      }
    }

    set({
      ship: result.playerShip,
      encounter: {
        ...enc,
        npc: { ...enc.npc, ship: result.npcShip },
        log,
        round: enc.round + 1,
        encounterAction: newAction,
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

    // OG: Fleeing from police worsens record
    let policeHit = 0;
    if (state.encounter.type === ENCOUNTER_POLICE) {
      policeHit = -1;
    }

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
          policeRecordScore: state.policeRecordScore + policeHit,
          encounter: { ...state.encounter, log: result.log, resolved: true, playerWon: false },
        });
      } else {
        set({ isGameOver: true, encounter: null });
      }
      return;
    }

    set({
      ship: result.playerShip,
      policeRecordScore: state.policeRecordScore + policeHit,
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
      // Police inspection (submit to search)
      const destIdx = enc.destinationSystemIdx ?? state.currentSystem;
      const pol = PoliticalSystems[state.systems[destIdx]?.politics ?? 0];
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
      // Trader: ignore
      log.push('You pass the trader without incident.');
      set({ encounter: { ...enc, log, resolved: true, playerWon: false } });
    }
  },

  bribePolice: () => {
    const state = get();
    if (!state.encounter || state.encounter.resolved || state.encounter.type !== ENCOUNTER_POLICE)
      return;
    const destIdx = state.encounter.destinationSystemIdx ?? state.currentSystem;
    const pol = PoliticalSystems[state.systems[destIdx]?.politics ?? 0];
    const log = [...state.encounter.log];
    if (pol.bribeLevel === 0) {
      log.push('These police cannot be bribed.');
      set({ encounter: { ...state.encounter, log } });
      return;
    }
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
    const enc = state.encounter;
    const log = [...enc.log];

    // OG: Trader offers a random good at a discount
    const npcCargo = enc.npc.ship.cargo;
    const availableGoods = npcCargo.map((qty, id) => ({ id, qty })).filter(({ qty }) => qty > 0);

    if (availableGoods.length > 0) {
      const offer = availableGoods[getRandom(availableGoods.length)];
      const item = TradeItems[offer.id];
      const basePrice = item.minTradePrice + getRandom(item.maxTradePrice - item.minTradePrice + 1);
      const discountedPrice = Math.floor(basePrice * 0.85);
      const shipType = ShipTypes[state.ship.type];
      const usedCargo = state.ship.cargo.reduce((a, b) => a + b, 0);
      const freeBays = shipType.cargoBays - usedCargo;
      const canAfford = discountedPrice > 0 ? Math.floor(state.credits / discountedPrice) : 0;
      const qty = Math.min(offer.qty, freeBays, canAfford);

      if (qty > 0) {
        const newCargo = [...state.ship.cargo];
        newCargo[offer.id] += qty;
        const cost = qty * discountedPrice;
        log.push(`Bought ${qty} ${item.name} from trader at ${discountedPrice} cr. each.`);
        set({
          credits: state.credits - cost,
          ship: { ...state.ship, cargo: newCargo },
          encounter: { ...enc, log, resolved: true, playerWon: false },
        });
      } else {
        log.push("You can't afford or carry what the trader offers.");
        set({ encounter: { ...enc, log, resolved: true, playerWon: false } });
      }
    } else {
      log.push('The trader has nothing to offer.');
      set({ encounter: { ...enc, log, resolved: true, playerWon: false } });
    }
  },

  letNPCGo: () => {
    const state = get();
    if (!state.encounter || state.encounter.resolved) return;
    const log = [...state.encounter.log, 'You let them go.'];
    set({
      encounter: { ...state.encounter, log, resolved: true, playerWon: false },
    });
  },

  ignoreEncounter: () => {
    const state = get();
    if (!state.encounter || state.encounter.resolved) return;
    const enc = state.encounter;
    const log = [...enc.log];

    if (enc.type === ENCOUNTER_TRADER) {
      // Traders always let you ignore
      log.push('You ignore the trader.');
      set({ encounter: { ...enc, log, resolved: true, playerWon: false } });
      return;
    }

    if (enc.type === ENCOUNTER_PIRATE) {
      // OG: 50% chance pirates attack anyway
      if (Math.random() < 0.5) {
        log.push('The pirates attack despite your attempt to ignore them!');
        set({ encounter: { ...enc, log, encounterAction: 'ATTACK' } });
      } else {
        log.push('The pirates let you pass.');
        set({ encounter: { ...enc, log, resolved: true, playerWon: false } });
      }
      return;
    }

    if (enc.type === ENCOUNTER_POLICE) {
      // OG: ignoring police is risky — if you have contraband, they attack
      const destIdx = enc.destinationSystemIdx ?? state.currentSystem;
      const pol = PoliticalSystems[state.systems[destIdx]?.politics ?? 0];
      const hasContraband =
        (state.ship.cargo[8] > 0 && !pol.drugsOk) || (state.ship.cargo[5] > 0 && !pol.firearmsOk);

      if (hasContraband || state.policeRecordScore < -5) {
        log.push('The police pursue you!');
        set({
          encounter: { ...enc, log, encounterAction: 'ATTACK' },
          policeRecordScore: state.policeRecordScore - 1,
        });
      } else {
        log.push('The police let you continue.');
        set({ encounter: { ...enc, log, resolved: true, playerWon: false } });
      }
      return;
    }

    // Default: just resolve
    log.push('You continue on your way.');
    set({ encounter: { ...enc, log, resolved: true, playerWon: false } });
  },
});
