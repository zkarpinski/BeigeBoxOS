import {
  MAXSOLARSYSTEM,
  MAXWORMHOLE,
  MAXTECHLEVEL,
  MAXPOLITICS,
  MAXRESOURCES,
  MAXSIZE,
  MAXSTATUS,
  MAXCREWMEMBER,
  UNEVENTFUL,
  PoliticalSystems,
  SolarSystem,
} from './DataTypes';

// Distances based on spacetrader.h
const GALAXYWIDTH = 150;
const GALAXYHEIGHT = 110;
const CLOSEDISTANCE = 13;
const MINDISTANCE = 6;

// Fixed system indexes
const ACAMARSYSTEM = 0;
const BARATASSYSTEM = 6;
const DALEDSYSTEM = 17;
const DEVIDIASYSTEM = 22;
const GEMULONSYSTEM = 32;
const JAPORISYSTEM = 41;
const KRAVATSYSTEM = 50;
const MELINASYSTEM = 59;
const NIXSYSTEM = 67;
const OGSYSTEM = 70;
const REGULASSYSTEM = 82;
const SOLSYSTEM = 92;
const UTOPIASYSTEM = 109;
const ZALKONSYSTEM = 118;

// Special events for placement
const MONSTERKILLED = 4;
const FLYBARATAS = 1;
const FLYMELINA = 2;
const FLYREGULAS = 3;
const DRAGONFLYDESTROYED = 0;
const MEDICINEDELIVERY = 5;
const MOONBOUGHT = 6;
const JAREKGETSOUT = 32;
const WILDGETSOUT = 36;
const SCARABDESTROYED = 30;
const GETREACTOR = 26;
const REACTORDELIVERED = 31;
const ARTIFACTDELIVERY = 18;
const ALIENINVASION = 21;
const GEMULONRESCUED = 33;
const EXPERIMENT = 24;
const EXPERIMENTSTOPPED = 34;

// Math Helpers
const getRandom = (max: number) => Math.floor(Math.random() * max);
const sqr = (a: number) => a * a;
const sqrDistance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  sqr(a.x - b.x) + sqr(a.y - b.y);
const realDistance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.sqrt(sqrDistance(a, b));

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
    });

    i++;
  }

  // Randomize locations so alphabet naming isn't all clumping together
  for (let idx = 0; idx < MAXSOLARSYSTEM; idx++) {
    const isWormhole = wormholes.includes(idx);
    let swapIdx = getRandom(MAXSOLARSYSTEM);
    if (wormholes.includes(swapIdx)) continue; // Don't swap two wormholes randomly here

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

  // Assign special events to specific locations
  const specialLocations = [
    { target: ACAMARSYSTEM, spec: MONSTERKILLED },
    { target: BARATASSYSTEM, spec: FLYBARATAS },
    { target: MELINASYSTEM, spec: FLYMELINA },
    { target: REGULASSYSTEM, spec: FLYREGULAS },
    { target: ZALKONSYSTEM, spec: DRAGONFLYDESTROYED },
    { target: JAPORISYSTEM, spec: MEDICINEDELIVERY },
    { target: UTOPIASYSTEM, spec: MOONBOUGHT },
    { target: DEVIDIASYSTEM, spec: JAREKGETSOUT },
    { target: KRAVATSYSTEM, spec: WILDGETSOUT },
  ];

  // Shuffle wormhole endpoint assignments (from NewGame.c)
  for (let i = 0; i < wormholes.length; i++) {
    const j = getRandom(MAXWORMHOLE);
    const temp = wormholes[i];
    wormholes[i] = wormholes[j];
    wormholes[j] = temp;
  }

  // Expose an extra property 'special' to track quests, just like original
  const systemState = systems.map((s, idx) => {
    const wormholeIdx = wormholes.indexOf(idx);
    return {
      ...s,
      special: -1,
      qty: new Array(10).fill(0),
      countDown: 0,
      // Each wormhole system points to the next in the shuffled ring
      wormholeDest: wormholeIdx >= 0 ? wormholes[(wormholeIdx + 1) % MAXWORMHOLE] : -1,
    };
  });

  for (const loc of specialLocations) {
    if (systemState[loc.target]) {
      systemState[loc.target].special = loc.spec;
    }
  }

  // Distance quests (Reactor)
  let d = 999;
  let k = -1;
  for (let j = 0; j < MAXSOLARSYSTEM; j++) {
    const dist = realDistance(systemState[NIXSYSTEM], systemState[j]);
    if (
      dist >= 70 &&
      dist < d &&
      systemState[j].special < 0 &&
      j !== GEMULONSYSTEM &&
      j !== DALEDSYSTEM
    ) {
      k = j;
      d = dist;
    }
  }
  if (k >= 0) {
    systemState[k].special = GETREACTOR;
    systemState[NIXSYSTEM].special = REACTORDELIVERED;
  }

  return { systems: systemState, wormholes };
}
