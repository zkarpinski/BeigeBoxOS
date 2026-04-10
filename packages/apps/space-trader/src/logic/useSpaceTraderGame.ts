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
} from './DataTypes';
import { generateGalaxy } from './SystemGenerator';
import { determineSystemPrices, generateSystemQuantities } from './Merchant';

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
  encounter: any | null; // Placeholder for encounter data
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
  clearEncounter: () => void;
  takeDamage: (amount: number) => void;
  repairHull: () => void;
  restartGame: () => void;
  setTradeMode: (mode: 'buy' | 'sell' | 'price-list') => void;
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
        gadget: [-1, -1, -1],
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
        const { systems } = generateGalaxy();

        // Start at some system, usually system 0? Wait, the C actually picks random wormhole.
        // In Traveler.c, StartNewGame: WarpSystem = GetRandom(MAXWORMHOLE)
        // We will just pick system 0
        const startSystem = 0;

        const initialShip: PlayerShip = {
          type: 1, // Gnat
          cargo: new Array(10).fill(0),
          weapon: [0, -1, -1],
          shield: [-1, -1, -1],
          gadget: [-1, -1, -1],
          fuel: ShipTypes[1].fuelTanks,
          hull: ShipTypes[1].hullStrength,
        };

        const sys = systems[startSystem];
        const { buyPrices, sellPrices } = determineSystemPrices(sys, 4, 0); // 4 trader skill
        const systemQuantities = generateSystemQuantities(sys, diff);

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

        // Simple Euclidean distance
        const dist = Math.sqrt(
          Math.pow(target.x - current.x, 2) + Math.pow(target.y - current.y, 2),
        );
        const fuelCost = Math.floor(dist);

        if (state.ship.fuel < fuelCost) return;

        target.visited = true;

        const { buyPrices, sellPrices } = determineSystemPrices(
          target,
          state.traderSkill,
          state.policeRecordScore,
        );
        const systemQuantities = generateSystemQuantities(target, state.difficulty);

        // Random encounter trigger (15% chance)
        const encounterTriggered = Math.random() < 0.15;
        const encounter = encounterTriggered
          ? {
              type: Math.random() > 0.5 ? 'Police' : 'Pirate',
              id: Math.floor(Math.random() * 1000),
            }
          : null;

        set({
          currentSystem: systemId,
          days: state.days + 1,
          ship: { ...state.ship, fuel: state.ship.fuel - fuelCost },
          buyPrices,
          sellPrices,
          systemQuantities,
          systems: state.systems.map((s, idx) => {
            // 10% chance for any system to clear status
            if (s.status !== UNEVENTFUL && Math.random() < 0.1) {
              return { ...s, status: UNEVENTFUL };
            }
            // 5% chance for a random system to get a random status
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

        const newSystems = [...state.systems];
        const newQuantities = [...state.systemQuantities];
        newQuantities[goodId] -= finalAmount;

        set({
          credits: state.credits - finalAmount * price,
          ship: { ...state.ship, cargo: newCargo },
          systemQuantities: newQuantities,
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

        set({
          credits: state.credits + finalAmount * price,
          ship: { ...state.ship, cargo: newCargo },
          systemQuantities: newQuantities,
        });
      },

      buyShip: (shipTypeId: number) => {
        const state = get();
        const newType = ShipTypes[shipTypeId];
        if (state.credits < newType.price) return;

        // Trade-in logic is missing, but simple buy for now
        set({
          credits: state.credits - newType.price,
          ship: {
            ...state.ship,
            type: shipTypeId,
            fuel: newType.fuelTanks,
            hull: newType.hullStrength,
            // Cargo/items usually transfer if they fit
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

        set({
          credits: state.credits - s.price,
          ship: { ...state.ship, shield: newShields },
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

      clearEncounter: () => set({ encounter: null }),

      takeDamage: (amount: number) => {
        const state = get();
        const newHull = Math.max(0, state.ship.hull - amount);

        if (newHull <= 0) {
          const hasEscapePod = state.ship.gadget.includes(5); // Escape pod ID is 5
          if (hasEscapePod) {
            // Lose ship, cargo, weapons, gadgets, but survive
            set({
              ship: {
                type: 0, // Back to Flea
                cargo: new Array(10).fill(0),
                weapon: [-1, -1, -1],
                shield: [-1, -1, -1],
                gadget: [-1, -1, -1],
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
        window.location.reload();
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
                'clearEncounter',
              ].includes(key),
          ),
        ) as any,
    },
  ),
);
