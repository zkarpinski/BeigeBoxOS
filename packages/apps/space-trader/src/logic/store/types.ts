import { PlayerShip, SolarSystem, ActiveEncounter, ViewType } from '../DataTypes';

export type AppView = ViewType | 'gameOver';

export interface PlayerSlice {
  credits: number;
  debt: number;
  policeRecordScore: number;
  reputationScore: number;
  killsPirate: number;
  killsPolice: number;
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
  pendingEncounters: ActiveEncounter[];
  isGameOver: boolean;

  clearEncounter: () => void;
  attackInEncounter: () => void;
  fleeFromEncounter: () => void;
  surrenderToEncounter: () => void;
  bribePolice: () => void;
  lootNPC: () => void;
  tradeWithNPC: () => void;
  letNPCGo: () => void;
  ignoreEncounter: () => void;
}

export interface GameSlice {
  difficulty: number;
  tradeMode: 'buy' | 'sell' | 'price-list';
  activeView: AppView;
  viewingShipId: number | null;
  selectedMapSystemId: number | null;
  isAiEnabled: boolean;
  setTradeMode: (mode: 'buy' | 'sell' | 'price-list') => void;
  setActiveView: (view: AppView) => void;
  setViewingShipId: (id: number | null) => void;
  setSelectedMapSystem: (id: number | null) => void;
  toggleAi: () => void;
  restartGame: () => void;
}

export interface OptionsSlice {
  optAutoFuel: boolean;
  optAutoRepair: boolean;
  optIgnorePolice: boolean;
  optIgnorePirates: boolean;
  optIgnoreTraders: boolean;
  optIgnoreDealingTraders: boolean;
  optReserveMoney: boolean;
  optChartToInfo: boolean;
  optContinuousFight: boolean;
  optAttackFleeing: boolean;
  reserveBays: number;
  // Page 2 options
  optPayForNewspaper: boolean;
  optShowRangeToTracked: boolean;
  optStopTrackingOnArrival: boolean;
  optTextualEncounters: boolean;
  optRemindAboutLoans: boolean;
  setOption: (key: string, value: boolean | number) => void;
}

export interface BankSlice {
  borrowCredits: (amount: number) => void;
  repayDebt: (amount: number) => void;
}

export interface QuestSlice {
  // Multi-step quest progress (0 = not started, increments through stages)
  monsterStatus: number;
  dragonflyStatus: number;
  japoriStatus: number;
  reactorStatus: number;
  jarekStatus: number;
  wildStatus: number;
  artifactStatus: number;
  scarabStatus: number;
  invasionStatus: number;
  experimentStatus: number;
  moonBought: boolean;

  // Special cargo flags
  jarekOnBoard: boolean;
  wildOnBoard: boolean;
  reactorOnBoard: boolean;
  artifactOnBoard: boolean;
  antidoteOnBoard: boolean;

  // Actions
  triggerSpecialEvent: (systemIdx: number) => void;
  handleQuestEncounterVictory: (encounterType: string) => void;
}

export type SpaceTraderState = PlayerSlice &
  UniverseSlice &
  EncounterSlice &
  GameSlice &
  OptionsSlice &
  BankSlice &
  QuestSlice;
