import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EncounterModal } from './EncounterModal';
import { useSpaceTraderGame } from '../../logic/useSpaceTraderGame';
import { ShipTypes } from '../../logic/DataTypes';

jest.mock('../../logic/useSpaceTraderGame');

const mockNPC = {
  ship: {
    type: 1, // Gnat
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

const basePirateEncounter = {
  type: 'PIRATE',
  npc: mockNPC,
  log: [],
  round: 0,
  resolved: false,
  playerWon: false,
};

const mockStore = {
  encounter: basePirateEncounter,
  clearEncounter: jest.fn(),
  attackInEncounter: jest.fn(),
  fleeFromEncounter: jest.fn(),
  surrenderToEncounter: jest.fn(),
  bribePolice: jest.fn(),
  lootNPC: jest.fn(),
  ship: {
    type: 1, // Gnat
    hull: 100,
    shieldStrength: [-1, -1, -1],
    cargo: new Array(10).fill(0),
    weapon: [0, -1, -1],
    shield: [-1, -1, -1],
    gadget: [-1, -1, -1],
    escapePod: false,
    fuel: 14,
  },
};

describe('EncounterModal Component', () => {
  beforeEach(() => {
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue(mockStore);
    jest.clearAllMocks();
  });

  it('renders pirate encounter header', () => {
    render(<EncounterModal />);
    expect(screen.getByText('Encounter!')).toBeInTheDocument();
  });

  it('shows Attack and Flee buttons for pirate encounter', () => {
    render(<EncounterModal />);
    expect(screen.getByText('Attack')).toBeInTheDocument();
    expect(screen.getByText('Flee')).toBeInTheDocument();
    expect(screen.getByText('Surrender')).toBeInTheDocument();
  });

  it('calls attackInEncounter when Attack is clicked', () => {
    render(<EncounterModal />);
    fireEvent.click(screen.getByText('Attack'));
    expect(mockStore.attackInEncounter).toHaveBeenCalled();
  });

  it('calls fleeFromEncounter when Flee is clicked', () => {
    render(<EncounterModal />);
    fireEvent.click(screen.getByText('Flee'));
    expect(mockStore.fleeFromEncounter).toHaveBeenCalled();
  });

  it('calls surrenderToEncounter when Surrender is clicked', () => {
    render(<EncounterModal />);
    fireEvent.click(screen.getByText('Surrender'));
    expect(mockStore.surrenderToEncounter).toHaveBeenCalled();
  });

  it('shows Done button when encounter is resolved', () => {
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue({
      ...mockStore,
      encounter: { ...basePirateEncounter, resolved: true, playerWon: false },
    });
    render(<EncounterModal />);
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.getByText('Encounter Over')).toBeInTheDocument();
  });

  it('shows You Win! header and Loot button when player won with loot', () => {
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue({
      ...mockStore,
      encounter: {
        ...basePirateEncounter,
        resolved: true,
        playerWon: true,
        npc: { ...mockNPC, lootCargo: [3, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
      },
    });
    render(<EncounterModal />);
    expect(screen.getByText('You Win!')).toBeInTheDocument();
    expect(screen.getByText('Loot')).toBeInTheDocument();
  });

  it('renders nothing when no encounter active', () => {
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue({ ...mockStore, encounter: null });
    const { container } = render(<EncounterModal />);
    expect(container.firstChild).toBeNull();
  });
});
