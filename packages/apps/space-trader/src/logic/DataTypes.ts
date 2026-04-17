export const MAXTRADEITEM = 10;
export const MAXWEAPON = 3;
export const MAXSHIELD = 3;
export const MAXGADGET = 3;
export const MAXCREW = 3;
export const MAXCREWMEMBER = 31;
export const MAXSHIPTYPE = 10;
export const EXTRASHIPS = 5;
export const MAXWEAPONTYPE = 3;
export const EXTRAWEAPONS = 1;
export const MAXSHIELDTYPE = 3;
export const EXTRASHIELDS = 1;
export const MAXGADGETTYPE = 5;
export const EXTRAGADGETS = 1;
export const MAXSOLARSYSTEM = 120;
export const MAXWORMHOLE = 6;
export const MAXDIFFICULTY = 5;

// Added for SystemGenerator.ts
export const MAXTECHLEVEL = 8; // TechLevels.length
export const MAXPOLITICS = 17; // PoliticalSystems.length
export const MAXRESOURCES = 13; // SpecialResources.length
export const MAXSIZE = 4;
export const MAXSTATUS = 8; // Status.length

// Items
export const WATER = 0;
export const FURS = 1;
export const FOOD = 2;
export const ORE = 3;
export const GAMES = 4;
export const FIREARMS = 5;
export const MEDICINE = 6;
export const MACHINES = 7;
export const NARCOTICS = 8;
export const ROBOTS = 9;

// Status
export const UNEVENTFUL = 0;
export const WAR = 1;
export const PLAGUE = 2;
export const DROUGHT = 3;
export const BOREDOM = 4;
export const COLD = 5;
export const CROPFAILURE = 6;
export const LACKOFWORKERS = 7;

// Resources
export const NOSPECIALRESOURCES = 0;
export const MINERALRICH = 1;
export const MINERALPOOR = 2;
export const DESERT = 3;
export const LOTSOFWATER = 4;
export const RICHSOIL = 5;
export const POORSOIL = 6;
export const RICHFAUNA = 7;
export const LIFELESS = 8;
export const WEIRDMUSHROOMS = 9;
export const LOTSOFHERBS = 10;
export const ARTISTIC = 11;
export const WARLIKE = 12;

// Skills
export const PILOTSKILL = 1;
export const FIGHTERSKILL = 2;
export const TRADERSKILL = 3;
export const ENGINEERSKILL = 4;

export const DifficultyLevel = ['Beginner', 'Easy', 'Normal', 'Hard', 'Impossible'];

export const SpecialResources = [
  'Nothing special',
  'Mineral rich',
  'Mineral poor',
  'Desert',
  'Sweetwater oceans',
  'Rich soil',
  'Poor soil',
  'Rich fauna',
  'Lifeless',
  'Weird mushrooms',
  'Special herbs',
  'Artistic populace',
  'Warlike populace',
];

export const Status = [
  'under no particular pressure',
  'at war',
  'ravaged by a plague',
  'suffering from a drought',
  'suffering from extreme boredom',
  'suffering from a cold spell',
  'suffering from a crop failure',
  'lacking enough workers',
];

export interface TradeItem {
  id: number;
  name: string;
  techProduction: number;
  techUsage: number;
  techTopProduction: number;
  priceLowTech: number;
  priceInc: number;
  variance: number;
  doublePriceStatus: number;
  cheapResource: number;
  expensiveResource: number;
  minTradePrice: number;
  maxTradePrice: number;
  roundOff: number;
}

export const TradeItems: TradeItem[] = [
  {
    id: 0,
    name: 'Water',
    techProduction: 0,
    techUsage: 0,
    techTopProduction: 2,
    priceLowTech: 30,
    priceInc: 3,
    variance: 4,
    doublePriceStatus: DROUGHT,
    cheapResource: LOTSOFWATER,
    expensiveResource: DESERT,
    minTradePrice: 30,
    maxTradePrice: 50,
    roundOff: 1,
  },
  {
    id: 1,
    name: 'Furs',
    techProduction: 0,
    techUsage: 0,
    techTopProduction: 0,
    priceLowTech: 250,
    priceInc: 10,
    variance: 10,
    doublePriceStatus: COLD,
    cheapResource: RICHFAUNA,
    expensiveResource: LIFELESS,
    minTradePrice: 230,
    maxTradePrice: 280,
    roundOff: 5,
  },
  {
    id: 2,
    name: 'Food',
    techProduction: 1,
    techUsage: 0,
    techTopProduction: 1,
    priceLowTech: 100,
    priceInc: 5,
    variance: 5,
    doublePriceStatus: CROPFAILURE,
    cheapResource: RICHSOIL,
    expensiveResource: POORSOIL,
    minTradePrice: 90,
    maxTradePrice: 160,
    roundOff: 5,
  },
  {
    id: 3,
    name: 'Ore',
    techProduction: 2,
    techUsage: 2,
    techTopProduction: 3,
    priceLowTech: 350,
    priceInc: 20,
    variance: 10,
    doublePriceStatus: WAR,
    cheapResource: MINERALRICH,
    expensiveResource: MINERALPOOR,
    minTradePrice: 350,
    maxTradePrice: 420,
    roundOff: 10,
  },
  {
    id: 4,
    name: 'Games',
    techProduction: 3,
    techUsage: 1,
    techTopProduction: 6,
    priceLowTech: 250,
    priceInc: -10,
    variance: 5,
    doublePriceStatus: BOREDOM,
    cheapResource: ARTISTIC,
    expensiveResource: -1,
    minTradePrice: 160,
    maxTradePrice: 270,
    roundOff: 5,
  },
  {
    id: 5,
    name: 'Firearms',
    techProduction: 3,
    techUsage: 1,
    techTopProduction: 5,
    priceLowTech: 1250,
    priceInc: -75,
    variance: 100,
    doublePriceStatus: WAR,
    cheapResource: WARLIKE,
    expensiveResource: -1,
    minTradePrice: 600,
    maxTradePrice: 1100,
    roundOff: 25,
  },
  {
    id: 6,
    name: 'Medicine',
    techProduction: 4,
    techUsage: 1,
    techTopProduction: 6,
    priceLowTech: 650,
    priceInc: -20,
    variance: 10,
    doublePriceStatus: PLAGUE,
    cheapResource: LOTSOFHERBS,
    expensiveResource: -1,
    minTradePrice: 400,
    maxTradePrice: 700,
    roundOff: 25,
  },
  {
    id: 7,
    name: 'Machines',
    techProduction: 4,
    techUsage: 3,
    techTopProduction: 5,
    priceLowTech: 900,
    priceInc: -30,
    variance: 5,
    doublePriceStatus: LACKOFWORKERS,
    cheapResource: -1,
    expensiveResource: -1,
    minTradePrice: 600,
    maxTradePrice: 800,
    roundOff: 25,
  },
  {
    id: 8,
    name: 'Narcotics',
    techProduction: 5,
    techUsage: 0,
    techTopProduction: 5,
    priceLowTech: 3500,
    priceInc: -125,
    variance: 150,
    doublePriceStatus: BOREDOM,
    cheapResource: WEIRDMUSHROOMS,
    expensiveResource: -1,
    minTradePrice: 2000,
    maxTradePrice: 3000,
    roundOff: 50,
  },
  {
    id: 9,
    name: 'Robots',
    techProduction: 6,
    techUsage: 4,
    techTopProduction: 7,
    priceLowTech: 5000,
    priceInc: -150,
    variance: 100,
    doublePriceStatus: LACKOFWORKERS,
    cheapResource: -1,
    expensiveResource: -1,
    minTradePrice: 3500,
    maxTradePrice: 5000,
    roundOff: 100,
  },
];

export interface ShipType {
  id: number;
  name: string;
  cargoBays: number;
  weaponSlots: number;
  shieldSlots: number;
  gadgetSlots: number;
  crewQuarters: number;
  fuelTanks: number;
  minTechLevel: number;
  costOfFuel: number;
  price: number;
  bounty: number;
  occurrence: number;
  hullStrength: number;
  police: number;
  pirates: number;
  traders: number;
  repairCosts: number;
  size: number;
}

export const ShipTypes: ShipType[] = [
  {
    id: 0,
    name: 'Flea',
    cargoBays: 10,
    weaponSlots: 0,
    shieldSlots: 0,
    gadgetSlots: 0,
    crewQuarters: 1,
    fuelTanks: 20,
    minTechLevel: 4,
    costOfFuel: 1,
    price: 2000,
    bounty: 5,
    occurrence: 2,
    hullStrength: 25,
    police: -1,
    pirates: -1,
    traders: 0,
    repairCosts: 1,
    size: 0,
  },
  {
    id: 1,
    name: 'Gnat',
    cargoBays: 15,
    weaponSlots: 1,
    shieldSlots: 0,
    gadgetSlots: 1,
    crewQuarters: 1,
    fuelTanks: 14,
    minTechLevel: 5,
    costOfFuel: 2,
    price: 10000,
    bounty: 50,
    occurrence: 28,
    hullStrength: 100,
    police: 0,
    pirates: 0,
    traders: 0,
    repairCosts: 1,
    size: 1,
  },
  {
    id: 2,
    name: 'Firefly',
    cargoBays: 20,
    weaponSlots: 1,
    shieldSlots: 1,
    gadgetSlots: 1,
    crewQuarters: 1,
    fuelTanks: 17,
    minTechLevel: 5,
    costOfFuel: 3,
    price: 25000,
    bounty: 75,
    occurrence: 20,
    hullStrength: 100,
    police: 0,
    pirates: 0,
    traders: 0,
    repairCosts: 1,
    size: 1,
  },
  {
    id: 3,
    name: 'Mosquito',
    cargoBays: 15,
    weaponSlots: 2,
    shieldSlots: 1,
    gadgetSlots: 1,
    crewQuarters: 1,
    fuelTanks: 13,
    minTechLevel: 5,
    costOfFuel: 5,
    price: 30000,
    bounty: 100,
    occurrence: 20,
    hullStrength: 100,
    police: 0,
    pirates: 1,
    traders: 0,
    repairCosts: 1,
    size: 1,
  },
  {
    id: 4,
    name: 'Bumblebee',
    cargoBays: 25,
    weaponSlots: 1,
    shieldSlots: 2,
    gadgetSlots: 2,
    crewQuarters: 2,
    fuelTanks: 15,
    minTechLevel: 5,
    costOfFuel: 7,
    price: 60000,
    bounty: 125,
    occurrence: 15,
    hullStrength: 100,
    police: 1,
    pirates: 1,
    traders: 0,
    repairCosts: 1,
    size: 2,
  },
  {
    id: 5,
    name: 'Beetle',
    cargoBays: 50,
    weaponSlots: 0,
    shieldSlots: 1,
    gadgetSlots: 1,
    crewQuarters: 3,
    fuelTanks: 14,
    minTechLevel: 5,
    costOfFuel: 10,
    price: 80000,
    bounty: 50,
    occurrence: 3,
    hullStrength: 50,
    police: -1,
    pirates: -1,
    traders: 0,
    repairCosts: 1,
    size: 2,
  },
  {
    id: 6,
    name: 'Hornet',
    cargoBays: 20,
    weaponSlots: 3,
    shieldSlots: 2,
    gadgetSlots: 1,
    crewQuarters: 2,
    fuelTanks: 16,
    minTechLevel: 6,
    costOfFuel: 15,
    price: 100000,
    bounty: 200,
    occurrence: 6,
    hullStrength: 150,
    police: 2,
    pirates: 3,
    traders: 1,
    repairCosts: 2,
    size: 3,
  },
  {
    id: 7,
    name: 'Grasshopper',
    cargoBays: 30,
    weaponSlots: 2,
    shieldSlots: 2,
    gadgetSlots: 3,
    crewQuarters: 3,
    fuelTanks: 15,
    minTechLevel: 6,
    costOfFuel: 15,
    price: 150000,
    bounty: 300,
    occurrence: 2,
    hullStrength: 150,
    police: 3,
    pirates: 4,
    traders: 2,
    repairCosts: 3,
    size: 3,
  },
  {
    id: 8,
    name: 'Termite',
    cargoBays: 60,
    weaponSlots: 1,
    shieldSlots: 3,
    gadgetSlots: 2,
    crewQuarters: 3,
    fuelTanks: 13,
    minTechLevel: 7,
    costOfFuel: 20,
    price: 225000,
    bounty: 300,
    occurrence: 2,
    hullStrength: 200,
    police: 4,
    pirates: 5,
    traders: 3,
    repairCosts: 4,
    size: 4,
  },
  {
    id: 9,
    name: 'Wasp',
    cargoBays: 35,
    weaponSlots: 3,
    shieldSlots: 2,
    gadgetSlots: 2,
    crewQuarters: 3,
    fuelTanks: 14,
    minTechLevel: 7,
    costOfFuel: 20,
    price: 300000,
    bounty: 500,
    occurrence: 2,
    hullStrength: 200,
    police: 5,
    pirates: 6,
    traders: 4,
    repairCosts: 5,
    size: 4,
  },
];

export interface Weapon {
  id: number;
  name: string;
  power: number;
  price: number;
  techLevel: number;
  chance: number;
}
export const Weapons: Weapon[] = [
  { id: 0, name: 'Pulse laser', power: 15, price: 2000, techLevel: 5, chance: 50 },
  { id: 1, name: 'Beam laser', power: 25, price: 12500, techLevel: 6, chance: 35 },
  { id: 2, name: 'Military laser', power: 35, price: 35000, techLevel: 7, chance: 15 },
];

export interface Shield {
  id: number;
  name: string;
  power: number;
  price: number;
  techLevel: number;
  chance: number;
}
export const Shields: Shield[] = [
  { id: 0, name: 'Energy shield', power: 100, price: 5000, techLevel: 5, chance: 70 },
  { id: 1, name: 'Reflective shield', power: 200, price: 20000, techLevel: 6, chance: 30 },
  { id: 2, name: 'Lightning shield', power: 350, price: 45000, techLevel: 8, chance: 15 },
];

export interface Gadget {
  id: number;
  name: string;
  price: number;
  techLevel: number;
  chance: number;
}
export const Gadgets: Gadget[] = [
  { id: 0, name: '5 extra cargo bays', price: 2500, techLevel: 4, chance: 35 },
  { id: 1, name: 'Auto-repair system', price: 7500, techLevel: 5, chance: 20 },
  { id: 2, name: 'Navigating system', price: 15000, techLevel: 6, chance: 20 },
  { id: 3, name: 'Targeting system', price: 25000, techLevel: 6, chance: 20 },
  { id: 4, name: 'Cloaking device', price: 100000, techLevel: 7, chance: 5 },
];

// Escape pod is a separate personal item, not a gadget slot (matches original spacetrader.h)
export const ESCAPE_POD_PRICE = 5000;
export const ESCAPE_POD_TECH_LEVEL = 5;

export interface Politics {
  id: number;
  name: string;
  reactionIllegal: number;
  strengthPolice: number;
  strengthPirates: number;
  strengthTraders: number;
  minTechLevel: number;
  maxTechLevel: number;
  bribeLevel: number;
  drugsOk: boolean;
  firearmsOk: boolean;
  wanted: number;
}
export const PoliticalSystems: Politics[] = [
  {
    id: 0,
    name: 'Anarchy',
    reactionIllegal: 0,
    strengthPolice: 0,
    strengthPirates: 7,
    strengthTraders: 1,
    minTechLevel: 0,
    maxTechLevel: 5,
    bribeLevel: 7,
    drugsOk: true,
    firearmsOk: true,
    wanted: 2,
  }, // Food
  {
    id: 1,
    name: 'Capitalist State',
    reactionIllegal: 2,
    strengthPolice: 3,
    strengthPirates: 2,
    strengthTraders: 7,
    minTechLevel: 4,
    maxTechLevel: 7,
    bribeLevel: 1,
    drugsOk: true,
    firearmsOk: true,
    wanted: 3,
  }, // Ore
  {
    id: 2,
    name: 'Communist State',
    reactionIllegal: 6,
    strengthPolice: 6,
    strengthPirates: 4,
    strengthTraders: 4,
    minTechLevel: 1,
    maxTechLevel: 5,
    bribeLevel: 5,
    drugsOk: true,
    firearmsOk: true,
    wanted: -1,
  },
  {
    id: 3,
    name: 'Confederacy',
    reactionIllegal: 5,
    strengthPolice: 4,
    strengthPirates: 3,
    strengthTraders: 5,
    minTechLevel: 1,
    maxTechLevel: 6,
    bribeLevel: 3,
    drugsOk: true,
    firearmsOk: true,
    wanted: 4,
  }, // Games
  {
    id: 4,
    name: 'Corporate State',
    reactionIllegal: 2,
    strengthPolice: 6,
    strengthPirates: 2,
    strengthTraders: 7,
    minTechLevel: 4,
    maxTechLevel: 7,
    bribeLevel: 2,
    drugsOk: true,
    firearmsOk: true,
    wanted: 9,
  }, // Robots
  {
    id: 5,
    name: 'Cybernetic State',
    reactionIllegal: 0,
    strengthPolice: 7,
    strengthPirates: 7,
    strengthTraders: 5,
    minTechLevel: 6,
    maxTechLevel: 7,
    bribeLevel: 0,
    drugsOk: false,
    firearmsOk: false,
    wanted: 3,
  }, // Ore
  {
    id: 6,
    name: 'Democracy',
    reactionIllegal: 4,
    strengthPolice: 3,
    strengthPirates: 2,
    strengthTraders: 5,
    minTechLevel: 3,
    maxTechLevel: 7,
    bribeLevel: 2,
    drugsOk: true,
    firearmsOk: true,
    wanted: 4,
  }, // Games
  {
    id: 7,
    name: 'Dictatorship',
    reactionIllegal: 3,
    strengthPolice: 4,
    strengthPirates: 5,
    strengthTraders: 3,
    minTechLevel: 0,
    maxTechLevel: 7,
    bribeLevel: 2,
    drugsOk: true,
    firearmsOk: true,
    wanted: -1,
  },
  {
    id: 8,
    name: 'Fascist State',
    reactionIllegal: 7,
    strengthPolice: 7,
    strengthPirates: 7,
    strengthTraders: 1,
    minTechLevel: 4,
    maxTechLevel: 7,
    bribeLevel: 0,
    drugsOk: false,
    firearmsOk: true,
    wanted: 7,
  }, // Machinery
  {
    id: 9,
    name: 'Feudal State',
    reactionIllegal: 1,
    strengthPolice: 1,
    strengthPirates: 6,
    strengthTraders: 2,
    minTechLevel: 0,
    maxTechLevel: 3,
    bribeLevel: 6,
    drugsOk: true,
    firearmsOk: true,
    wanted: 5,
  }, // Firearms
  {
    id: 10,
    name: 'Military State',
    reactionIllegal: 7,
    strengthPolice: 7,
    strengthPirates: 0,
    strengthTraders: 6,
    minTechLevel: 2,
    maxTechLevel: 7,
    bribeLevel: 0,
    drugsOk: false,
    firearmsOk: true,
    wanted: 9,
  }, // Robots
  {
    id: 11,
    name: 'Monarchy',
    reactionIllegal: 3,
    strengthPolice: 4,
    strengthPirates: 3,
    strengthTraders: 4,
    minTechLevel: 0,
    maxTechLevel: 5,
    bribeLevel: 4,
    drugsOk: true,
    firearmsOk: true,
    wanted: 6,
  }, // Medicine
  {
    id: 12,
    name: 'Pacifist State',
    reactionIllegal: 7,
    strengthPolice: 2,
    strengthPirates: 1,
    strengthTraders: 5,
    minTechLevel: 0,
    maxTechLevel: 3,
    bribeLevel: 1,
    drugsOk: true,
    firearmsOk: false,
    wanted: -1,
  },
  {
    id: 13,
    name: 'Socialist State',
    reactionIllegal: 4,
    strengthPolice: 2,
    strengthPirates: 5,
    strengthTraders: 3,
    minTechLevel: 0,
    maxTechLevel: 5,
    bribeLevel: 6,
    drugsOk: true,
    firearmsOk: true,
    wanted: -1,
  },
  {
    id: 14,
    name: 'State of Satori',
    reactionIllegal: 0,
    strengthPolice: 1,
    strengthPirates: 1,
    strengthTraders: 1,
    minTechLevel: 0,
    maxTechLevel: 1,
    bribeLevel: 0,
    drugsOk: false,
    firearmsOk: false,
    wanted: -1,
  },
  {
    id: 15,
    name: 'Technocracy',
    reactionIllegal: 1,
    strengthPolice: 6,
    strengthPirates: 3,
    strengthTraders: 6,
    minTechLevel: 4,
    maxTechLevel: 7,
    bribeLevel: 2,
    drugsOk: true,
    firearmsOk: true,
    wanted: 0,
  }, // Water
  {
    id: 16,
    name: 'Theocracy',
    reactionIllegal: 5,
    strengthPolice: 6,
    strengthPirates: 1,
    strengthTraders: 4,
    minTechLevel: 0,
    maxTechLevel: 4,
    bribeLevel: 0,
    drugsOk: true,
    firearmsOk: true,
    wanted: 8,
  }, // Narcotics
];

export const TechLevels = [
  'Pre-agricultural',
  'Agricultural',
  'Medieval',
  'Renaissance',
  'Early Industrial',
  'Industrial',
  'Post-industrial',
  'Hi-tech',
];

export const SystemNames = [
  'Acamar',
  'Adahn',
  'Aldea',
  'Andevian',
  'Antedi',
  'Balosnee',
  'Baratas',
  'Brax',
  'Bretel',
  'Calondia',
  'Campor',
  'Capelle',
  'Carzon',
  'Castor',
  'Cestus',
  'Cheron',
  'Courteney',
  'Daled',
  'Damast',
  'Davlos',
  'Deneb',
  'Deneva',
  'Devidia',
  'Draylon',
  'Drema',
  'Endor',
  'Esmee',
  'Exo',
  'Ferris',
  'Festen',
  'Fourmi',
  'Frolix',
  'Gemulon',
  'Guinifer',
  'Hades',
  'Hamlet',
  'Helena',
  'Hulst',
  'Iodine',
  'Iralius',
  'Janus',
  'Japori',
  'Jarada',
  'Jason',
  'Kaylon',
  'Khefka',
  'Kira',
  'Klaatu',
  'Klaestron',
  'Korma',
  'Kravat',
  'Krios',
  'Laertes',
  'Largo',
  'Lave',
  'Ligon',
  'Lowry',
  'Magrat',
  'Malcoria',
  'Melina',
  'Mentar',
  'Merik',
  'Mintaka',
  'Montor',
  'Mordan',
  'Myrthe',
  'Nelvana',
  'Nix',
  'Nyle',
  'Odet',
  'Og',
  'Omega',
  'Omphalos',
  'Orias',
  'Othello',
  'Parade',
  'Penthara',
  'Picard',
  'Pollux',
  'Quator',
  'Rakhar',
  'Ran',
  'Regulas',
  'Relva',
  'Rhymus',
  'Rochani',
  'Rubicum',
  'Rutia',
  'Sarpeidon',
  'Sefalla',
  'Seltrice',
  'Sigma',
  'Sol',
  'Somari',
  'Stakoron',
  'Styris',
  'Talani',
  'Tamus',
  'Tantalos',
  'Tanuga',
  'Tarchannen',
  'Terosa',
  'Thera',
  'Titan',
  'Torin',
  'Triacus',
  'Turkana',
  'Tyrus',
  'Umberlee',
  'Utopia',
  'Vadera',
  'Vagra',
  'Vandor',
  'Ventax',
  'Xenon',
  'Xerxes',
  'Yew',
  'Yojimbo',
  'Zalkon',
  'Zuul',
];

export interface SolarSystem {
  nameIndex: number;
  techLevel: number;
  politics: number;
  status: number;
  x: number;
  y: number;
  specialResources: number;
  size: number;
  visited: boolean;
  // Persistent market quantities — initialized at galaxy creation, depleted by trading
  qty?: number[];
  // Wormhole destination system index (-1 if not a wormhole system)
  wormholeDest?: number;
  // Special event ID (-1 = none). Set during galaxy generation, cleared on event trigger.
  special: number;
  // Countdown timer for time-sensitive events (0 = not active)
  countDown: number;
}

export interface PlayerShip {
  type: number;
  cargo: number[]; // 10 indexes
  weapon: number[]; // 3 indexes (-1 if empty), stores weapon type ID
  shield: number[]; // 3 indexes (-1 if empty), stores shield type ID
  shieldStrength: number[]; // current health per shield slot (max = Shields[shield[i]].power)
  gadget: number[]; // 3 indexes (-1 if empty)
  escapePod: boolean; // separate flag, not a gadget slot (matches original spacetrader.h)
  fuel: number;
  hull: number;
}

export interface NPCEncounterData {
  ship: PlayerShip;
  fighterSkill: number;
  pilotSkill: number;
  engineerSkill: number;
  bounty: number;
  lootCargo: number[];
}

// What the NPC is doing in this encounter (matches OG sub-states)
export type EncounterAction =
  | 'ATTACK' // NPC attacking player (pirates, police vs criminals, bosses)
  | 'INSPECT' // Police want to inspect cargo (clean record)
  | 'FLEE_NPC' // NPC is fleeing from player (weak NPC or losing)
  | 'TRADE_OFFER' // Trader offering goods
  | 'IGNORE'; // NPC passing by

export interface ActiveEncounter {
  type: string;
  npc: NPCEncounterData;
  log: string[];
  round: number;
  resolved: boolean;
  playerWon: boolean;
  clickNumber: number;
  destinationSystemIdx: number;
  encounterAction: EncounterAction;
}

export interface SaveGameType {
  credits: number;
  debt: number;
  days: number;
  policeRecordScore: number;
  reputationScore: number;
  currentSystem: number;
  nameCommander: string;
  pilotSkill: number;
  fighterSkill: number;
  traderSkill: number;
  engineerSkill: number;
  ship: PlayerShip;
  systems: SolarSystem[];
}

export const ReputationTitles = [
  'Harmless',
  'Mostly Harmless',
  'Poor',
  'Average',
  'Above Average',
  'Competent',
  'Dangerous',
  'Deadly',
  'Elite',
];

export const PoliceRecordTitles = [
  'Psychopath',
  'Villain',
  'Criminal',
  'Overlord',
  'Can be bribed',
  'Clean',
  'Lawful',
  'Trusted',
  'Helper',
  'Hero',
];

export type ViewType =
  | 'trade'
  | 'system'
  | 'ship'
  | 'map'
  | 'target'
  | 'pricelist'
  | 'shipyard'
  | 'equipment'
  | 'newgame'
  | 'buyShip'
  | 'shipInfo'
  | 'options'
  | 'options2'
  | 'specialEvent'
  | 'quests'
  | 'bank'
  | 'news';
