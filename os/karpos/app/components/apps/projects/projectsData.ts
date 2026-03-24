export type ProjectItem = {
  id: string;
  title: string;
  category: string;
  year: string;
  summary: string;
  tags: string[];
  screenshotUrl: string;
  githubUrl?: string;
};

// Parsed from public LinkedIn profile projects section (first draft).
export const FEATURED_PROJECTS: ProjectItem[] = [
  {
    id: 'codeinsight-sdk-python',
    title: 'codeinsight-sdk-python',
    category: 'Featured Projects',
    year: '2023-???',
    summary: 'A Python client SDK for Revenera Code Insight.',
    tags: ['Python', 'SDK', 'Open Source'],
    screenshotUrl: '/og-image.png',
    githubUrl: 'https://github.com/zkarpinski/codeinsight-sdk-python',
  },
  {
    id: 'luminous-onion',
    title: 'Luminous Onion',
    category: 'Featured Projects',
    year: '2023-???',
    summary:
      'Vulnerability management app that ingests findings from third-party tools with risk scoring and analytics.',
    tags: ['Security', 'Vulnerability Mgmt', 'Analytics'],
    screenshotUrl: '/og-image.png',
    githubUrl: 'https://github.com/zkarpinski/Luminous-Onion',
  },
  {
    id: 'work-order-tracker',
    title: 'Work Order Tracker',
    category: 'Featured Projects',
    year: '2017-2020',
    summary: 'Work order tracking project listed on LinkedIn (2017-2020).',
    tags: ['Tracking', 'Workflow', 'Operations'],
    screenshotUrl: '/og-image.png',
  },
  {
    id: 'desktop-error-reporting-program',
    title: 'Desktop Error Reporting Program (DERP)',
    category: 'Featured Projects',
    year: '2015-2016',
    summary: 'Desktop error reporting utility listed on LinkedIn (2015-2016).',
    tags: ['Desktop', 'Reporting', 'Automation'],
    screenshotUrl: '/og-image.png',
    githubUrl: 'https://github.com/zkarpinski/DesktopErrorReportingProgram',
  },
  {
    id: 't-driver',
    title: 'T-Driver',
    category: 'Featured Projects',
    year: '2014-2016',
    summary:
      'Automation tool for T: Drive document delivery via email/fax/print with zero-touch processing.',
    tags: ['C#', 'RightFax API', 'Automation'],
    screenshotUrl: '/og-image.png',
    githubUrl: 'https://github.com/zKarp/T-Driver',
  },
];

export const LEGACY_AND_EXPERIMENTS: ProjectItem[] = [
  {
    id: 'gas-meter-shutoff-database',
    title: 'Gas Meter Shutoff Database',
    category: 'Legacy & Experiments',
    year: '2015-2016',
    summary:
      'Access database with separated frontend/backend; led design and maintenance for user-friendly workflows.',
    tags: ['Access', 'Database', 'Forms'],
    screenshotUrl: '/og-image.png',
  },
  {
    id: 'samuel',
    title: 'SAMuel',
    category: 'Legacy & Experiments',
    year: '2014-2016',
    summary:
      'Tool-set for automating email/fax/customer-account processing workflows across operational tasks.',
    tags: ['VB.Net', 'VBA', 'Automation'],
    screenshotUrl: '/og-image.png',
    githubUrl: 'https://github.com/zKarp/SAMuel',
  },
  {
    id: 'rightfax-it',
    title: 'RightFax It',
    category: 'Legacy & Experiments',
    year: '2014',
    summary: 'RightFax-focused automation utility listed on LinkedIn.',
    tags: ['RightFax', 'Automation', 'Utilities'],
    screenshotUrl: '/og-image.png',
    githubUrl: 'https://github.com/zKarp/RightFax-It',
  },
  {
    id: 'hackathon-2011-game',
    title: 'Hackathon 2011 Game',
    category: 'Legacy & Experiments',
    year: '2011',
    summary:
      'Python/pygame game built in a 12-hour university hackathon by a collaborative student team.',
    tags: ['Python', 'Pygame', 'Hackathon'],
    screenshotUrl: '/og-image.png',
    githubUrl: 'https://github.com/UniversityOfKentuckyACM/HackathonF2011',
  },
  {
    id: 'azure-rps-bot',
    title: 'Azure: Rock Paper Scissors Bot',
    category: 'Legacy & Experiments',
    year: '2011',
    summary: 'C# bot entry for Microsoft Azure Rock-Paper-Scissors contest (2011).',
    tags: ['C#', 'Azure', 'Bot'],
    screenshotUrl: '/og-image.png',
    githubUrl: 'https://github.com/zKarp/samples/tree/master/AzureBot',
  },
];

export const ALL_PROJECTS: ProjectItem[] = [...FEATURED_PROJECTS, ...LEGACY_AND_EXPERIMENTS];
