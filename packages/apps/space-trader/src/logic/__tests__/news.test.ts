import { generateNews } from '../News';
import { SolarSystem, UNEVENTFUL } from '../DataTypes';
import { SPACEMONSTER, ALIENINVASION, EXPERIMENT } from '../SpecialEvents';

function makeSystem(overrides: Partial<SolarSystem> = {}): SolarSystem {
  return {
    nameIndex: 0,
    x: 50,
    y: 50,
    techLevel: 4,
    politics: 0,
    status: UNEVENTFUL,
    size: 2,
    specialResources: 0,
    visited: true,
    special: -1,
    countDown: 0,
    ...overrides,
  } as SolarSystem;
}

const defaultQuestState = {
  monsterStatus: 0,
  dragonflyStatus: 0,
  scarabStatus: 0,
  invasionStatus: 0,
  experimentStatus: 0,
  japoriStatus: 0,
  wildStatus: 0,
  jarekStatus: 0,
};

describe('generateNews', () => {
  it('returns at least 3 headlines', () => {
    const system = makeSystem();
    const headlines = generateNews(system, [system], defaultQuestState);
    expect(headlines.length).toBeGreaterThanOrEqual(3);
  });

  it('returns at most 5 headlines', () => {
    const system = makeSystem({ status: 1 }); // at war
    const systems = Array.from({ length: 10 }, (_, i) =>
      makeSystem({ nameIndex: i, status: i % 3 === 0 ? 2 : UNEVENTFUL }),
    );
    const headlines = generateNews(system, systems, {
      ...defaultQuestState,
      monsterStatus: 1,
      invasionStatus: 1,
      experimentStatus: 1,
    });
    expect(headlines.length).toBeLessThanOrEqual(5);
  });

  it('includes status-based headline for system at war', () => {
    const system = makeSystem({ status: 1 });
    const headlines = generateNews(system, [system], defaultQuestState);
    const hasWarHeadline = headlines.some(
      (h) => h.includes('War') || h.includes('Military') || h.includes('Conflict'),
    );
    expect(hasWarHeadline).toBe(true);
  });

  it('includes monster headline when monster quest is active', () => {
    const monsterSystem = makeSystem({ nameIndex: 5, special: SPACEMONSTER });
    const headlines = generateNews(makeSystem(), [makeSystem(), monsterSystem], {
      ...defaultQuestState,
      monsterStatus: 1,
    });
    const hasMonster = headlines.some((h) => h.includes('Monster'));
    expect(hasMonster).toBe(true);
  });

  it('includes invasion headline when invasion is active', () => {
    const headlines = generateNews(makeSystem(), [makeSystem()], {
      ...defaultQuestState,
      invasionStatus: 1,
    });
    const hasInvasion = headlines.some((h) => h.includes('Invasion') || h.includes('Gemulon'));
    expect(hasInvasion).toBe(true);
  });

  it('includes experiment headline when experiment is active', () => {
    const headlines = generateNews(makeSystem(), [makeSystem()], {
      ...defaultQuestState,
      experimentStatus: 1,
    });
    const hasExperiment = headlines.some((h) => h.includes('Experiment') || h.includes('Daled'));
    expect(hasExperiment).toBe(true);
  });

  it('includes dragonfly headline when dragonfly quest is active', () => {
    const headlines = generateNews(makeSystem(), [makeSystem()], {
      ...defaultQuestState,
      dragonflyStatus: 2,
    });
    const hasDragonfly = headlines.some((h) => h.includes('Unidentified Ship'));
    expect(hasDragonfly).toBe(true);
  });

  it('includes scarab headline when scarab quest is active', () => {
    const headlines = generateNews(makeSystem(), [makeSystem()], {
      ...defaultQuestState,
      scarabStatus: 1,
    });
    const hasScarab = headlines.some((h) => h.includes('Stolen') || h.includes('Experimental'));
    expect(hasScarab).toBe(true);
  });

  it('includes devastation headline when invasion failed', () => {
    const headlines = generateNews(makeSystem(), [makeSystem()], {
      ...defaultQuestState,
      invasionStatus: -1,
    });
    const hasDevastation = headlines.some((h) => h.includes('Devastated'));
    expect(hasDevastation).toBe(true);
  });

  it('fills with generic headlines for peaceful systems', () => {
    const system = makeSystem();
    const headlines = generateNews(system, [system], defaultQuestState);
    expect(headlines.length).toBe(3);
    // All should be generic (no quest/status headlines)
    headlines.forEach((h) => {
      expect(typeof h).toBe('string');
      expect(h.length).toBeGreaterThan(0);
    });
  });

  it('includes japori headline when disease quest is active', () => {
    const headlines = generateNews(makeSystem(), [makeSystem()], {
      ...defaultQuestState,
      japoriStatus: 1,
    });
    const hasJapori = headlines.some((h) => h.includes('Japori') || h.includes('Antidote'));
    expect(hasJapori).toBe(true);
  });
});
