import { generateGalaxy } from '../SystemGenerator';
import {
  SpecialEvents,
  SPACEMONSTER,
  DRAGONFLY,
  JAPORIDISEASE,
  JAREK,
  WILD,
  ALIENARTIFACT,
  SCARAB,
  ALIENINVASION,
  EXPERIMENT,
  SKILLINCREASE,
  ERASERECORD,
  CARGOFORSALE,
  LOTTERYWINNER,
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
  GEMULONRESCUED,
  EXPERIMENTSTOPPED,
  ACAMARSYSTEM,
  BARATASSYSTEM,
  MELINASYSTEM,
  REGULASSYSTEM,
  ZALKONSYSTEM,
  JAPORISYSTEM,
  UTOPIASYSTEM,
  DEVIDIASYSTEM,
  KRAVATSYSTEM,
  GEMULONSYSTEM,
  DALEDSYSTEM,
  NIXSYSTEM,
} from '../SpecialEvents';

describe('SpecialEvents definitions', () => {
  it('has definitions for all quest-starting events', () => {
    const starters = [
      SPACEMONSTER,
      DRAGONFLY,
      JAPORIDISEASE,
      JAREK,
      WILD,
      ALIENARTIFACT,
      SCARAB,
      ALIENINVASION,
      EXPERIMENT,
    ];
    for (const id of starters) {
      expect(SpecialEvents[id]).toBeDefined();
      expect(SpecialEvents[id].title).toBeTruthy();
      expect(SpecialEvents[id].description).toBeTruthy();
    }
  });

  it('has definitions for all destination/reward events', () => {
    const destinations = [
      MONSTERKILLED,
      FLYBARATAS,
      FLYMELINA,
      FLYREGULAS,
      DRAGONFLYDESTROYED,
      MEDICINEDELIVERY,
      MOONBOUGHT,
      JAREKGETSOUT,
      WILDGETSOUT,
      REACTORDELIVERED,
      GEMULONRESCUED,
      EXPERIMENTSTOPPED,
    ];
    for (const id of destinations) {
      expect(SpecialEvents[id]).toBeDefined();
    }
  });

  it('has definitions for one-off events', () => {
    const oneOffs = [SKILLINCREASE, ERASERECORD, CARGOFORSALE, LOTTERYWINNER];
    for (const id of oneOffs) {
      expect(SpecialEvents[id]).toBeDefined();
    }
  });

  it('marks information-only events as justAMessage', () => {
    expect(SpecialEvents[MONSTERKILLED].justAMessage).toBe(true);
    expect(SpecialEvents[FLYBARATAS].justAMessage).toBe(true);
    expect(SpecialEvents[LOTTERYWINNER].justAMessage).toBe(true);
    expect(SpecialEvents[SKILLINCREASE].justAMessage).toBe(true);
  });

  it('marks accept/decline events as not justAMessage', () => {
    expect(SpecialEvents[SPACEMONSTER].justAMessage).toBe(false);
    expect(SpecialEvents[DRAGONFLY].justAMessage).toBe(false);
    expect(SpecialEvents[JAPORIDISEASE].justAMessage).toBe(false);
    expect(SpecialEvents[ERASERECORD].justAMessage).toBe(false);
  });
});

describe('Galaxy generation with special events', () => {
  it('places fixed destination events on named systems', () => {
    const { systems } = generateGalaxy();

    expect(systems[ACAMARSYSTEM].special).toBe(MONSTERKILLED);
    expect(systems[BARATASSYSTEM].special).toBe(FLYBARATAS);
    expect(systems[MELINASYSTEM].special).toBe(FLYMELINA);
    expect(systems[REGULASSYSTEM].special).toBe(FLYREGULAS);
    expect(systems[ZALKONSYSTEM].special).toBe(DRAGONFLYDESTROYED);
    expect(systems[JAPORISYSTEM].special).toBe(MEDICINEDELIVERY);
    expect(systems[UTOPIASYSTEM].special).toBe(MOONBOUGHT);
    expect(systems[DEVIDIASYSTEM].special).toBe(JAREKGETSOUT);
    expect(systems[KRAVATSYSTEM].special).toBe(WILDGETSOUT);
    expect(systems[GEMULONSYSTEM].special).toBe(GEMULONRESCUED);
    expect(systems[DALEDSYSTEM].special).toBe(EXPERIMENTSTOPPED);
  });

  it('places quest-starting events on random systems', () => {
    const { systems } = generateGalaxy();
    const specials = systems.map((s) => s.special).filter((s) => s >= 0);

    // Check that quest starters were placed
    expect(specials).toContain(SPACEMONSTER);
    expect(specials).toContain(DRAGONFLY);
    expect(specials).toContain(JAPORIDISEASE);
    expect(specials).toContain(JAREK);
    expect(specials).toContain(WILD);
    expect(specials).toContain(ALIENARTIFACT);
    expect(specials).toContain(SCARAB);
  });

  it('places reactor quest at distance >= 70 from Nix', () => {
    const { systems } = generateGalaxy();

    const reactorIdx = systems.findIndex((s) => s.special === GETREACTOR);
    expect(reactorIdx).toBeGreaterThanOrEqual(0);

    const nix = systems[NIXSYSTEM];
    const reactor = systems[reactorIdx];
    const dist = Math.sqrt((nix.x - reactor.x) ** 2 + (nix.y - reactor.y) ** 2);
    expect(dist).toBeGreaterThanOrEqual(70);

    // Nix should have REACTORDELIVERED
    expect(systems[NIXSYSTEM].special).toBe(REACTORDELIVERED);
  });

  it('places time-sensitive events with countDown > 0', () => {
    const { systems } = generateGalaxy();

    const invasionSystem = systems.find((s) => s.special === ALIENINVASION);
    expect(invasionSystem).toBeDefined();
    expect(invasionSystem!.countDown).toBe(7);

    const experimentSystem = systems.find((s) => s.special === EXPERIMENT);
    expect(experimentSystem).toBeDefined();
    expect(experimentSystem!.countDown).toBe(6);
  });

  it('places one-off events', () => {
    const { systems } = generateGalaxy();
    const specials = systems.map((s) => s.special).filter((s) => s >= 0);

    // At least some one-offs should be placed
    const oneOffIds = [SKILLINCREASE, ERASERECORD, CARGOFORSALE, LOTTERYWINNER];
    const placedOneOffs = oneOffIds.filter((id) => specials.includes(id));
    expect(placedOneOffs.length).toBeGreaterThan(0);
  });

  it('does not place quest starters on reserved systems', () => {
    const { systems } = generateGalaxy();
    const reserved = [
      ACAMARSYSTEM,
      BARATASSYSTEM,
      MELINASYSTEM,
      REGULASSYSTEM,
      ZALKONSYSTEM,
      JAPORISYSTEM,
      UTOPIASYSTEM,
      DEVIDIASYSTEM,
      KRAVATSYSTEM,
      GEMULONSYSTEM,
      DALEDSYSTEM,
    ];

    const questStarters = [
      SPACEMONSTER,
      DRAGONFLY,
      JAPORIDISEASE,
      JAREK,
      WILD,
      ALIENARTIFACT,
      SCARAB,
    ];

    for (const idx of reserved) {
      const spec = systems[idx].special;
      expect(questStarters).not.toContain(spec);
    }
  });

  it('all systems have special and countDown fields', () => {
    const { systems } = generateGalaxy();
    for (const sys of systems) {
      expect(typeof sys.special).toBe('number');
      expect(typeof sys.countDown).toBe('number');
    }
  });
});
