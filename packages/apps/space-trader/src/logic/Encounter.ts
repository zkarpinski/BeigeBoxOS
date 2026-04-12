import {
  PlayerShip,
  SolarSystem,
  PoliticalSystems,
  ShipTypes,
  Weapons,
  Shields,
  ShipType,
  TradeItems,
} from './DataTypes';

// Encounter types
export const ENCOUNTER_NONE = 'NONE';
export const ENCOUNTER_POLICE = 'POLICE';
export const ENCOUNTER_PIRATE = 'PIRATE';
export const ENCOUNTER_TRADER = 'TRADER';
export const ENCOUNTER_MONSTER = 'MONSTER';
export const ENCOUNTER_DRAGONFLY = 'DRAGONFLY';
export const ENCOUNTER_SCARAB = 'SCARAB';

export interface NPCEncounterData {
  ship: PlayerShip;
  fighterSkill: number;
  pilotSkill: number;
  engineerSkill: number;
  bounty: number;
  // Loot available if NPC is destroyed
  lootCargo: number[];
}

/**
 * Pick a random ship type weighted by occurrence, with a minimum size constraint.
 * Matches original Space Trader NPC ship selection logic.
 */
function pickNPCShipType(minSize: number): number {
  // Filter to ships with size >= minSize that have occurrence > 0
  const eligible = ShipTypes.filter((s) => s.size >= minSize && s.occurrence > 0);
  const totalWeight = eligible.reduce((acc, s) => acc + s.occurrence, 0);
  let roll = getRandom(totalWeight);
  for (const s of eligible) {
    roll -= s.occurrence;
    if (roll < 0) return s.id;
  }
  return eligible[eligible.length - 1].id;
}

/**
 * Equip an NPC ship with weapons and shields based on available tech.
 * Returns a fresh PlayerShip with equipment installed.
 */
function equipNPCShip(shipTypeId: number, techLevel: number): PlayerShip {
  const shipType = ShipTypes[shipTypeId];
  const weapon: number[] = [-1, -1, -1];
  const shield: number[] = [-1, -1, -1];
  const shieldStrength: number[] = [-1, -1, -1];

  // Fill weapon slots with best available weapon for the tech level
  const availableWeapons = Weapons.filter((w) => w.techLevel <= techLevel);
  if (availableWeapons.length > 0) {
    for (let i = 0; i < shipType.weaponSlots; i++) {
      // Pick a random weapon, biased toward better ones
      const roll = getRandom(100);
      let chosen = availableWeapons[0];
      let cumChance = 0;
      for (const w of availableWeapons) {
        cumChance += w.chance;
        if (roll < cumChance) {
          chosen = w;
          break;
        }
      }
      weapon[i] = chosen.id;
    }
  }

  // Fill shield slots
  const availableShields = Shields.filter((s) => s.techLevel <= techLevel);
  if (availableShields.length > 0) {
    for (let i = 0; i < shipType.shieldSlots; i++) {
      const roll = getRandom(100);
      let chosen = availableShields[0];
      let cumChance = 0;
      for (const s of availableShields) {
        cumChance += s.chance;
        if (roll < cumChance) {
          chosen = s;
          break;
        }
      }
      shield[i] = chosen.id;
      shieldStrength[i] = Shields[chosen.id].power;
    }
  }

  return {
    type: shipTypeId,
    cargo: new Array(10).fill(0),
    weapon,
    shield,
    shieldStrength,
    gadget: [-1, -1, -1],
    escapePod: false,
    fuel: shipType.fuelTanks,
    hull: shipType.hullStrength,
  };
}

/**
 * Generate NPC cargo for loot when a pirate or trader is destroyed.
 * Pirates carry random goods; traders carry legitimate goods.
 */
function generateNPCCargo(encounterType: string, cargoBays: number): number[] {
  const cargo = new Array(10).fill(0);
  if (cargoBays <= 0) return cargo;

  const numItems = getRandom(Math.min(cargoBays, 5)) + 1;
  for (let i = 0; i < numItems; i++) {
    const goodId = getRandom(10);
    cargo[goodId] += 1;
  }
  return cargo;
}

/**
 * Generate a full NPC encounter: ship, skills, loot.
 * Difficulty 0=Beginner, 4=Impossible.
 */
export function generateNPCEncounter(
  encounterType: string,
  difficulty: number,
  policeRecordScore: number,
  days: number,
  systemTechLevel: number,
): NPCEncounterData {
  // Determine minimum ship size based on encounter type and game progress
  // Original: criminals see stronger police, difficulty scales pirate strength
  let minSize = 0;
  if (encounterType === ENCOUNTER_POLICE) {
    // Police strength based on how criminal the player is
    if (policeRecordScore < -70)
      minSize = 3; // Psychopath: Hornet/Grasshopper
    else if (policeRecordScore < -30)
      minSize = 2; // Villain: Bumblebee
    else if (policeRecordScore < 0)
      minSize = 1; // Criminal: Gnat/Mosquito
    else minSize = 1; // Clean: Gnat
  } else if (encounterType === ENCOUNTER_PIRATE) {
    // Pirates scale with difficulty and days played (net worth proxy)
    minSize = Math.min(3, Math.floor(difficulty / 2) + Math.floor(days / 100));
  } else {
    // Traders: always small ships
    minSize = 0;
  }

  const shipTypeId = pickNPCShipType(minSize);
  const ship = equipNPCShip(shipTypeId, systemTechLevel);

  // If pirate: add some cargo for looting
  if (encounterType === ENCOUNTER_PIRATE) {
    ship.cargo = generateNPCCargo(encounterType, ShipTypes[shipTypeId].cargoBays);
  }

  // NPC skills: scale with difficulty
  // Difficulty 0=Beginner (skills ~2), 4=Impossible (skills ~10)
  const baseSkill = 2 + difficulty * 2;
  const variance = getRandom(3);

  const bounty = ShipTypes[shipTypeId].bounty;

  return {
    ship,
    fighterSkill: baseSkill + variance,
    pilotSkill: baseSkill + getRandom(3),
    engineerSkill: baseSkill + getRandom(3),
    bounty,
    lootCargo: ship.cargo.slice(),
  };
}

const PSYCHOPATHSCORE = -70; // Approximation based on Spacetrader
const VILLAINSCORE = -30;

const getRandom = (max: number) => Math.floor(Math.random() * max);

/**
 * Total weapons power of a ship
 */
export function getTotalWeapons(ship: PlayerShip, minWeapon = -1, maxWeapon = -1): number {
  let j = 0;
  for (let i = 0; i < ship.weapon.length; i++) {
    if (ship.weapon[i] < 0) break;
    if (
      (minWeapon !== -1 && ship.weapon[i] < minWeapon) ||
      (maxWeapon !== -1 && ship.weapon[i] > maxWeapon)
    ) {
      continue;
    }
    j += Weapons[ship.weapon[i]].power;
  }
  return j;
}

/**
 * Calculates current shield strength — sums shieldStrength[] (current health per slot, not type IDs)
 */
export function getTotalShieldStrength(ship: PlayerShip): number {
  return ship.shieldStrength.reduce((acc, curr) => (curr > 0 ? acc + curr : acc), 0);
}

/**
 * Helper to determine STRENGTHPOLICE
 */
export function getStrengthPolice(system: SolarSystem, policeRecordScore: number): number {
  const pol = PoliticalSystems[system.politics];
  if (policeRecordScore < PSYCHOPATHSCORE) {
    return 3 * pol.strengthPolice;
  } else if (policeRecordScore < VILLAINSCORE) {
    return 2 * pol.strengthPolice;
  }
  return pol.strengthPolice;
}

/**
 * Determine if an encounter happens during travel.
 */
export function determineEncounter(
  system: SolarSystem,
  difficulty: number,
  policeRecordScore: number,
  shipType: number,
  isRaided: boolean,
): string {
  // EncounterTest = GetRandom( 44 - (2 * Difficulty) )
  let encounterTest = getRandom(44 - 2 * difficulty);

  // encounters are half as likely if you're in a flea
  if (shipType === 0) {
    encounterTest *= 2;
  }

  const pol = PoliticalSystems[system.politics];
  const strengthPolice = getStrengthPolice(system, policeRecordScore);

  if (encounterTest < pol.strengthPirates && !isRaided) {
    return ENCOUNTER_PIRATE;
  } else if (encounterTest < pol.strengthPirates + strengthPolice) {
    return ENCOUNTER_POLICE;
  } else if (encounterTest < pol.strengthPirates + strengthPolice + pol.strengthTraders) {
    return ENCOUNTER_TRADER;
  }

  return ENCOUNTER_NONE;
}

/**
 * Execute Attack Round (1 attacker against 1 defender)
 */
export function executeAttack(
  attacker: PlayerShip,
  defender: PlayerShip,
  attackerEngineerSkill: number,
  defenderEngineerSkill: number,
  attackerFighterSkill: number,
  defenderPilotSkill: number,
  flees: boolean,
  difficulty: number,
  isCommanderUnderAttack: boolean,
): boolean {
  // Accuracy Roll
  const defenderShipType = ShipTypes[defender.type];
  const hitChance = getRandom(attackerFighterSkill + defenderShipType.size);
  const evadeChance = (flees ? 2 : 1) * getRandom(5 + Math.floor(defenderPilotSkill / 2));

  if (hitChance < evadeChance) {
    return false; // Miss
  }

  // Damage calculation
  const totalWep = getTotalWeapons(attacker);
  if (totalWep <= 0) return false;

  let damage = getRandom(Math.floor((totalWep * (100 + 2 * attackerEngineerSkill)) / 100));
  if (damage <= 0) return false;

  // Deplete shields using shieldStrength[] (current health), not the type ID in shield[]
  for (let i = 0; i < defender.shieldStrength.length; i++) {
    if (defender.shieldStrength[i] <= 0) continue;

    if (damage <= defender.shieldStrength[i]) {
      defender.shieldStrength[i] -= damage;
      damage = 0;
      break;
    }
    damage -= defender.shieldStrength[i];
    defender.shieldStrength[i] = 0;
  }

  if (damage > 0) {
    damage -= getRandom(defenderEngineerSkill);
    if (damage <= 0) damage = 1;

    // Divide damage based on difficulty
    const IMPOSSIBLE = 4;
    const diffMod = isCommanderUnderAttack ? Math.max(1, IMPOSSIBLE - difficulty) : 2;
    damage = Math.min(damage, Math.floor(defenderShipType.hullStrength / diffMod));

    // Applying directly to hull
    defender.hull -= damage;
    if (defender.hull < 0) defender.hull = 0;
  }

  return true; // Hit successful
}
