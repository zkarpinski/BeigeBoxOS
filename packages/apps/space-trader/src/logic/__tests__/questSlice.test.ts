import { createStore } from 'zustand/vanilla';
import { createQuestSlice, getSpecialCargoBays } from '../store/questSlice';
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
  GEMULONINVADED,
  EXPERIMENT,
  EXPERIMENTSTOPPED,
  EXPERIMENTFAILED,
  MOONFORSALE,
  MOONBOUGHT,
  SKILLINCREASE,
  ERASERECORD,
  CARGOFORSALE,
  LOTTERYWINNER,
  GEMULONSYSTEM,
  DALEDSYSTEM,
  NIXSYSTEM,
} from '../SpecialEvents';
import { ShipTypes } from '../DataTypes';

function makePlayerShip(overrides: any = {}) {
  const type = overrides.type ?? 1; // Gnat default
  return {
    type,
    cargo: new Array(10).fill(0),
    weapon: new Array(3).fill(-1),
    shield: new Array(3).fill(-1),
    shieldStrength: new Array(3).fill(-1),
    gadget: new Array(3).fill(-1),
    escapePod: false,
    fuel: ShipTypes[type].fuelTanks,
    hull: ShipTypes[type].hullStrength,
    ...overrides,
  };
}

function createTestStore(overrides: Record<string, unknown> = {}) {
  return createStore<any>()((set, get, api) => ({
    ...createQuestSlice(set, get, api),
    credits: 1000,
    reputationScore: 0,
    policeRecordScore: 50,
    systems: Array.from({ length: 120 }, () => ({ special: -1, techLevel: 5 })),
    ship: makePlayerShip(),
    pilotSkill: 1,
    fighterSkill: 1,
    traderSkill: 1,
    engineerSkill: 1,
    ...overrides,
  })) as any;
}

describe('questSlice', () => {
  describe('getSpecialCargoBays', () => {
    it('sums all special cargo correctly', () => {
      expect(
        getSpecialCargoBays({
          antidoteOnBoard: true,
          reactorOnBoard: true,
          jarekOnBoard: true,
          wildOnBoard: true,
          artifactOnBoard: true,
        }),
      ).toBe(18); // 10 + 5 + 1 + 1 + 1
    });
  });

  describe('triggerSpecialEvent', () => {
    it('handles SPACEMONSTER chain', () => {
      const store = createTestStore({ systems: [{ special: SPACEMONSTER }] });
      store.getState().triggerSpecialEvent(0);
      expect(store.getState().monsterStatus).toBe(1);

      store.setState({ systems: [{ special: MONSTERKILLED }] });
      store.getState().triggerSpecialEvent(0);
      expect(store.getState().monsterStatus).toBe(2);
      expect(store.getState().credits).toBe(16000);
      expect(store.getState().reputationScore).toBe(2);
    });

    it('handles DRAGONFLY chain', () => {
      const store = createTestStore({ systems: [{ special: DRAGONFLY }] });
      store.getState().triggerSpecialEvent(0);
      expect(store.getState().dragonflyStatus).toBe(1);

      store.setState({ systems: [{ special: FLYBARATAS }] });
      store.getState().triggerSpecialEvent(0);
      expect(store.getState().dragonflyStatus).toBe(2);

      store.setState({ systems: [{ special: FLYMELINA }] });
      store.getState().triggerSpecialEvent(0);
      expect(store.getState().dragonflyStatus).toBe(3);

      store.setState({ systems: [{ special: FLYREGULAS }] });
      store.getState().triggerSpecialEvent(0);
      expect(store.getState().dragonflyStatus).toBe(4);

      store.setState({ systems: [{ special: DRAGONFLYDESTROYED }] });
      store.getState().triggerSpecialEvent(0);
      expect(store.getState().dragonflyStatus).toBe(5);
      expect(store.getState().ship.shield[0]).toBe(2); // Lightning shield
    });

    it('handles JAPORIDISEASE chain', () => {
      const store = createTestStore({ systems: [{ special: JAPORIDISEASE }] });
      store.getState().triggerSpecialEvent(0);
      expect(store.getState().japoriStatus).toBe(1);
      expect(store.getState().antidoteOnBoard).toBe(true);

      store.setState({ systems: [{ special: MEDICINEDELIVERY }] });
      store.getState().triggerSpecialEvent(0);
      expect(store.getState().japoriStatus).toBe(2);
      expect(store.getState().antidoteOnBoard).toBe(false);
      expect(store.getState().pilotSkill).toBe(2);
    });

    it('denies JAPORI if insufficient cargo', () => {
      const store = createTestStore({
        systems: [{ special: JAPORIDISEASE }],
        ship: makePlayerShip({ cargo: new Array(10).fill(100) }), // full
      });
      store.getState().triggerSpecialEvent(0);
      expect(store.getState().japoriStatus).toBe(0);
    });

    it('handles REACTOR chain', () => {
      const store = createTestStore({ systems: [{ special: GETREACTOR }] });
      store.getState().triggerSpecialEvent(0);
      expect(store.getState().reactorStatus).toBe(1);
      expect(store.getState().reactorOnBoard).toBe(true);

      store.setState({ systems: [{ special: REACTORDELIVERED }] });
      store.getState().triggerSpecialEvent(0);
      expect(store.getState().reactorStatus).toBe(2);
      expect(store.getState().systems[NIXSYSTEM].special).toBe(GETSPECIALLASER);

      store.setState({ systems: [{ special: GETSPECIALLASER }] });
      store.getState().triggerSpecialEvent(0);
      expect(store.getState().reactorStatus).toBe(3);
      expect(store.getState().ship.weapon[0]).toBe(2);
    });

    it('handles JAREK chain', () => {
      const store = createTestStore({ systems: [{ special: JAREK }] });
      store.getState().triggerSpecialEvent(0);
      expect(store.getState().jarekStatus).toBe(1);

      store.setState({ systems: [{ special: JAREKGETSOUT }] });
      store.getState().triggerSpecialEvent(0);
      expect(store.getState().jarekStatus).toBe(2);
      expect(store.getState().credits).toBe(4000);
    });

    it('handles WILD chain', () => {
      const store = createTestStore({ systems: [{ special: WILD }] });
      store.getState().triggerSpecialEvent(0);
      expect(store.getState().wildStatus).toBe(1);

      store.setState({ systems: [{ special: WILDGETSOUT }] });
      store.getState().triggerSpecialEvent(0);
      expect(store.getState().wildStatus).toBe(2);
      expect(store.getState().credits).toBe(6000);
    });

    it('handles ALIENARTIFACT chain', () => {
      const store = createTestStore({ systems: [{ special: ALIENARTIFACT }] });
      store.getState().triggerSpecialEvent(0);
      expect(store.getState().artifactStatus).toBe(1);

      store.setState({ systems: [{ special: ARTIFACTDELIVERY }] });
      store.getState().triggerSpecialEvent(0);
      expect(store.getState().artifactStatus).toBe(2);
      expect(store.getState().credits).toBe(21000);
    });

    it('handles SCARAB chain', () => {
      const store = createTestStore({ systems: [{ special: SCARAB }] });
      store.getState().triggerSpecialEvent(0);
      expect(store.getState().scarabStatus).toBe(1);

      store.setState({ systems: [{ special: SCARABDESTROYED }] });
      store.getState().triggerSpecialEvent(0);
      expect(store.getState().scarabStatus).toBe(2);
      expect(store.getState().systems[0].special).toBe(GETHULLUPGRADED);

      store.setState({ systems: [{ special: GETHULLUPGRADED }] });
      store.getState().triggerSpecialEvent(0);
      expect(store.getState().scarabStatus).toBe(3);
      expect(store.getState().ship.hull).toBe(ShipTypes[1].hullStrength + 50);
    });

    it('handles ALIENINVASION chain', () => {
      const store = createTestStore({ systems: [{ special: ALIENINVASION }] });
      store.getState().triggerSpecialEvent(0);
      expect(store.getState().invasionStatus).toBe(1);

      store.setState({ systems: [{ special: GEMULONRESCUED }] });
      store.getState().triggerSpecialEvent(0);
      expect(store.getState().invasionStatus).toBe(2);
      expect(store.getState().ship.fuel).toBe(ShipTypes[1].fuelTanks + 3);

      store.setState({ systems: [{ special: GEMULONINVADED }] });
      store.getState().triggerSpecialEvent(0);
      expect(store.getState().invasionStatus).toBe(-1);
      expect(store.getState().systems[GEMULONSYSTEM].techLevel).toBe(0);
    });

    it('handles EXPERIMENT chain', () => {
      const store = createTestStore({ systems: [{ special: EXPERIMENT }] });
      store.getState().triggerSpecialEvent(0);
      expect(store.getState().experimentStatus).toBe(1);

      store.setState({ systems: [{ special: EXPERIMENTSTOPPED }] });
      store.getState().triggerSpecialEvent(0);
      expect(store.getState().experimentStatus).toBe(2);
      expect(store.getState().credits).toBe(6000);

      store.setState({ systems: [{ special: EXPERIMENTFAILED }] });
      store.getState().triggerSpecialEvent(0);
      expect(store.getState().experimentStatus).toBe(-1);
      expect(store.getState().systems[DALEDSYSTEM].techLevel).toBe(0);
    });

    it('handles MOON FOR SALE and MOON BOUGHT', () => {
      const store = createTestStore({ systems: [{ special: MOONFORSALE }] });
      store.getState().triggerSpecialEvent(0); // Validates it does nothing but message

      store.setState({ systems: [{ special: MOONBOUGHT }], credits: 500000 });
      store.getState().triggerSpecialEvent(0);
      expect(store.getState().moonBought).toBe(true);
      expect(store.getState().credits).toBe(0);
    });

    it('denies MOON BOUGHT if broke', () => {
      const store = createTestStore({ systems: [{ special: MOONBOUGHT }], credits: 0 });
      store.getState().triggerSpecialEvent(0);
      expect(store.getState().moonBought).toBe(false);
    });

    it('handles SKILLINCREASE', () => {
      const store = createTestStore({ systems: [{ special: SKILLINCREASE }] });
      store.getState().triggerSpecialEvent(0);
      expect(store.getState().pilotSkill).toBe(2);
    });

    it('handles ERASERECORD', () => {
      const store = createTestStore({ systems: [{ special: ERASERECORD }], credits: 10000 });
      store.getState().triggerSpecialEvent(0);
      expect(store.getState().policeRecordScore).toBe(0);
      expect(store.getState().credits).toBe(5000);
    });

    it('handles CARGOFORSALE', () => {
      const store = createTestStore({ systems: [{ special: CARGOFORSALE }], credits: 10000 });
      store.getState().triggerSpecialEvent(0);
      expect(store.getState().credits).toBe(9000);
      expect(store.getState().ship.cargo.reduce((a: number, b: number) => a + b, 0)).toBe(3);
    });

    it('handles LOTTERYWINNER', () => {
      const store = createTestStore({ systems: [{ special: LOTTERYWINNER }] });
      store.getState().triggerSpecialEvent(0);
      expect(store.getState().credits).toBe(2000);
    });

    it('ignores invalid special events', () => {
      const store = createTestStore({ systems: [{ special: 999 }] });
      store.getState().triggerSpecialEvent(0);
      // Ensure nothing crashes
      expect(store.getState().credits).toBe(1000);
    });
  });

  describe('handleQuestEncounterVictory', () => {
    it('advances monster quest', () => {
      const store = createTestStore({ monsterStatus: 1 });
      store.getState().handleQuestEncounterVictory('MONSTER');
      expect(store.getState().monsterStatus).toBe(2);
    });

    it('advances dragonfly quest', () => {
      const store = createTestStore({ dragonflyStatus: 4 });
      store.getState().handleQuestEncounterVictory('DRAGONFLY');
      expect(store.getState().dragonflyStatus).toBe(5);
    });

    it('advances scarab quest', () => {
      const store = createTestStore({ scarabStatus: 1 });
      store.getState().handleQuestEncounterVictory('SCARAB');
      expect(store.getState().scarabStatus).toBe(2);
    });
  });
});
