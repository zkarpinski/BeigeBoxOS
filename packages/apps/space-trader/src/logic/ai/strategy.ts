import { SpaceTraderState } from '../store/types';
import {
  TradeItems,
  ShipTypes,
  PoliticalSystems,
  Weapons,
  Shields,
  ESCAPE_POD_PRICE,
} from '../DataTypes';

export type AiAction =
  | { type: 'BUY'; goodId: number; amount: number }
  | { type: 'SELL'; goodId: number; amount: number }
  | { type: 'WARP'; systemId: number }
  | { type: 'FUEL'; amount: number }
  | { type: 'REPAIR' }
  | { type: 'BUY_SHIP'; shipTypeId: number }
  | { type: 'BUY_WEAPON'; weaponId: number }
  | { type: 'BUY_SHIELD'; shieldId: number }
  | { type: 'BUY_ESCAPE_POD' }
  | {
      type: 'ENCOUNTER_ACTION';
      action: 'FLEE' | 'ATTACK' | 'SURRENDER' | 'IGNORE' | 'LOOT' | 'LET_GO' | 'DONE';
    }
  | { type: 'SPECIAL_EVENT' }
  | { type: 'IDLE' };

// ── Helpers ──────────────────────────────────────────────────────────────────

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function totalCargo(state: SpaceTraderState): number {
  return (state.ship.cargo ?? []).reduce((a, b) => a + b, 0);
}

function isGoodLegalAt(goodId: number, politicsIdx: number): boolean {
  if (goodId === 8) return PoliticalSystems[politicsIdx]?.drugsOk ?? false;
  if (goodId === 5) return PoliticalSystems[politicsIdx]?.firearmsOk ?? false;
  return true;
}

/** Rough combat power estimate based on weapons, shields, and skills */
function playerCombatPower(state: SpaceTraderState): number {
  const weaponPower = (state.ship.weapon ?? [])
    .filter((w) => w >= 0)
    .reduce((sum, wId) => sum + (Weapons[wId]?.power ?? 0), 0);
  const shieldPower = (state.ship.shield ?? [])
    .filter((s) => s >= 0)
    .reduce((sum, sId) => sum + (Shields[sId]?.power ?? 0), 0);
  const hull = state.ship.hull ?? 0;
  const fighter = state.fighterSkill ?? 4;
  return weaponPower * (1 + fighter * 0.05) + shieldPower * 0.5 + hull * 0.3;
}

function npcCombatPower(npc: { hull: number; weaponPower?: number; shieldPower?: number }): number {
  return (npc.weaponPower ?? 20) + (npc.shieldPower ?? 0) * 0.5 + (npc.hull ?? 100) * 0.3;
}

// ── Trade route finder ────────────────────────────────────────────────────────

export type TradeRoute = {
  targetSystemId: number;
  nextHopId: number;
  goodId: number;
  profit: number;
  score: number;
};

/**
 * Finds the globally best trade route from the current system.
 * Considers goods we can buy HERE or already have in cargo.
 * Returns the target system, next hop toward it, and expected per-unit profit.
 *
 * Strategy (based on original Space Trader guides):
 * - Narcotics (id 8) and Firearms (id 5) are the most profitable goods
 * - Robots (id 9) are a safe high-value alternative when illegals aren't available
 * - Short hops compound faster than high single-run profits
 */
export function findBestTrade(state: SpaceTraderState): TradeRoute | null {
  if (!state.systems || state.systems.length === 0) return null;
  const curSys = state.systems[state.currentSystem];
  if (!curSys) return null;

  const shipType = ShipTypes[state.ship.type];
  const currentFuel = state.ship.fuel ?? 0;
  const currentCargoQty = totalCargo(state);
  const cargoSpace = shipType.cargoBays - currentCargoQty;

  let best: TradeRoute | null = null;
  let maxScore = 0;

  for (let sysIdx = 0; sysIdx < state.systems.length; sysIdx++) {
    if (sysIdx === state.currentSystem) continue;
    const target = state.systems[sysIdx];
    const d = dist(curSys, target);

    for (let goodId = 0; goodId < 10; goodId++) {
      const item = TradeItems[goodId];

      // Target system must be able to consume this good
      if (target.techLevel < item.techUsage) continue;

      // If the good is illegal at the target, skip (would be 0 sell price)
      if (!isGoodLegalAt(goodId, target.politics)) continue;

      // Determine cost basis
      let costBasis: number;
      let possibleUnits: number;

      if ((state.ship.cargo[goodId] ?? 0) > 0) {
        // Already have it — cost basis is current sell price (opportunity cost)
        // If can't sell here, costBasis = 0 means any positive sell price is profit
        costBasis = state.sellPrices[goodId] ?? 0;
        possibleUnits = state.ship.cargo[goodId];
      } else {
        // Need to buy here first
        costBasis = state.buyPrices[goodId] ?? 0;
        if (costBasis === 0) continue; // Not available or illegal here
        if (costBasis > state.credits) continue; // Can't afford even one unit

        const maxAffordable = Math.floor(state.credits / costBasis);
        const available = state.systemQuantities[goodId] ?? 0;
        possibleUnits = Math.min(maxAffordable, cargoSpace, available);
        if (possibleUnits === 0) continue;
      }

      // Estimate sell price at target
      let estSellPrice = item.priceLowTech + target.techLevel * item.priceInc;
      if (target.status === item.doublePriceStatus) {
        estSellPrice = Math.floor((estSellPrice * 3) / 2);
      }
      if (item.expensiveResource >= 0 && target.specialResources === item.expensiveResource) {
        estSellPrice = Math.floor((estSellPrice * 4) / 3);
      }
      if (item.cheapResource >= 0 && target.specialResources === item.cheapResource) {
        estSellPrice = Math.floor((estSellPrice * 3) / 4);
      }
      estSellPrice = Math.max(0, estSellPrice);

      const profit = estSellPrice - costBasis;
      if (profit <= 0) continue;

      const totalProfit = profit * possibleUnits;

      // Score = total profit per parsec traveled (+ 20 parsec floor to avoid micro-hop obsession)
      let score = totalProfit / (d + 20);

      // Bias toward high-value contraband (guide: narcotics & firearms = keys to fortune)
      if (goodId === 8) score *= 2.0;
      if (goodId === 5) score *= 1.5;
      if (goodId === 9) score *= 1.1; // Robots: safe high value

      if (score > maxScore) {
        maxScore = score;

        // Determine next hop: direct if in range, else find the closest intermediate
        let nextHopId = sysIdx;
        if (d > currentFuel) {
          let minRemainder = Infinity;
          for (let hopIdx = 0; hopIdx < state.systems.length; hopIdx++) {
            if (hopIdx === state.currentSystem) continue;
            const hop = state.systems[hopIdx];
            const hopDist = dist(curSys, hop);
            if (hopDist > 0 && hopDist <= currentFuel) {
              const remainder = dist(hop, target);
              if (remainder < minRemainder) {
                minRemainder = remainder;
                nextHopId = hopIdx;
              }
            }
          }
        }

        best = { targetSystemId: sysIdx, nextHopId, goodId, profit, score };
      }
    }
  }

  return best;
}

// ── Main AI decision function ─────────────────────────────────────────────────

export function getAiDecision(state: SpaceTraderState): AiAction {
  const { ship, credits } = state;
  const shipType = ShipTypes[ship.type];

  // ── 1. Encounters (highest priority) ──────────────────────────────────────

  if (state.encounter) {
    const enc = state.encounter;

    // Encounter is fully resolved — loot pirates before clearing
    if (enc.resolved) {
      if (enc.playerWon && enc.type === 'PIRATE') {
        return { type: 'ENCOUNTER_ACTION', action: 'LOOT' };
      }
      return { type: 'ENCOUNTER_ACTION', action: 'DONE' };
    }

    const { encounterAction, type: encType } = enc;

    // NPC is fleeing — attack pirates (free bounty), let police/traders go
    if (encounterAction === 'FLEE_NPC') {
      if (encType === 'PIRATE') return { type: 'ENCOUNTER_ACTION', action: 'ATTACK' };
      return { type: 'ENCOUNTER_ACTION', action: 'LET_GO' };
    }

    // NPC ignoring us — just pass
    if (encounterAction === 'IGNORE') {
      return { type: 'ENCOUNTER_ACTION', action: 'LET_GO' };
    }

    // Trader offering goods — decline, we buy at ports
    if (encounterAction === 'TRADE_OFFER') {
      return { type: 'ENCOUNTER_ACTION', action: 'IGNORE' };
    }

    // Police inspection
    if (encounterAction === 'INSPECT') {
      const hasIllegalCargo = (ship.cargo[5] ?? 0) > 0 || (ship.cargo[8] ?? 0) > 0;
      if (!hasIllegalCargo) {
        // Nothing to hide — comply
        return { type: 'ENCOUNTER_ACTION', action: 'SURRENDER' };
      }
      // Have contraband — flee if we can, otherwise surrender
      // (losing contraband is better than a criminal record tanking sell prices)
      return { type: 'ENCOUNTER_ACTION', action: 'FLEE' };
    }

    // NPC is attacking
    if (encounterAction === 'ATTACK') {
      const playerPower = playerCombatPower(state);
      const npcPower = npcCombatPower(enc.npc as any);

      // Always fight pirates if we're stronger or in a combat ship
      if (encType === 'PIRATE' && playerPower >= npcPower * 0.7) {
        return { type: 'ENCOUNTER_ACTION', action: 'ATTACK' };
      }
      // Flee police (killing police tanks our record and sell prices)
      if (encType === 'POLICE') {
        return { type: 'ENCOUNTER_ACTION', action: 'FLEE' };
      }
      // Flee quest bosses (MONSTER, DRAGONFLY, SCARAB) unless strong
      if (playerPower >= npcPower * 1.2) {
        return { type: 'ENCOUNTER_ACTION', action: 'ATTACK' };
      }
      return { type: 'ENCOUNTER_ACTION', action: 'FLEE' };
    }

    // Fallback for any unhandled state
    return { type: 'ENCOUNTER_ACTION', action: 'FLEE' };
  }

  // ── 2. Win condition ───────────────────────────────────────────────────────

  // When rich enough, navigate to Utopia (system 109) to buy the moon
  const UTOPIA_SYSTEM = 109;
  if (credits >= 500000) {
    if (state.currentSystem === UTOPIA_SYSTEM) {
      return { type: 'SPECIAL_EVENT' };
    }
    // Navigate toward Utopia
    const utopia = state.systems[UTOPIA_SYSTEM];
    if (utopia) {
      const curSys = state.systems[state.currentSystem];
      const d = dist(curSys, utopia);
      if (d <= (ship.fuel ?? 0)) {
        return { type: 'WARP', systemId: UTOPIA_SYSTEM };
      }
      // Multi-hop toward Utopia
      let bestHop = -1;
      let minRemainder = Infinity;
      for (let i = 0; i < state.systems.length; i++) {
        if (i === state.currentSystem) continue;
        const hop = state.systems[i];
        const hopDist = dist(curSys, hop);
        if (hopDist > 0 && hopDist <= (ship.fuel ?? 0)) {
          const remainder = dist(hop, utopia);
          if (remainder < minRemainder) {
            minRemainder = remainder;
            bestHop = i;
          }
        }
      }
      if (bestHop >= 0) return { type: 'WARP', systemId: bestHop };
      // Need more fuel to move at all
      const fuelNeeded = shipType.fuelTanks - (ship.fuel ?? 0);
      const fuelCost = fuelNeeded * shipType.costOfFuel;
      if (fuelNeeded > 0 && credits > fuelCost) {
        return { type: 'FUEL', amount: fuelNeeded };
      }
    }
  }

  // ── 3. Fuel (needed to move toward Utopia or anywhere) ────────────────────

  const fuelNeeded = shipType.fuelTanks - (ship.fuel ?? 0);
  const fuelCost = fuelNeeded * shipType.costOfFuel;

  // Top off if below 60% — keeps options open for multi-hop routing
  if ((ship.fuel ?? 0) < shipType.fuelTanks * 0.6 && credits > fuelCost + 500) {
    return { type: 'FUEL', amount: fuelNeeded };
  }

  const hullDeficit = shipType.hullStrength - (ship.hull ?? 0);
  const repairCost = hullDeficit * shipType.repairCosts;
  if ((ship.hull ?? 0) < shipType.hullStrength * 0.75 && credits > repairCost + 500) {
    return { type: 'REPAIR' };
  }

  // ── 4. Equipment ──────────────────────────────────────────────────────────
  // (Only buy equipment if we have significant credits in reserve)

  const EQUIPMENT_RESERVE = 20000; // Keep this much after buying equipment
  const curTech = state.systems[state.currentSystem]?.techLevel ?? 0;

  // Escape pod: essential safety net — buy ASAP (tech 5+)
  if (!ship.escapePod && curTech >= 5 && credits >= ESCAPE_POD_PRICE + EQUIPMENT_RESERVE) {
    return { type: 'BUY_ESCAPE_POD' };
  }

  // Weapon: needed for combat — fill first empty weapon slot
  const weaponSlots = shipType.weaponSlots;
  const weapons = ship.weapon ?? [];
  const emptyWeaponSlot = weapons.findIndex((w) => w < 0);
  if (weaponSlots > 0 && emptyWeaponSlot >= 0) {
    // Buy best weapon available at current tech level
    for (let wId = Weapons.length - 1; wId >= 0; wId--) {
      const w = Weapons[wId];
      if (curTech >= w.techLevel && credits >= w.price + EQUIPMENT_RESERVE) {
        // Don't buy if we already have this or better
        const alreadyHaveIt = weapons.some((slot) => slot >= wId);
        if (!alreadyHaveIt) {
          return { type: 'BUY_WEAPON', weaponId: wId };
        }
      }
    }
    // Fallback: buy cheapest weapon if we have no weapons at all
    const hasAnyWeapon = weapons.some((w) => w >= 0);
    if (!hasAnyWeapon && curTech >= 5 && credits >= Weapons[0].price + EQUIPMENT_RESERVE) {
      return { type: 'BUY_WEAPON', weaponId: 0 };
    }
  }

  // Shield: fill first empty shield slot
  const shieldSlots = shipType.shieldSlots;
  const shields = ship.shield ?? [];
  const emptyShieldSlot = shields.findIndex((s) => s < 0);
  if (shieldSlots > 0 && emptyShieldSlot >= 0) {
    for (let sId = Shields.length - 1; sId >= 0; sId--) {
      const s = Shields[sId];
      if (curTech >= s.techLevel && credits >= s.price + EQUIPMENT_RESERVE) {
        const alreadyHaveSameOrBetter = shields.some((slot) => slot >= sId);
        if (!alreadyHaveSameOrBetter) {
          return { type: 'BUY_SHIELD', shieldId: sId };
        }
      }
    }
    // Fallback: energy shield
    const hasAnyShield = shields.some((s) => s >= 0);
    if (!hasAnyShield && curTech >= 5 && credits >= Shields[0].price + EQUIPMENT_RESERVE) {
      return { type: 'BUY_SHIELD', shieldId: 0 };
    }
  }

  // ── 5. Ship upgrades ──────────────────────────────────────────────────────
  // Upgrade path: Gnat(1) → Bumblebee(4) → Grasshopper(7) → Wasp(9)
  // Reserve enough for equipment after the upgrade

  const UPGRADE_BUFFER = 15000; // Keep after ship purchase for weapons/shields

  // Gnat → Bumblebee: 25 cargo bays, 2 shields. Much better trading platform.
  if (ship.type === 1 && credits >= 75000 + UPGRADE_BUFFER && curTech >= 5) {
    return { type: 'BUY_SHIP', shipTypeId: 4 };
  }

  // Bumblebee → Grasshopper: 30 cargo, 3 gadgets, 2 weapons. Best trader.
  if (ship.type === 4 && credits >= 175000 + UPGRADE_BUFFER && curTech >= 6) {
    return { type: 'BUY_SHIP', shipTypeId: 7 };
  }

  // Grasshopper → Wasp: 35 cargo, 3 weapons, 2 shields. Endgame ship.
  if (ship.type === 7 && credits >= 350000 + UPGRADE_BUFFER && curTech >= 7) {
    return { type: 'BUY_SHIP', shipTypeId: 9 };
  }

  // ── 6. Trading ────────────────────────────────────────────────────────────

  const currentCargoQty = totalCargo(state);
  const maxCargo = shipType.cargoBays;
  const bestTrade = findBestTrade(state);

  // Sell cargo when at the target destination OR when sell price clearly profitable
  if (currentCargoQty > 0) {
    for (let i = 0; i < 10; i++) {
      const amount = ship.cargo[i] ?? 0;
      if (amount <= 0) continue;

      const sellPrice = state.sellPrices[i] ?? 0;
      if (sellPrice === 0) continue;

      // Sell if this is the target destination for this good
      const isAtTarget =
        bestTrade && bestTrade.goodId === i && bestTrade.targetSystemId === state.currentSystem;

      // Sell if price is meaningfully above the item's base price
      // (proxy for "we bought cheap somewhere and can sell profitably here")
      const basePrice = TradeItems[i].priceLowTech;
      const isGoodPrice = sellPrice > basePrice * 1.1;

      if (isAtTarget || isGoodPrice) {
        return { type: 'SELL', goodId: i, amount };
      }
    }
  }

  // Buy the best trade good if available here
  if (bestTrade) {
    const buyPrice = state.buyPrices[bestTrade.goodId] ?? 0;
    if (buyPrice > 0) {
      const canAfford = Math.floor(credits / buyPrice);
      const space = maxCargo - currentCargoQty;
      const available = state.systemQuantities[bestTrade.goodId] ?? 0;
      const amount = Math.min(canAfford, space, available);

      if (amount > 0) {
        return { type: 'BUY', goodId: bestTrade.goodId, amount };
      }
    }

    // Nothing to buy — move toward destination
    const nextHop = bestTrade.nextHopId;
    if (nextHop !== state.currentSystem) {
      const hop = state.systems[nextHop];
      const curSys = state.systems[state.currentSystem];
      const d = dist(curSys, hop);

      // Need fuel to reach next hop? Buy it.
      if (d > (ship.fuel ?? 0)) {
        const fuelToReach = Math.ceil(d) - (ship.fuel ?? 0);
        const cost = fuelToReach * shipType.costOfFuel;
        if (credits > cost + 200) {
          return { type: 'FUEL', amount: shipType.fuelTanks - (ship.fuel ?? 0) };
        }
      }

      return { type: 'WARP', systemId: nextHop };
    }
  }

  // ── 7. Stuck recovery ─────────────────────────────────────────────────────
  // No good trade found — try to reach any higher-tech system

  if (currentCargoQty > 0 || credits > 1000) {
    const curSys = state.systems[state.currentSystem];
    const reachable = state.systems
      .map((s, i) => ({ s, i }))
      .filter(({ s, i }) => {
        if (i === state.currentSystem) return false;
        return dist(curSys, s) <= (ship.fuel ?? 0) && dist(curSys, s) > 0;
      });

    if (reachable.length > 0) {
      // Head to highest tech system in range
      reachable.sort((a, b) => b.s.techLevel - a.s.techLevel);
      return { type: 'WARP', systemId: reachable[0].i };
    }

    // No reachable systems — top off fuel
    if (fuelNeeded > 0 && credits > fuelCost) {
      return { type: 'FUEL', amount: fuelNeeded };
    }
  }

  return { type: 'IDLE' };
}
