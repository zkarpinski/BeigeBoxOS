import {
  MAXSOLARSYSTEM,
  MAXWORMHOLE,
  MAXTECHLEVEL,
  MAXPOLITICS,
  MAXRESOURCES,
  MAXSIZE,
  MAXSTATUS,
  UNEVENTFUL,
  PoliticalSystems,
  SolarSystem,
} from './DataTypes';
import {
  ACAMARSYSTEM,
  BARATASSYSTEM,
  DALEDSYSTEM,
  DEVIDIASYSTEM,
  GEMULONSYSTEM,
  JAPORISYSTEM,
  KRAVATSYSTEM,
  MELINASYSTEM,
  NIXSYSTEM,
  REGULASSYSTEM,
  UTOPIASYSTEM,
  ZALKONSYSTEM,
  // Destination/intermediate events
  MONSTERKILLED,
  FLYBARATAS,
  FLYMELINA,
  FLYREGULAS,
  DRAGONFLYDESTROYED,
  MEDICINEDELIVERY,
  MOONBOUGHT,
  JAREKGETSOUT,
  WILDGETSOUT,
  GETREACTOR,
  REACTORDELIVERED,
  ARTIFACTDELIVERY,
  GEMULONRESCUED,
  EXPERIMENTSTOPPED,
  // Quest-starting events
  SPACEMONSTER,
  DRAGONFLY,
  JAPORIDISEASE,
  JAREK,
  WILD,
  ALIENARTIFACT,
  SCARAB,
  ALIENINVASION,
  EXPERIMENT,
  // One-off events
  SKILLINCREASE,
  ERASERECORD,
  CARGOFORSALE,
  LOTTERYWINNER,
} from './SpecialEvents';

// Distances based on spacetrader.h
const GALAXYWIDTH = 150;
const GALAXYHEIGHT = 110;
const CLOSEDISTANCE = 13;
const MINDISTANCE = 6;

// Math Helpers
const getRandom = (max: number) => Math.floor(Math.random() * max);
const sqr = (a: number) => a * a;
const sqrDistance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  sqr(a.x - b.x) + sqr(a.y - b.y);
const realDistance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.sqrt(sqrDistance(a, b));

/** Place an event on a random unoccupied system */
function placeOnRandom(
  systems: { special: number }[],
  eventId: number,
  reserved: Set<number>,
): void {
  for (let attempt = 0; attempt < 100; attempt++) {
    const idx = getRandom(systems.length);
    if (systems[idx].special === -1 && !reserved.has(idx)) {
      systems[idx].special = eventId;
      return;
    }
  }
}

export function generateGalaxy() {
  const systems: SolarSystem[] = [];
  const wormholes: number[] = [];

  let i = 0;
  while (i < MAXSOLARSYSTEM) {
    let x = 0;
    let y = 0;

    if (i < MAXWORMHOLE) {
      // Place first 6 systems (wormholes) in spread quadrants
      x =
        (CLOSEDISTANCE >> 1) -
        getRandom(CLOSEDISTANCE) +
        Math.floor((GALAXYWIDTH * (1 + 2 * (i % 3))) / 6);
      y =
        (CLOSEDISTANCE >> 1) -
        getRandom(CLOSEDISTANCE) +
        Math.floor((GALAXYHEIGHT * (i < 3 ? 1 : 3)) / 4);
      wormholes.push(i);
    } else {
      x = 1 + getRandom(GALAXYWIDTH - 2);
      y = 1 + getRandom(GALAXYHEIGHT - 2);
    }

    let closeFound = false;
    let redo = false;

    if (i >= MAXWORMHOLE) {
      for (let j = 0; j < i; j++) {
        const dist = sqrDistance(systems[j], { x, y });
        if (dist <= sqr(MINDISTANCE + 1)) {
          redo = true;
          break;
        }
        if (dist < sqr(CLOSEDISTANCE)) {
          closeFound = true;
        }
      }
    }

    if (redo) continue;
    if (i >= MAXWORMHOLE && !closeFound) continue;

    const techLevel = getRandom(MAXTECHLEVEL);
    const politicsId = getRandom(MAXPOLITICS);
    const pol = PoliticalSystems[politicsId];

    if (pol.minTechLevel > techLevel) continue;
    if (pol.maxTechLevel < techLevel) continue;

    const specialResources = getRandom(5) >= 3 ? 1 + getRandom(MAXRESOURCES - 1) : 0;
    const size = getRandom(MAXSIZE);
    const status = getRandom(100) < 15 ? 1 + getRandom(MAXSTATUS - 1) : UNEVENTFUL;

    systems.push({
      nameIndex: i,
      techLevel,
      politics: politicsId,
      status,
      x,
      y,
      specialResources,
      size,
      visited: false,
      special: -1,
      countDown: 0,
    });

    i++;
  }

  // Randomize locations so alphabet naming isn't all clumping together
  for (let idx = 0; idx < MAXSOLARSYSTEM; idx++) {
    const isWormhole = wormholes.includes(idx);
    const swapIdx = getRandom(MAXSOLARSYSTEM);
    if (swapIdx === idx) continue;
    if (wormholes.includes(swapIdx)) continue; // Don't swap two wormholes randomly here

    // If either system is a wormhole, ensure the swap doesn't cluster wormholes together
    if (isWormhole) {
      const newPos = { x: systems[swapIdx].x, y: systems[swapIdx].y };
      let tooClose = false;
      for (const wi of wormholes) {
        if (wi === idx) continue; // skip self
        if (sqrDistance(newPos, systems[wi]) < sqr(CLOSEDISTANCE * 2)) {
          tooClose = true;
          break;
        }
      }
      if (tooClose) continue;
    }

    const tempX = systems[idx].x;
    const tempY = systems[idx].y;
    systems[idx].x = systems[swapIdx].x;
    systems[idx].y = systems[swapIdx].y;
    systems[swapIdx].x = tempX;
    systems[swapIdx].y = tempY;

    if (isWormhole) {
      const wIdx = wormholes.indexOf(idx);
      wormholes[wIdx] = swapIdx;
    }
  }

  // Shuffle wormhole endpoint assignments (from NewGame.c)
  for (let wi = 0; wi < wormholes.length; wi++) {
    const j = getRandom(MAXWORMHOLE);
    const temp = wormholes[wi];
    wormholes[wi] = wormholes[j];
    wormholes[j] = temp;
  }

  // Add wormhole destinations and qty arrays
  const systemState = systems.map((s, idx) => {
    const wormholeIdx = wormholes.indexOf(idx);
    return {
      ...s,
      qty: new Array(10).fill(0),
      // Each wormhole system points to the next in the shuffled ring
      wormholeDest: wormholeIdx >= 0 ? wormholes[(wormholeIdx + 1) % MAXWORMHOLE] : -1,
    };
  });

  // --- Fixed destination events (always at specific named systems) ---
  const fixedLocations = [
    { target: ACAMARSYSTEM, spec: MONSTERKILLED },
    { target: BARATASSYSTEM, spec: FLYBARATAS },
    { target: MELINASYSTEM, spec: FLYMELINA },
    { target: REGULASSYSTEM, spec: FLYREGULAS },
    { target: ZALKONSYSTEM, spec: DRAGONFLYDESTROYED },
    { target: JAPORISYSTEM, spec: MEDICINEDELIVERY },
    { target: UTOPIASYSTEM, spec: MOONBOUGHT },
    { target: DEVIDIASYSTEM, spec: JAREKGETSOUT },
    { target: KRAVATSYSTEM, spec: WILDGETSOUT },
    { target: GEMULONSYSTEM, spec: GEMULONRESCUED },
    { target: DALEDSYSTEM, spec: EXPERIMENTSTOPPED },
  ];

  for (const loc of fixedLocations) {
    if (systemState[loc.target]) {
      systemState[loc.target].special = loc.spec;
    }
  }

  // --- Distance-based events ---
  // Reactor: find system >= 70 parsecs from Nix
  let bestDist = 999;
  let reactorSystem = -1;
  for (let j = 0; j < MAXSOLARSYSTEM; j++) {
    const dist = realDistance(systemState[NIXSYSTEM], systemState[j]);
    if (
      dist >= 70 &&
      dist < bestDist &&
      systemState[j].special < 0 &&
      j !== GEMULONSYSTEM &&
      j !== DALEDSYSTEM
    ) {
      reactorSystem = j;
      bestDist = dist;
    }
  }
  if (reactorSystem >= 0) {
    systemState[reactorSystem].special = GETREACTOR;
    systemState[NIXSYSTEM].special = REACTORDELIVERED;
  }

  // --- Quest-starting events on random systems ---
  // Reserve fixed-event systems so starters don't overwrite them
  const reserved = new Set([
    ACAMARSYSTEM,
    BARATASSYSTEM,
    DALEDSYSTEM,
    DEVIDIASYSTEM,
    GEMULONSYSTEM,
    JAPORISYSTEM,
    KRAVATSYSTEM,
    MELINASYSTEM,
    NIXSYSTEM,
    REGULASSYSTEM,
    UTOPIASYSTEM,
    ZALKONSYSTEM,
    ...(reactorSystem >= 0 ? [reactorSystem] : []),
  ]);

  placeOnRandom(systemState, SPACEMONSTER, reserved);
  placeOnRandom(systemState, DRAGONFLY, reserved);
  placeOnRandom(systemState, JAPORIDISEASE, reserved);
  placeOnRandom(systemState, JAREK, reserved);
  placeOnRandom(systemState, WILD, reserved);
  placeOnRandom(systemState, ALIENARTIFACT, reserved);
  placeOnRandom(systemState, SCARAB, reserved);

  // Artifact delivery destination
  placeOnRandom(systemState, ARTIFACTDELIVERY, reserved);

  // Time-sensitive quest starters
  const invasionIdx = placeOnRandomReturn(systemState, ALIENINVASION, reserved);
  if (invasionIdx >= 0) systemState[invasionIdx].countDown = 7;
  const experimentIdx = placeOnRandomReturn(systemState, EXPERIMENT, reserved);
  if (experimentIdx >= 0) systemState[experimentIdx].countDown = 6;

  // One-off events scattered on random systems
  placeOnRandom(systemState, SKILLINCREASE, reserved);
  placeOnRandom(systemState, SKILLINCREASE, reserved); // Two skill tonics
  placeOnRandom(systemState, ERASERECORD, reserved);
  placeOnRandom(systemState, CARGOFORSALE, reserved);
  placeOnRandom(systemState, LOTTERYWINNER, reserved);

  return { systems: systemState, wormholes };
}

/** Like placeOnRandom but returns the index where it was placed (-1 if failed) */
function placeOnRandomReturn(
  systems: { special: number; countDown: number }[],
  eventId: number,
  reserved: Set<number>,
): number {
  for (let attempt = 0; attempt < 100; attempt++) {
    const idx = getRandom(systems.length);
    if (systems[idx].special === -1 && !reserved.has(idx)) {
      systems[idx].special = eventId;
      return idx;
    }
  }
  return -1;
}
