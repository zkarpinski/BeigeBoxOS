import { PlayerShip, ShipTypes, Weapons, Shields } from '../DataTypes';
import { executeAttack, NPCEncounterData } from '../Encounter';

export interface CombatResult {
  playerShip: PlayerShip;
  npcShip: PlayerShip;
  log: string[];
  resolved: boolean;
  playerWon: boolean;
  bounty: number;
  repGain: number;
  policeHit: number;
}

export function resolveCombatRound(
  playerShip: PlayerShip,
  npcEncounter: NPCEncounterData,
  difficulty: number,
  skills: { pilot: number; fighter: number; engineer: number },
  currentLog: string[],
  currentRound: number,
): CombatResult {
  const npcShipCopy = {
    ...npcEncounter.ship,
    shieldStrength: [...npcEncounter.ship.shieldStrength],
  };
  const playerShipCopy = { ...playerShip, shieldStrength: [...playerShip.shieldStrength] };
  const log = [...currentLog];

  // Gadget bonuses to player skills
  const hasTargeting = playerShip.gadget.includes(3);
  const hasAutoRepair = playerShip.gadget.includes(1);
  const hasNav = playerShip.gadget.includes(2);
  const hasCloaking = playerShip.gadget.includes(4);

  const effectiveFighter = skills.fighter + (hasTargeting ? 3 : 0);
  const effectivePilot = skills.pilot + (hasNav || hasCloaking ? 3 : 0);
  const effectiveEngineer = skills.engineer + (hasAutoRepair ? 2 : 0);

  // Gadget bonuses to NPC skills
  const npcGadgets = npcEncounter.ship.gadget;
  const npcHasTargeting = npcGadgets.includes(3);
  const npcHasAutoRepair = npcGadgets.includes(1);
  const npcHasNav = npcGadgets.includes(2);
  const npcHasCloaking = npcGadgets.includes(4);

  const npcEffectiveFighter = npcEncounter.fighterSkill + (npcHasTargeting ? 3 : 0);
  const npcEffectivePilot = npcEncounter.pilotSkill + (npcHasNav || npcHasCloaking ? 3 : 0);
  const npcEffectiveEngineer = npcEncounter.engineerSkill + (npcHasAutoRepair ? 2 : 0);

  let resolved = false;
  let playerWon = false;
  let bounty = 0;
  let repGain = 0;
  let policeHit = 0;

  // Player attacks NPC
  const playerHit = executeAttack(
    playerShipCopy,
    npcShipCopy,
    effectiveEngineer,
    npcEffectiveEngineer,
    effectiveFighter,
    npcEffectivePilot,
    false,
    difficulty,
    false,
  );

  if (playerHit) {
    const shieldLeft = npcShipCopy.shieldStrength.reduce((a, v) => a + Math.max(0, v), 0);
    log.push(
      `Round ${currentRound + 1}: You hit! NPC hull: ${npcShipCopy.hull} / shields: ${shieldLeft}`,
    );
  } else {
    log.push(`Round ${currentRound + 1}: Your shot missed.`);
  }

  // Check if NPC destroyed
  if (npcShipCopy.hull <= 0) {
    bounty = npcEncounter.bounty;
    resolved = true;
    playerWon = true;
    return {
      playerShip: playerShipCopy,
      npcShip: npcShipCopy,
      log,
      resolved,
      playerWon,
      bounty,
      repGain: 0, // Will be set by caller based on encounter type
      policeHit: 0,
    };
  }

  // NPC attacks player
  const npcHit = executeAttack(
    npcShipCopy,
    playerShipCopy,
    npcEffectiveEngineer,
    effectiveEngineer,
    npcEffectiveFighter,
    effectivePilot,
    false,
    difficulty,
    true,
  );

  if (npcHit) {
    const shieldLeft = playerShipCopy.shieldStrength.reduce((a, v) => a + Math.max(0, v), 0);
    log.push(`NPC hits you! Your hull: ${playerShipCopy.hull} / shields: ${shieldLeft}`);
  } else {
    log.push(`NPC missed.`);
  }

  if (playerShipCopy.hull <= 0) {
    resolved = true;
    playerWon = false;
  }

  return {
    playerShip: playerShipCopy,
    npcShip: npcShipCopy,
    log,
    resolved,
    playerWon,
    bounty,
    repGain,
    policeHit,
  };
}

export function resolveFlee(
  playerShip: PlayerShip,
  npcEncounter: NPCEncounterData,
  difficulty: number,
  skills: { pilot: number; engineer: number },
  currentLog: string[],
  currentRound: number,
): Omit<CombatResult, 'bounty' | 'repGain' | 'policeHit'> {
  const log = [...currentLog];

  const hasNav = playerShip.gadget.includes(2);
  const hasCloaking = playerShip.gadget.includes(4);
  const hasAutoRepair = playerShip.gadget.includes(1);
  const effectivePilot = skills.pilot + (hasNav || hasCloaking ? 3 : 0);
  const effectiveEngineer = skills.engineer + (hasAutoRepair ? 2 : 0);

  const npcGadgets = npcEncounter.ship.gadget;
  const npcHasTargeting = npcGadgets.includes(3);
  const npcHasAutoRepair = npcGadgets.includes(1);
  const npcHasNav = npcGadgets.includes(2);
  const npcHasCloaking = npcGadgets.includes(4);
  const npcEffectiveFighter = npcEncounter.fighterSkill + (npcHasTargeting ? 3 : 0);
  const npcEffectivePilot = npcEncounter.pilotSkill + (npcHasNav || npcHasCloaking ? 3 : 0);
  const npcEffectiveEngineer = npcEncounter.engineerSkill + (npcHasAutoRepair ? 2 : 0);

  const fleeRoll = Math.random();
  const fleeChance = Math.max(0.05, 0.3 + effectivePilot * 0.04 - npcEffectivePilot * 0.02);

  if (fleeRoll < fleeChance) {
    log.push('You successfully fled!');
    return {
      playerShip,
      npcShip: npcEncounter.ship,
      log,
      resolved: true,
      playerWon: false,
    };
  }

  log.push('Flee failed! NPC fires...');
  const playerShipCopy = { ...playerShip, shieldStrength: [...playerShip.shieldStrength] };
  const npcShipCopy = {
    ...npcEncounter.ship,
    shieldStrength: [...npcEncounter.ship.shieldStrength],
  };

  executeAttack(
    npcShipCopy,
    playerShipCopy,
    npcEffectiveEngineer,
    effectiveEngineer,
    npcEffectiveFighter,
    effectivePilot,
    true, // flees
    difficulty,
    true,
  );

  if (playerShipCopy.hull <= 0) {
    return {
      playerShip: playerShipCopy,
      npcShip: npcShipCopy,
      log,
      resolved: true,
      playerWon: false,
    };
  }

  const shieldLeft = playerShipCopy.shieldStrength.reduce((a, v) => a + Math.max(0, v), 0);
  log.push(
    `You took a hit while fleeing. Hull: ${playerShipCopy.hull}, shields: ${shieldLeft}. Fled successfully.`,
  );

  return {
    playerShip: playerShipCopy,
    npcShip: npcShipCopy,
    log,
    resolved: true,
    playerWon: false,
  };
}
