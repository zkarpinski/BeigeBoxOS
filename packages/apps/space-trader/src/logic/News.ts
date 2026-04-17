import { SolarSystem, SystemNames, UNEVENTFUL } from './DataTypes';
import {
  SPACEMONSTER,
  DRAGONFLY,
  SCARAB,
  ALIENINVASION,
  EXPERIMENT,
  GEMULONINVADED,
  EXPERIMENTFAILED,
  JAPORIDISEASE,
  JAREK,
  WILD,
  GETREACTOR,
} from './SpecialEvents';

// OG: News headlines based on system status
const STATUS_HEADLINES: Record<number, string[]> = {
  1: [
    'War News: Casualties Mounting!',
    'Military Buildup in the Region!',
    'Trade Routes Disrupted by Conflict!',
  ],
  2: [
    'Plague Spreading Rapidly!',
    'Hospitals Overwhelmed by Epidemic!',
    'Cure Remains Elusive as Disease Spreads!',
  ],
  3: [
    'Severe Drought Continues!',
    'Water Rationing in Effect!',
    'Crops Withering from Lack of Rain!',
  ],
  4: [
    'Entertainment Shortage Reported!',
    'Citizens Demand More Recreation!',
    'Boredom Leads to Increase in Petty Crime!',
  ],
  5: [
    'Record Cold Spell Grips Region!',
    'Heating Fuel Prices Soar!',
    'Frostbite Cases on the Rise!',
  ],
  6: [
    'Crop Failure Leads to Food Shortage!',
    'Farmers Report Worst Harvest in Decades!',
    'Food Prices Skyrocket!',
  ],
  7: [
    'Labor Shortage Hampers Production!',
    'Factories Cutting Output Due to Worker Shortage!',
    'Immigration Incentives Being Considered!',
  ],
};

// Generic filler headlines
const GENERIC_HEADLINES = [
  'Market Prices Stable This Quarter.',
  'New Trade Routes Open to Neighboring Systems.',
  'Local Officials Report Steady Growth.',
  'Tourists Flock to the Region.',
  'Scientists Make Breakthrough in Terraforming.',
  'Annual Festival Draws Record Crowds.',
  'Transport Workers Negotiate New Contract.',
  'Mining Operations Report Record Output.',
  'Local Tech Firm Announces Expansion.',
];

const getRandom = (max: number) => Math.floor(Math.random() * max);

export function generateNews(
  system: SolarSystem,
  allSystems: SolarSystem[],
  questState: {
    monsterStatus: number;
    dragonflyStatus: number;
    scarabStatus: number;
    invasionStatus: number;
    experimentStatus: number;
    japoriStatus: number;
    wildStatus: number;
    jarekStatus: number;
  },
): string[] {
  const headlines: string[] = [];
  const sysName = SystemNames[system.nameIndex];

  // Status-based headline
  if (system.status !== UNEVENTFUL && STATUS_HEADLINES[system.status]) {
    const pool = STATUS_HEADLINES[system.status];
    headlines.push(pool[getRandom(pool.length)]);
  }

  // Quest-related headlines visible system-wide
  for (const s of allSystems) {
    if (s.special === SPACEMONSTER && questState.monsterStatus <= 1) {
      headlines.push(`Huge Space Monster Reported Near ${SystemNames[s.nameIndex]}!`);
      break;
    }
  }

  if (questState.dragonflyStatus >= 1 && questState.dragonflyStatus <= 4) {
    headlines.push('Unidentified Ship Sighted in Several Systems!');
  }

  if (questState.scarabStatus >= 1) {
    headlines.push('Stolen Experimental Ship Still at Large!');
  }

  if (questState.invasionStatus === 1) {
    headlines.push('Alien Invasion Threatens Gemulon!');
  }
  if (questState.invasionStatus === -1) {
    headlines.push('Gemulon Devastated by Alien Invasion!');
  }

  if (questState.experimentStatus === 1) {
    headlines.push('Scientists Warn of Dangerous Experiment at Daled!');
  }
  if (questState.experimentStatus === -1) {
    headlines.push('Failed Experiment Destroys Daled!');
  }

  if (questState.japoriStatus === 1) {
    headlines.push('Disease Ravages Japori System! Antidote Needed!');
  }

  // Nearby system status headlines
  for (const s of allSystems) {
    if (s.nameIndex === system.nameIndex) continue;
    if (s.status !== UNEVENTFUL && STATUS_HEADLINES[s.status] && Math.random() < 0.3) {
      const nearName = SystemNames[s.nameIndex];
      headlines.push(`Reports of Unrest in ${nearName} System.`);
      break;
    }
  }

  // Fill with generics if we don't have enough
  while (headlines.length < 3) {
    const generic = GENERIC_HEADLINES[getRandom(GENERIC_HEADLINES.length)];
    if (!headlines.includes(generic)) {
      headlines.push(generic);
    }
  }

  return headlines.slice(0, 5);
}
