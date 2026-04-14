import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EncounterModal } from './EncounterModal';
import { useSpaceTraderGame } from '../../logic/useSpaceTraderGame';

jest.mock('../../logic/useSpaceTraderGame');

// Ship type IDs → names (matches ShipTypes in DataTypes.ts and aria-label in ShipSprites.tsx)
const SHIP_NAMES = [
  'Flea', // 0
  'Gnat', // 1
  'Firefly', // 2
  'Mosquito', // 3
  'Bumblebee', // 4
  'Beetle', // 5
  'Hornet', // 6
  'Grasshopper', // 7
  'Termite', // 8
  'Wasp', // 9
];

function makeNPC(shipType: number) {
  return {
    ship: {
      type: shipType,
      hull: 100,
      cargo: new Array(10).fill(0),
      weapon: [0, -1, -1],
      shield: [-1, -1, -1],
      shieldStrength: [-1, -1, -1],
      gadget: [-1, -1, -1],
      escapePod: false,
      fuel: 14,
    },
    fighterSkill: 4,
    pilotSkill: 4,
    engineerSkill: 4,
    bounty: 50,
    lootCargo: new Array(10).fill(0),
  };
}

function makeStore(playerShipType: number, npcShipType: number, overrides = {}) {
  return {
    encounter: {
      type: 'PIRATE',
      npc: makeNPC(npcShipType),
      log: [],
      round: 0,
      resolved: false,
      playerWon: false,
      clickNumber: 5,
      destinationSystemIdx: 0,
    },
    clearEncounter: jest.fn(),
    attackInEncounter: jest.fn(),
    fleeFromEncounter: jest.fn(),
    surrenderToEncounter: jest.fn(),
    bribePolice: jest.fn(),
    lootNPC: jest.fn(),
    tradeWithNPC: jest.fn(),
    pendingEncounters: [],
    ship: {
      type: playerShipType,
      hull: 100,
      shieldStrength: [-1, -1, -1],
      cargo: new Array(10).fill(0),
      weapon: [0, -1, -1],
      shield: [-1, -1, -1],
      gadget: [-1, -1, -1],
      escapePod: false,
      fuel: 14,
    },
    systems: [
      {
        nameIndex: 0,
        x: 0,
        y: 0,
        visited: true,
        politics: 6,
        techLevel: 5,
        size: 1,
        specialResources: 0,
        status: 0,
      },
    ],
    currentSystem: 0,
    ...overrides,
  };
}

describe('EncounterModal — ship sprites', () => {
  it('renders the correct player sprite by aria-label', () => {
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue(makeStore(1, 3));
    render(<EncounterModal />);
    // Player is Gnat (type 1), NPC is Mosquito (type 3)
    expect(screen.getByRole('img', { name: 'Gnat' })).toBeInTheDocument();
  });

  it('renders the correct NPC sprite by aria-label', () => {
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue(makeStore(1, 3));
    render(<EncounterModal />);
    expect(screen.getByRole('img', { name: 'Mosquito' })).toBeInTheDocument();
  });

  it('renders two separate sprites when player and NPC are different ship types', () => {
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue(makeStore(1, 4));
    render(<EncounterModal />);
    expect(screen.getByRole('img', { name: 'Gnat' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Bumblebee' })).toBeInTheDocument();
  });

  it('renders two sprites with the same name when both ships are the same type', () => {
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue(makeStore(1, 1));
    render(<EncounterModal />);
    const sprites = screen.getAllByRole('img', { name: 'Gnat' });
    expect(sprites).toHaveLength(2);
  });

  // Verify each ship type maps to the correct sprite label
  const shipCases: Array<[number, string]> = [
    [0, 'Flea'],
    [1, 'Gnat'],
    [2, 'Firefly'],
    [3, 'Mosquito'],
    [4, 'Bumblebee'],
    [5, 'Beetle'],
    [6, 'Hornet'],
    [7, 'Grasshopper'],
    [8, 'Termite'],
    [9, 'Wasp'],
  ];

  test.each(shipCases)(
    'player ship type %i renders sprite labelled "%s"',
    (shipTypeId, expectedLabel) => {
      // Use NPC type 1 (Gnat) unless player is also Gnat, then use 0 (Flea)
      const npcType = shipTypeId === 1 ? 0 : 1;
      (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue(makeStore(shipTypeId, npcType));
      render(<EncounterModal />);
      // At least one sprite with the player's ship label must be present
      expect(screen.getAllByRole('img', { name: expectedLabel }).length).toBeGreaterThanOrEqual(1);
    },
  );

  test.each(shipCases)(
    'NPC ship type %i renders sprite labelled "%s"',
    (shipTypeId, expectedLabel) => {
      const playerType = shipTypeId === 1 ? 0 : 1;
      (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue(
        makeStore(playerType, shipTypeId),
      );
      render(<EncounterModal />);
      expect(screen.getAllByRole('img', { name: expectedLabel }).length).toBeGreaterThanOrEqual(1);
    },
  );

  it('NPC sprite is horizontally mirrored (scaleX -1 transform)', () => {
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue(makeStore(1, 3));
    const { container } = render(<EncounterModal />);
    // The NPC sprite wrapper has scaleX(-1); player wrapper does not
    const wrappers = container.querySelectorAll<HTMLElement>('[style*="scaleX"]');
    expect(wrappers.length).toBeGreaterThanOrEqual(1);
    const mirroredWrapper = wrappers[0];
    expect(mirroredWrapper.style.transform).toBe('scaleX(-1)');
  });
});

describe('EncounterModal — combat UI', () => {
  beforeEach(() => {
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue(makeStore(1, 1));
    jest.clearAllMocks();
  });

  it('renders pirate encounter header', () => {
    render(<EncounterModal />);
    expect(screen.getByText('Encounter!')).toBeInTheDocument();
  });

  it('shows Attack, Flee, and Surrender for pirate', () => {
    render(<EncounterModal />);
    expect(screen.getByText('Attack')).toBeInTheDocument();
    expect(screen.getByText('Flee')).toBeInTheDocument();
    expect(screen.getByText('Surrender')).toBeInTheDocument();
  });

  it('calls attackInEncounter when Attack is clicked', () => {
    const store = makeStore(1, 1);
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue(store);
    render(<EncounterModal />);
    fireEvent.click(screen.getByText('Attack'));
    expect(store.attackInEncounter).toHaveBeenCalled();
  });

  it('calls fleeFromEncounter when Flee is clicked', () => {
    const store = makeStore(1, 1);
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue(store);
    render(<EncounterModal />);
    fireEvent.click(screen.getByText('Flee'));
    expect(store.fleeFromEncounter).toHaveBeenCalled();
  });

  it('calls surrenderToEncounter when Surrender is clicked', () => {
    const store = makeStore(1, 1);
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue(store);
    render(<EncounterModal />);
    fireEvent.click(screen.getByText('Surrender'));
    expect(store.surrenderToEncounter).toHaveBeenCalled();
  });

  it('shows Submit and Bribe buttons for police encounter', () => {
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue({
      ...makeStore(1, 1),
      encounter: { ...makeStore(1, 1).encounter, type: 'POLICE' },
    });
    render(<EncounterModal />);
    expect(screen.getByText('Submit')).toBeInTheDocument();
    expect(screen.getByText('Bribe')).toBeInTheDocument();
    expect(screen.queryByText('Attack')).toBeInTheDocument();
    expect(screen.queryByText('Surrender')).not.toBeInTheDocument();
  });

  it('shows Attack, Ignore, and Trade for trader encounter', () => {
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue({
      ...makeStore(1, 1),
      encounter: { ...makeStore(1, 1).encounter, type: 'TRADER' },
    });
    render(<EncounterModal />);
    expect(screen.getByText('Attack')).toBeInTheDocument();
    expect(screen.getByText('Ignore')).toBeInTheDocument();
    expect(screen.getByText('Trade')).toBeInTheDocument();
    expect(screen.queryByText('Flee')).not.toBeInTheDocument();
  });

  it('shows Done and Encounter Over when resolved without winning', () => {
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue({
      ...makeStore(1, 1),
      encounter: { ...makeStore(1, 1).encounter, resolved: true, playerWon: false },
    });
    render(<EncounterModal />);
    expect(screen.getByText('Encounter Over')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('shows You Win! and Loot when player won with available loot', () => {
    const npc = makeNPC(1);
    npc.lootCargo = [3, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue({
      ...makeStore(1, 1),
      encounter: { ...makeStore(1, 1).encounter, resolved: true, playerWon: true, npc },
    });
    render(<EncounterModal />);
    expect(screen.getByText('You Win!')).toBeInTheDocument();
    expect(screen.getByText('Loot')).toBeInTheDocument();
  });

  it('shows last combat log message when log is non-empty', () => {
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue({
      ...makeStore(1, 1),
      encounter: {
        ...makeStore(1, 1).encounter,
        log: ['Round 1: Your shot missed.', 'Round 2: You hit! NPC hull: 80'],
      },
    });
    render(<EncounterModal />);
    // Only the last message is shown
    expect(screen.getByText('Round 2: You hit! NPC hull: 80')).toBeInTheDocument();
    expect(screen.queryByText('Round 1: Your shot missed.')).not.toBeInTheDocument();
  });

  it('renders nothing when no encounter is active', () => {
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue({
      ...makeStore(1, 1),
      encounter: null,
    });
    const { container } = render(<EncounterModal />);
    expect(container.firstChild).toBeNull();
  });
});
