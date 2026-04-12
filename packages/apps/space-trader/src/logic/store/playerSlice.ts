import { StateCreator } from 'zustand';
import {
  PlayerShip,
  ShipTypes,
  Weapons,
  Shields,
  Gadgets,
  ESCAPE_POD_PRICE,
  ESCAPE_POD_TECH_LEVEL,
} from '../DataTypes';
import { executeBuy, executeSell } from '../domain/trade';
import { SpaceTraderState, PlayerSlice } from './types';

export const createPlayerSlice: StateCreator<SpaceTraderState, [], [], PlayerSlice> = (
  set,
  get,
) => ({
  credits: 1000,
  debt: 0,
  policeRecordScore: 0,
  reputationScore: 0,
  nameCommander: '',
  pilotSkill: 4,
  fighterSkill: 4,
  traderSkill: 4,
  engineerSkill: 4,
  ship: {
    type: 1, // Gnat
    cargo: new Array(10).fill(0),
    weapon: [0, -1, -1],
    shield: [-1, -1, -1],
    shieldStrength: [-1, -1, -1],
    gadget: [-1, -1, -1],
    escapePod: false,
    fuel: ShipTypes[1].fuelTanks,
    hull: ShipTypes[1].hullStrength,
  },

  buyGood: (goodId, amount) => {
    const { credits, ship, buyPrices, systemQuantities, systems, currentSystem } = get();
    const result = executeBuy(goodId, amount, { credits, ship, buyPrices, systemQuantities });
    if (!result) return;

    // Persist depletion back to system
    const newSystems = systems.map((s, idx) =>
      idx === currentSystem ? { ...s, qty: result.systemQuantities } : s,
    );

    set({
      credits: result.credits,
      ship: { ...get().ship, cargo: result.cargo },
      systemQuantities: result.systemQuantities,
      systems: newSystems,
    });
  },

  sellGood: (goodId, amount) => {
    const { credits, ship, sellPrices, systemQuantities, systems, currentSystem } = get();
    const result = executeSell(goodId, amount, { credits, ship, sellPrices, systemQuantities });
    if (!result) return;

    const newSystems = systems.map((s, idx) =>
      idx === currentSystem ? { ...s, qty: result.systemQuantities } : s,
    );

    set({
      credits: result.credits,
      ship: { ...get().ship, cargo: result.cargo },
      systemQuantities: result.systemQuantities,
      systems: newSystems,
    });
  },

  buyShip: (shipTypeId) => {
    const state = get();
    const newType = ShipTypes[shipTypeId];
    const oldType = ShipTypes[state.ship.type];

    let tradeIn = Math.floor((oldType.price * 3) / 4);
    tradeIn -= (oldType.hullStrength - state.ship.hull) * oldType.repairCosts;
    tradeIn -= (oldType.fuelTanks - state.ship.fuel) * oldType.costOfFuel;
    for (const w of state.ship.weapon)
      if (w >= 0) tradeIn += Math.floor((Weapons[w].price * 2) / 3);
    for (const s of state.ship.shield)
      if (s >= 0) tradeIn += Math.floor((Shields[s].price * 2) / 3);
    for (const g of state.ship.gadget)
      if (g >= 0) tradeIn += Math.floor((Gadgets[g].price * 2) / 3);
    tradeIn = Math.max(0, tradeIn);

    const netCost = newType.price - tradeIn;
    if (state.credits < netCost) return;

    const usedCargo = state.ship.cargo.reduce((a, b) => a + b, 0);
    const newCargo = usedCargo <= newType.cargoBays ? [...state.ship.cargo] : new Array(10).fill(0);

    set({
      credits: state.credits - netCost,
      ship: {
        type: shipTypeId,
        cargo: newCargo,
        weapon: [-1, -1, -1],
        shield: [-1, -1, -1],
        shieldStrength: [-1, -1, -1],
        gadget: [-1, -1, -1],
        escapePod: state.ship.escapePod,
        fuel: newType.fuelTanks,
        hull: newType.hullStrength,
      },
    });
  },

  buyWeapon: (weaponId) => {
    const state = get();
    const w = Weapons[weaponId];
    if (state.credits < w.price) return;
    const slots = ShipTypes[state.ship.type].weaponSlots;
    const emptySlot = state.ship.weapon.indexOf(-1);
    if (emptySlot === -1 || emptySlot >= slots) return;
    const newWeapons = [...state.ship.weapon];
    newWeapons[emptySlot] = weaponId;
    set({ credits: state.credits - w.price, ship: { ...state.ship, weapon: newWeapons } });
  },

  buyShield: (shieldId) => {
    const state = get();
    const s = Shields[shieldId];
    if (state.credits < s.price) return;
    const slots = ShipTypes[state.ship.type].shieldSlots;
    const emptySlot = state.ship.shield.indexOf(-1);
    if (emptySlot === -1 || emptySlot >= slots) return;
    const newShields = [...state.ship.shield];
    newShields[emptySlot] = shieldId;
    const newShieldStrength = [...state.ship.shieldStrength];
    newShieldStrength[emptySlot] = s.power;
    set({
      credits: state.credits - s.price,
      ship: { ...state.ship, shield: newShields, shieldStrength: newShieldStrength },
    });
  },

  buyGadget: (gadgetId) => {
    const state = get();
    const g = Gadgets[gadgetId];
    if (state.credits < g.price) return;
    const slots = ShipTypes[state.ship.type].gadgetSlots;
    const emptySlot = state.ship.gadget.indexOf(-1);
    if (emptySlot === -1 || emptySlot >= slots) return;
    const newGadgets = [...state.ship.gadget];
    newGadgets[emptySlot] = gadgetId;
    set({ credits: state.credits - g.price, ship: { ...state.ship, gadget: newGadgets } });
  },

  buyEscapePod: () => {
    const state = get();
    if (state.ship.escapePod || state.credits < ESCAPE_POD_PRICE) return;
    if (state.systems[state.currentSystem].techLevel < ESCAPE_POD_TECH_LEVEL) return;
    set({ credits: state.credits - ESCAPE_POD_PRICE, ship: { ...state.ship, escapePod: true } });
  },

  buyFuel: (units) => {
    const state = get();
    const shipType = ShipTypes[state.ship.type];
    const canBuy = Math.min(units, shipType.fuelTanks - state.ship.fuel);
    if (canBuy <= 0) return;
    const cost = canBuy * shipType.costOfFuel;
    if (state.credits < cost) return;
    set({ credits: state.credits - cost, ship: { ...state.ship, fuel: state.ship.fuel + canBuy } });
  },

  repairHull: () => {
    const state = get();
    const shipType = ShipTypes[state.ship.type];
    const cost = (shipType.hullStrength - state.ship.hull) * shipType.repairCosts;
    if (state.credits >= cost && cost > 0) {
      set({ credits: state.credits - cost, ship: { ...state.ship, hull: shipType.hullStrength } });
    }
  },

  sellEquipment: (slot, index) => {
    const state = get();
    const ship = state.ship;
    let refund = 0;
    if (slot === 'weapon') {
      if (ship.weapon[index] < 0) return;
      refund = Math.floor(Weapons[ship.weapon[index]].price / 2);
      const newSlot = [...ship.weapon];
      newSlot[index] = -1;
      set({ credits: state.credits + refund, ship: { ...ship, weapon: newSlot } });
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
      const newSlot = [...ship.gadget];
      newSlot[index] = -1;
      set({ credits: state.credits + refund, ship: { ...ship, gadget: newSlot } });
    }
  },

  dumpCargo: (goodId, amount) => {
    const state = get();
    const available = state.ship.cargo[goodId];
    if (available <= 0) return;
    const dumpAmount = Math.min(amount, available);
    const dumpCost = dumpAmount * 5 * (state.difficulty + 1);
    if (state.credits < dumpCost) return;
    const newCargo = [...state.ship.cargo];
    newCargo[goodId] -= dumpAmount;
    set({ credits: state.credits - dumpCost, ship: { ...state.ship, cargo: newCargo } });
  },
});
