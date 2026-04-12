import {
  PlayerShip,
  SolarSystem,
  PoliticalSystems,
  ShipTypes,
  Weapons,
  Shields,
  ShipType,
} from './DataTypes';

// Encounter types
export const ENCOUNTER_NONE = 'NONE';
export const ENCOUNTER_POLICE = 'POLICE';
export const ENCOUNTER_PIRATE = 'PIRATE';
export const ENCOUNTER_TRADER = 'TRADER';
export const ENCOUNTER_MONSTER = 'MONSTER';
export const ENCOUNTER_DRAGONFLY = 'DRAGONFLY';
export const ENCOUNTER_SCARAB = 'SCARAB';

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
