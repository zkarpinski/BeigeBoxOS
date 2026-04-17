import { StateCreator } from 'zustand';
import { ShipTypes } from '../DataTypes';
import { SpaceTraderState, QuestSlice } from './types';
import { ENCOUNTER_MONSTER, ENCOUNTER_DRAGONFLY, ENCOUNTER_SCARAB } from '../Encounter';
import {
  SPACEMONSTER,
  MONSTERKILLED,
  DRAGONFLY,
  FLYBARATAS,
  FLYMELINA,
  FLYREGULAS,
  DRAGONFLYDESTROYED,
  JAPORIDISEASE,
  MEDICINEDELIVERY,
  GETREACTOR,
  REACTORDELIVERED,
  GETSPECIALLASER,
  JAREK,
  JAREKGETSOUT,
  WILD,
  WILDGETSOUT,
  ALIENARTIFACT,
  ARTIFACTDELIVERY,
  SCARAB,
  SCARABDESTROYED,
  GETHULLUPGRADED,
  ALIENINVASION,
  GEMULONRESCUED,
  EXPERIMENT,
  EXPERIMENTSTOPPED,
  MOONBOUGHT,
  MOONFORSALE,
  SKILLINCREASE,
  ERASERECORD,
  CARGOFORSALE,
  LOTTERYWINNER,
  INSTALLLIGHTNINGSHIELD,
  INSTALLFUELCOMPACTOR,
  GEMULONINVADED,
  EXPERIMENTFAILED,
  ACAMARSYSTEM,
  BARATASSYSTEM,
  MELINASYSTEM,
  REGULASSYSTEM,
  ZALKONSYSTEM,
  JAPORISYSTEM,
  NIXSYSTEM,
  DEVIDIASYSTEM,
  KRAVATSYSTEM,
  GEMULONSYSTEM,
  DALEDSYSTEM,
  UTOPIASYSTEM,
} from '../SpecialEvents';

export const createQuestSlice: StateCreator<SpaceTraderState, [], [], QuestSlice> = (set, get) => ({
  monsterStatus: 0,
  dragonflyStatus: 0,
  japoriStatus: 0,
  reactorStatus: 0,
  jarekStatus: 0,
  wildStatus: 0,
  artifactStatus: 0,
  scarabStatus: 0,
  invasionStatus: 0,
  experimentStatus: 0,
  moonBought: false,

  jarekOnBoard: false,
  wildOnBoard: false,
  reactorOnBoard: false,
  artifactOnBoard: false,
  antidoteOnBoard: false,

  triggerSpecialEvent: (systemIdx: number) => {
    const state = get();
    const system = state.systems[systemIdx];
    if (!system || system.special < 0) return;

    const eventId = system.special;
    const newSystems = [...state.systems];
    const clearSpecial = () => {
      newSystems[systemIdx] = { ...newSystems[systemIdx], special: -1 };
    };

    switch (eventId) {
      // === SPACE MONSTER ===
      case SPACEMONSTER: {
        clearSpecial();
        set({ systems: newSystems, monsterStatus: 1 });
        return;
      }
      case MONSTERKILLED: {
        clearSpecial();
        set({
          systems: newSystems,
          monsterStatus: 2,
          credits: state.credits + 15000,
          reputationScore: state.reputationScore + 2,
        });
        return;
      }

      // === DRAGONFLY CHAIN ===
      case DRAGONFLY: {
        clearSpecial();
        set({ systems: newSystems, dragonflyStatus: 1 });
        return;
      }
      case FLYBARATAS: {
        clearSpecial();
        set({ systems: newSystems, dragonflyStatus: 2 });
        return;
      }
      case FLYMELINA: {
        clearSpecial();
        set({ systems: newSystems, dragonflyStatus: 3 });
        return;
      }
      case FLYREGULAS: {
        clearSpecial();
        set({ systems: newSystems, dragonflyStatus: 4 });
        return;
      }
      case DRAGONFLYDESTROYED: {
        // Award Lightning Shield — install in first empty shield slot
        const newShip = { ...state.ship };
        const newShields = [...newShip.shield];
        const newShieldStrength = [...newShip.shieldStrength];
        const emptySlot = newShields.indexOf(-1);
        // Lightning Shield: id=3 (index 2 in Shields array but we use a special id)
        // We'll use shield id 2 (the last standard shield) as the lightning shield
        // with boosted power. For now, install as shield type 2 with max strength.
        if (emptySlot >= 0) {
          newShields[emptySlot] = 2; // Lightning shield (best shield type)
          newShieldStrength[emptySlot] = 70; // Higher than normal reflective (60)
        }
        newShip.shield = newShields;
        newShip.shieldStrength = newShieldStrength;
        clearSpecial();
        set({ systems: newSystems, dragonflyStatus: 5, ship: newShip });
        return;
      }

      // === JAPORI DISEASE ===
      case JAPORIDISEASE: {
        const shipType = ShipTypes[state.ship.type];
        const usedCargo = state.ship.cargo.reduce((a, b) => a + b, 0);
        const specialBays = getSpecialCargoBays(state);
        const freeBays = shipType.cargoBays - usedCargo - specialBays;
        if (freeBays < 10) return; // Not enough room
        clearSpecial();
        set({ systems: newSystems, japoriStatus: 1, antidoteOnBoard: true });
        return;
      }
      case MEDICINEDELIVERY: {
        clearSpecial();
        set({
          systems: newSystems,
          japoriStatus: 2,
          antidoteOnBoard: false,
          pilotSkill: Math.min(10, state.pilotSkill + 2),
          fighterSkill: Math.min(10, state.fighterSkill + 2),
          traderSkill: Math.min(10, state.traderSkill + 2),
          engineerSkill: Math.min(10, state.engineerSkill + 2),
        });
        return;
      }

      // === MORGAN'S REACTOR ===
      case GETREACTOR: {
        const shipType = ShipTypes[state.ship.type];
        const usedCargo = state.ship.cargo.reduce((a, b) => a + b, 0);
        const specialBays = getSpecialCargoBays(state);
        const freeBays = shipType.cargoBays - usedCargo - specialBays;
        if (freeBays < 5) return; // Not enough room
        clearSpecial();
        set({ systems: newSystems, reactorStatus: 1, reactorOnBoard: true });
        return;
      }
      case REACTORDELIVERED: {
        clearSpecial();
        // Place the laser reward at Nix for when player returns with free weapon slot
        newSystems[NIXSYSTEM] = { ...newSystems[NIXSYSTEM], special: GETSPECIALLASER };
        set({
          systems: newSystems,
          reactorStatus: 2,
          reactorOnBoard: false,
        });
        return;
      }
      case GETSPECIALLASER: {
        // Install Morgan's Laser in first empty weapon slot
        const newShip = { ...state.ship };
        const newWeapons = [...newShip.weapon];
        const emptySlot = newWeapons.indexOf(-1);
        if (emptySlot < 0) return; // No free weapon slot
        newWeapons[emptySlot] = 2; // Military laser (best standard weapon, acts as Morgan's Laser)
        newShip.weapon = newWeapons;
        clearSpecial();
        set({ systems: newSystems, reactorStatus: 3, ship: newShip });
        return;
      }

      // === AMBASSADOR JAREK ===
      case JAREK: {
        clearSpecial();
        set({ systems: newSystems, jarekStatus: 1, jarekOnBoard: true });
        return;
      }
      case JAREKGETSOUT: {
        clearSpecial();
        set({
          systems: newSystems,
          jarekStatus: 2,
          jarekOnBoard: false,
          credits: state.credits + 3000,
        });
        return;
      }

      // === JONATHAN WILD ===
      case WILD: {
        clearSpecial();
        set({ systems: newSystems, wildStatus: 1, wildOnBoard: true });
        return;
      }
      case WILDGETSOUT: {
        clearSpecial();
        set({
          systems: newSystems,
          wildStatus: 2,
          wildOnBoard: false,
          credits: state.credits + 5000,
        });
        return;
      }

      // === ALIEN ARTIFACT ===
      case ALIENARTIFACT: {
        clearSpecial();
        set({ systems: newSystems, artifactStatus: 1, artifactOnBoard: true });
        return;
      }
      case ARTIFACTDELIVERY: {
        clearSpecial();
        set({
          systems: newSystems,
          artifactStatus: 2,
          artifactOnBoard: false,
          credits: state.credits + 20000,
        });
        return;
      }

      // === SCARAB ===
      case SCARAB: {
        clearSpecial();
        set({ systems: newSystems, scarabStatus: 1 });
        return;
      }
      case SCARABDESTROYED: {
        clearSpecial();
        // Place hull upgrade at a nearby system
        // For simplicity, place it at the current system itself
        newSystems[systemIdx] = { ...newSystems[systemIdx], special: GETHULLUPGRADED };
        set({ systems: newSystems, scarabStatus: 2 });
        return;
      }
      case GETHULLUPGRADED: {
        const newShip = { ...state.ship };
        newShip.hull = Math.min(ShipTypes[newShip.type].hullStrength + 50, newShip.hull + 50);
        clearSpecial();
        set({ systems: newSystems, scarabStatus: 3, ship: newShip });
        return;
      }

      // === GEMULON INVASION ===
      case ALIENINVASION: {
        clearSpecial();
        set({ systems: newSystems, invasionStatus: 1 });
        return;
      }
      case GEMULONRESCUED: {
        clearSpecial();
        // Fuel compactor: increase fuel tanks by 3 (permanent for this ship)
        const newShip = { ...state.ship };
        newShip.fuel = Math.min(newShip.fuel + 3, ShipTypes[newShip.type].fuelTanks + 3);
        set({
          systems: newSystems,
          invasionStatus: 2,
          credits: state.credits + 10000,
          ship: newShip,
        });
        return;
      }
      case GEMULONINVADED: {
        clearSpecial();
        // Devastate Gemulon
        newSystems[GEMULONSYSTEM] = {
          ...newSystems[GEMULONSYSTEM],
          techLevel: 0,
          special: -1,
        };
        set({ systems: newSystems, invasionStatus: -1 });
        return;
      }

      // === EXPERIMENT ===
      case EXPERIMENT: {
        clearSpecial();
        set({ systems: newSystems, experimentStatus: 1 });
        return;
      }
      case EXPERIMENTSTOPPED: {
        clearSpecial();
        set({
          systems: newSystems,
          experimentStatus: 2,
          credits: state.credits + 5000,
        });
        return;
      }
      case EXPERIMENTFAILED: {
        clearSpecial();
        // Damage nearby systems
        newSystems[DALEDSYSTEM] = {
          ...newSystems[DALEDSYSTEM],
          techLevel: 0,
          special: -1,
        };
        set({ systems: newSystems, experimentStatus: -1 });
        return;
      }

      // === MOON / WIN ===
      case MOONFORSALE: {
        clearSpecial();
        // Just informational — player needs to go to Utopia
        set({ systems: newSystems });
        return;
      }
      case MOONBOUGHT: {
        if (state.credits < 500000) return;
        clearSpecial();
        set({
          systems: newSystems,
          credits: state.credits - 500000,
          moonBought: true,
        });
        return;
      }

      // === ONE-OFF EVENTS ===
      case SKILLINCREASE: {
        clearSpecial();
        // Increase the lowest skill by 1
        const skills = [
          { key: 'pilotSkill' as const, val: state.pilotSkill },
          { key: 'fighterSkill' as const, val: state.fighterSkill },
          { key: 'traderSkill' as const, val: state.traderSkill },
          { key: 'engineerSkill' as const, val: state.engineerSkill },
        ];
        const lowest = skills.reduce((a, b) => (a.val <= b.val ? a : b));
        if (lowest.val < 10) {
          set({ systems: newSystems, [lowest.key]: lowest.val + 1 });
        } else {
          set({ systems: newSystems });
        }
        return;
      }
      case ERASERECORD: {
        if (state.credits < 5000) return;
        clearSpecial();
        set({
          systems: newSystems,
          credits: state.credits - 5000,
          policeRecordScore: 0,
        });
        return;
      }
      case CARGOFORSALE: {
        if (state.credits < 1000) return;
        const shipType = ShipTypes[state.ship.type];
        const usedCargo = state.ship.cargo.reduce((a, b) => a + b, 0);
        const specialBays = getSpecialCargoBays(state);
        if (shipType.cargoBays - usedCargo - specialBays < 3) return;
        const goodId = Math.floor(Math.random() * 10);
        const newCargo = [...state.ship.cargo];
        newCargo[goodId] += 3;
        clearSpecial();
        set({
          systems: newSystems,
          credits: state.credits - 1000,
          ship: { ...state.ship, cargo: newCargo },
        });
        return;
      }
      case LOTTERYWINNER: {
        clearSpecial();
        set({ systems: newSystems, credits: state.credits + 1000 });
        return;
      }

      default:
        return;
    }
  },

  handleQuestEncounterVictory: (encounterType: string) => {
    const state = get();
    const newSystems = [...state.systems];

    if (encounterType === ENCOUNTER_MONSTER && state.monsterStatus === 1) {
      // Monster killed — make Acamar's MONSTERKILLED event active
      // It should already be set from galaxy generation
      set({ monsterStatus: 2 });
    }

    if (encounterType === ENCOUNTER_DRAGONFLY && state.dragonflyStatus === 4) {
      // Dragonfly destroyed — activate DRAGONFLYDESTROYED at Zalkon
      // Should already be set from galaxy generation, so just advance status
      set({ dragonflyStatus: 5 });
    }

    if (encounterType === ENCOUNTER_SCARAB && state.scarabStatus === 1) {
      // Scarab destroyed — place SCARABDESTROYED event
      set({ scarabStatus: 2 });
    }
  },
});

/** Calculate cargo bays used by special quest cargo */
export function getSpecialCargoBays(state: {
  antidoteOnBoard: boolean;
  reactorOnBoard: boolean;
  jarekOnBoard: boolean;
  wildOnBoard: boolean;
  artifactOnBoard: boolean;
}): number {
  return (
    (state.antidoteOnBoard ? 10 : 0) +
    (state.reactorOnBoard ? 5 : 0) +
    (state.jarekOnBoard ? 1 : 0) +
    (state.wildOnBoard ? 1 : 0) +
    (state.artifactOnBoard ? 1 : 0)
  );
}
