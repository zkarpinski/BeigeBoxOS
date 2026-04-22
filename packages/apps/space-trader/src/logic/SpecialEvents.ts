/**
 * Special Event IDs — matches original PalmOS Space Trader numbering where possible.
 * These are stored in SolarSystem.special to indicate which event is available.
 */

// Dragonfly chain (destination/intermediate events)
export const DRAGONFLYDESTROYED = 0;
export const FLYBARATAS = 1;
export const FLYMELINA = 2;
export const FLYREGULAS = 3;

// Monster chain
export const MONSTERKILLED = 4;

// Japori chain
export const MEDICINEDELIVERY = 5;

// Moon / Win
export const MOONBOUGHT = 6;
export const MOONFORSALE = 7;

// One-offs
export const SKILLINCREASE = 8;
export const ERASERECORD = 9;
export const CARGOFORSALE = 10;
export const LOTTERYWINNER = 11;

// Quest starters
export const SPACEMONSTER = 12;
export const DRAGONFLY = 13;

// Dragonfly reward
export const INSTALLLIGHTNINGSHIELD = 15;

// Japori starter
export const JAPORIDISEASE = 16;

// Artifact chain
export const ARTIFACTDELIVERY = 18;
export const ALIENARTIFACT = 19;

// Gemulon chain
export const INSTALLFUELCOMPACTOR = 20;
export const ALIENINVASION = 21;
export const GEMULONINVADED = 22;

// Scarab chain
export const SCARAB = 23;
export const GETHULLUPGRADED = 24;

// Reactor chain
export const GETREACTOR = 26;
export const JAREK = 27;
export const WILD = 28;
export const SCARABDESTROYED = 30;
export const REACTORDELIVERED = 31;
export const JAREKGETSOUT = 32;
export const GEMULONRESCUED = 33;
export const EXPERIMENTSTOPPED = 34;
export const ERASERECORDFIXED = 35; // alias
export const WILDGETSOUT = 36;

// Experiment chain
export const EXPERIMENT = 37;
export const EXPERIMENTFAILED = 38;

// Reactor laser reward
export const GETSPECIALLASER = 39;

// Fixed system indexes (must match SystemGenerator.ts)
export const ACAMARSYSTEM = 0;
export const BARATASSYSTEM = 6;
export const DALEDSYSTEM = 17;
export const DEVIDIASYSTEM = 22;
export const GEMULONSYSTEM = 32;
export const JAPORISYSTEM = 41;
export const KRAVATSYSTEM = 50;
export const MELINASYSTEM = 59;
export const NIXSYSTEM = 67;
export const REGULASSYSTEM = 82;
export const SOLSYSTEM = 92;
export const UTOPIASYSTEM = 109;
export const ZALKONSYSTEM = 118;

export interface SpecialEventDef {
  id: number;
  title: string;
  description: string;
  price: number; // 0 = free, positive = player pays, negative = player receives
  justAMessage: boolean; // true = OK button only, false = Yes/No buttons
}

export const SpecialEvents: Record<number, SpecialEventDef> = {
  // === SPACE MONSTER CHAIN ===
  [SPACEMONSTER]: {
    id: SPACEMONSTER,
    title: 'Space Monster',
    description:
      'A huge space monster has been terrorizing the space lanes near Acamar. The monster is extremely dangerous. Do you wish to hunt it down?',
    price: 0,
    justAMessage: false,
  },
  [MONSTERKILLED]: {
    id: MONSTERKILLED,
    title: 'Monster Killed',
    description:
      'Congratulations! You have destroyed the space monster that terrorized the spacelanes. As a reward, you receive a bounty of 15,000 credits.',
    price: 0,
    justAMessage: true,
  },

  // === DRAGONFLY CHAIN ===
  [DRAGONFLY]: {
    id: DRAGONFLY,
    title: 'Dragonfly',
    description:
      'This is a very dangerous, illegal, parsing ship which is\"wanted\" dead or alive. It has been recently seen in the Baratas system. Are you willing to hunt it down?',
    price: 0,
    justAMessage: false,
  },
  [FLYBARATAS]: {
    id: FLYBARATAS,
    title: 'Dragonfly Spotted',
    description:
      'The Dragonfly has been spotted at Baratas. It seems to have gone to the Melina system.',
    price: 0,
    justAMessage: true,
  },
  [FLYMELINA]: {
    id: FLYMELINA,
    title: 'Dragonfly Spotted',
    description:
      'The Dragonfly has been spotted at Melina. It seems to have gone to the Regulas system.',
    price: 0,
    justAMessage: true,
  },
  [FLYREGULAS]: {
    id: FLYREGULAS,
    title: 'Dragonfly Spotted',
    description:
      'The Dragonfly has been spotted at Regulas. It seems to have gone to the Zalkon system. Beware — it will probably attack you when you arrive!',
    price: 0,
    justAMessage: true,
  },
  [DRAGONFLYDESTROYED]: {
    id: DRAGONFLYDESTROYED,
    title: 'Dragonfly Destroyed',
    description:
      'Congratulations! You have destroyed the Dragonfly. As a reward, you are offered a special Lightning Shield.',
    price: 0,
    justAMessage: true,
  },
  [INSTALLLIGHTNINGSHIELD]: {
    id: INSTALLLIGHTNINGSHIELD,
    title: 'Lightning Shield',
    description:
      'A Lightning Shield has been installed on your ship. This shield is more powerful than any shield you can buy.',
    price: 0,
    justAMessage: true,
  },

  // === JAPORI DISEASE CHAIN ===
  [JAPORIDISEASE]: {
    id: JAPORIDISEASE,
    title: 'Japori Disease',
    description:
      'A strange disease has swept across Japori, and the people are dying. A cure exists, but it requires 10 cargo bays of special antidote. Will you deliver it?',
    price: 0,
    justAMessage: false,
  },
  [MEDICINEDELIVERY]: {
    id: MEDICINEDELIVERY,
    title: 'Medicine Delivery',
    description:
      'Thank you for delivering the medicine to Japori! As a reward, an alien fast-learning machine increases all your skills by 1 point.',
    price: 0,
    justAMessage: true,
  },

  // === MORGAN'S REACTOR CHAIN ===
  [GETREACTOR]: {
    id: GETREACTOR,
    title: "Morgan's Reactor",
    description:
      'A """""""""""decommissioned""""""""""" experimental nuclear reactor is available. It"s unstable, takes up 5 cargo bays, and may leak radiation. Henry Morgan at Nix will pay handsomely for it. Will you take it?',
    price: 0,
    justAMessage: false,
  },
  [REACTORDELIVERED]: {
    id: REACTORDELIVERED,
    title: 'Reactor Delivered',
    description:
      "Henry Morgan thanks you for delivering the reactor. As a reward, he''ll install a special laser on your ship. Come back when you have a free weapon slot.",
    price: 0,
    justAMessage: true,
  },
  [GETSPECIALLASER]: {
    id: GETSPECIALLASER,
    title: "Morgan's Laser",
    description:
      'Henry Morgan has installed a powerful "Morgan\'s Laser" on your ship. It is more powerful than a military laser!',
    price: 0,
    justAMessage: true,
  },

  // === AMBASSADOR JAREK ===
  [JAREK]: {
    id: JAREK,
    title: 'Ambassador Jarek',
    description:
      'A recent change in the political climate has forced Ambassador Jarek to flee. He seeks passage to Devidia. Will you give him a lift?',
    price: 0,
    justAMessage: false,
  },
  [JAREKGETSOUT]: {
    id: JAREKGETSOUT,
    title: 'Jarek Delivered',
    description:
      'Ambassador Jarek thanks you for the ride to Devidia. As a reward, he gives you an experimental haggling computer worth 3,000 credits.',
    price: 0,
    justAMessage: true,
  },

  // === JONATHAN WILD ===
  [WILD]: {
    id: WILD,
    title: 'Jonathan Wild',
    description:
      'Jonathan Wild, a notorious criminal, wants passage to Kravat, where he can hide. Police will attack if they scan your ship. Will you smuggle him?',
    price: 0,
    justAMessage: false,
  },
  [WILDGETSOUT]: {
    id: WILDGETSOUT,
    title: 'Wild Delivered',
    description:
      'Jonathan Wild thanks you for the ride. For your trouble, he rewards you with 5,000 credits from his stash.',
    price: 0,
    justAMessage: true,
  },

  // === ALIEN ARTIFACT ===
  [ALIENARTIFACT]: {
    id: ALIENARTIFACT,
    title: 'Alien Artifact',
    description:
      'An ancient alien artifact has been discovered. A professor at a nearby university will pay well for it. Will you deliver it? It takes up 1 cargo bay.',
    price: 0,
    justAMessage: false,
  },
  [ARTIFACTDELIVERY]: {
    id: ARTIFACTDELIVERY,
    title: 'Artifact Delivered',
    description:
      'The professor is delighted with the artifact. You receive 20,000 credits for the delivery.',
    price: 0,
    justAMessage: true,
  },

  // === SCARAB CHAIN ===
  [SCARAB]: {
    id: SCARAB,
    title: 'Scarab Stolen',
    description:
      'A stolen Scarab ship has been spotted hiding near a wormhole. It is heavily armored and dangerous. Will you try to destroy it?',
    price: 0,
    justAMessage: false,
  },
  [SCARABDESTROYED]: {
    id: SCARABDESTROYED,
    title: 'Scarab Destroyed',
    description:
      'The Scarab has been destroyed! Captain Renwick will upgrade your hull as a reward. Visit him to claim your upgrade.',
    price: 0,
    justAMessage: true,
  },
  [GETHULLUPGRADED]: {
    id: GETHULLUPGRADED,
    title: 'Hull Upgraded',
    description:
      'Captain Renwick has reinforced your hull, increasing its strength by 50 points. This upgrade is permanent for your current ship.',
    price: 0,
    justAMessage: true,
  },

  // === GEMULON INVASION (TIME-SENSITIVE) ===
  [ALIENINVASION]: {
    id: ALIENINVASION,
    title: 'Alien Invasion',
    description:
      'Aliens are planning to invade Gemulon within 7 days! You must warn them in time, or the system will be lost. Will you deliver the warning?',
    price: 0,
    justAMessage: false,
  },
  [GEMULONRESCUED]: {
    id: GEMULONRESCUED,
    title: 'Gemulon Rescued',
    description:
      'The people of Gemulon thank you for warning them! As a reward, they install a fuel compactor on your ship, increasing your fuel range.',
    price: 0,
    justAMessage: true,
  },
  [GEMULONINVADED]: {
    id: GEMULONINVADED,
    title: 'Gemulon Invaded',
    description:
      'You were too late! Gemulon has been invaded by aliens. The system has been devastated.',
    price: 0,
    justAMessage: true,
  },
  [INSTALLFUELCOMPACTOR]: {
    id: INSTALLFUELCOMPACTOR,
    title: 'Fuel Compactor',
    description:
      'A fuel compactor has been installed on your ship. Your fuel range has increased by 3 parsecs.',
    price: 0,
    justAMessage: true,
  },

  // === EXPERIMENT (TIME-SENSITIVE) ===
  [EXPERIMENT]: {
    id: EXPERIMENT,
    title: 'Dangerous Experiment',
    description:
      'A Dr. Fehler is conducting a dangerous experiment near Daled. It must be stopped within 6 days! Will you try to stop it?',
    price: 0,
    justAMessage: false,
  },
  [EXPERIMENTSTOPPED]: {
    id: EXPERIMENTSTOPPED,
    title: 'Experiment Stopped',
    description:
      "You have managed to stop Dr. Fehler's dangerous experiment. As a reward, you receive 5,000 credits.",
    price: 0,
    justAMessage: true,
  },
  [EXPERIMENTFAILED]: {
    id: EXPERIMENTFAILED,
    title: 'Experiment Failed',
    description:
      "You were too late! Dr. Fehler's experiment went horribly wrong. The nearby systems have been affected.",
    price: 0,
    justAMessage: true,
  },

  // === MOON / WIN CONDITION ===
  [MOONFORSALE]: {
    id: MOONFORSALE,
    title: 'Moon For Sale',
    description:
      'A moon is available for sale in the Utopia system for 500,000 credits. Once purchased, you can retire there in luxury!',
    price: 0,
    justAMessage: true,
  },
  [MOONBOUGHT]: {
    id: MOONBOUGHT,
    title: 'Moon Bought',
    description:
      'Congratulations! You have bought a moon in the Utopia system! You can now retire in luxury. You win!',
    price: 500000,
    justAMessage: false,
  },

  // === ONE-OFF EVENTS ===
  [SKILLINCREASE]: {
    id: SKILLINCREASE,
    title: 'Skill Increase',
    description:
      'You find a\"Captain Marmoset\'s Amazing Skill Tonic\" in an old warehouse. Drinking it increases one of your skills!',
    price: 0,
    justAMessage: true,
  },
  [ERASERECORD]: {
    id: ERASERECORD,
    title: 'Erase Record',
    description:
      'A hacker offers to erase your criminal record from the police database for 5,000 credits. Do you accept?',
    price: 5000,
    justAMessage: false,
  },
  [CARGOFORSALE]: {
    id: CARGOFORSALE,
    title: 'Cargo For Sale',
    description:
      'A trader offers you 3 units of a random good at a special price of 1,000 credits total. Do you accept?',
    price: 1000,
    justAMessage: false,
  },
  [LOTTERYWINNER]: {
    id: LOTTERYWINNER,
    title: 'Lottery Winner',
    description: 'Congratulations! You have won 1,000 credits in a local lottery!',
    price: 0,
    justAMessage: true,
  },
};
