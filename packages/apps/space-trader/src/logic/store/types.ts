import { PlayerShip, SolarSystem, ActiveEncounter } from '../DataTypes';

export interface PlayerSlice {
  credits: number;
  debt: number;
  policeRecordScore: number;
  reputationScore: number;
  nameCommander: string;
  pilotSkill: number;
  fighterSkill: number;
  traderSkill: number;
  engineerSkill: number;
  ship: PlayerShip;

  buyGood: (goodId: number, amount: number) => void;
  sellGood: (goodId: number, amount: number) => void;
  buyShip: (shipTypeId: number) => void;
  buyWeapon: (weaponId: number) => void;
  buyShield: (shieldId: number) => void;
  buyGadget: (gadgetId: number) => void;
  buyEscapePod: () => void;
  buyFuel: (units: number) => void;
  repairHull: () => void;
  sellEquipment: (slot: 'weapon' | 'shield' | 'gadget', index: number) => void;
  dumpCargo: (goodId: number, amount: number) => void;
}

export interface UniverseSlice {
  systems: SolarSystem[];
  currentSystem: number;
  buyPrices: number[];
  sellPrices: number[];
  systemQuantities: number[];
  days: number;

  startNewGame: (
    name: string,
    diff: number,
    skills: { pilot: number; fighter: number; trader: number; engineer: number },
  ) => void;
  travelTo: (systemId: number) => void;
}

export interface EncounterSlice {
  encounter: ActiveEncounter | null;
  isGameOver: boolean;

  clearEncounter: () => void;
  attackInEncounter: () => void;
  fleeFromEncounter: () => void;
  surrenderToEncounter: () => void;
  bribePolice: () => void;
  lootNPC: () => void;
}

export interface GameSlice {
  difficulty: number;
  tradeMode: 'buy' | 'sell' | 'price-list';
  viewingShipId: number | null;
  setTradeMode: (mode: 'buy' | 'sell' | 'price-list') => void;
  setViewingShipId: (id: number | null) => void;
  restartGame: () => void;
}

export type SpaceTraderState = PlayerSlice & UniverseSlice & EncounterSlice & GameSlice;
