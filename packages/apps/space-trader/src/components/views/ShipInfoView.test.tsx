import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ShipInfoView } from './ShipInfoView';
import { useSpaceTraderGame } from '../../logic/useSpaceTraderGame';

jest.mock('../../logic/useSpaceTraderGame');

const mockStore = {
  ship: {
    type: 0, // Flea
    hull: 25,
    fuel: 20,
    cargo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    weapon: [0, -1, -1],
    shield: [-1, -1],
    gadget: [-1, -1, -1],
    escapePod: false,
  },
  credits: 1000,
  debt: 0,
  days: 5,
  reputationScore: 0,
  policeRecordScore: 0,
  killsPirate: 3,
  killsPolice: 0,
  pilotSkill: 4,
  fighterSkill: 4,
  traderSkill: 4,
  engineerSkill: 4,
};

describe('ShipInfoView Component', () => {
  beforeEach(() => {
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue(mockStore);
  });

  it('renders ship type name', () => {
    render(<ShipInfoView onViewChange={jest.fn()} />);
    expect(screen.getByText(/Flea/)).toBeInTheDocument();
  });

  it('renders weapon names correctly', () => {
    render(<ShipInfoView onViewChange={jest.fn()} />);
    expect(screen.getByText(/Pulse laser/i)).toBeInTheDocument();
  });

  it('renders reputation title and score', () => {
    render(<ShipInfoView onViewChange={jest.fn()} />);
    // Reputation score 0 → "Harmless (0)"
    expect(screen.getByText(/Harmless/)).toBeInTheDocument();
    expect(screen.getByText(/Harmless \(0\)/)).toBeInTheDocument();
  });

  it('renders police record title and score', () => {
    render(<ShipInfoView onViewChange={jest.fn()} />);
    // Score 0 → "Clean (0)"
    expect(screen.getByText(/Clean \(0\)/)).toBeInTheDocument();
  });

  it('renders kill counts', () => {
    render(<ShipInfoView onViewChange={jest.fn()} />);
    expect(screen.getByText('3')).toBeInTheDocument(); // killsPirate
  });

  it('shows net worth', () => {
    render(<ShipInfoView onViewChange={jest.fn()} />);
    expect(screen.getByText('Net worth')).toBeInTheDocument();
  });

  it('shows effective skill bonus when gadget equipped', () => {
    const storeWithGadget = {
      ...mockStore,
      ship: { ...mockStore.ship, gadget: [3, -1, -1] }, // Targeting system → +3 fighter
    };
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue(storeWithGadget);
    render(<ShipInfoView onViewChange={jest.fn()} />);
    // Fighter: 4 base + 3 = 7, shown as "7 (4+3)"
    expect(screen.getByText(/7 \(4\+3\)/)).toBeInTheDocument();
  });

  it('does not show debt row when debt is zero', () => {
    render(<ShipInfoView onViewChange={jest.fn()} />);
    expect(screen.queryByText('Debt')).not.toBeInTheDocument();
  });

  it('shows debt row when debt is positive', () => {
    const debtStore = { ...mockStore, debt: 5000 };
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue(debtStore);
    render(<ShipInfoView onViewChange={jest.fn()} />);
    expect(screen.getByText('Debt')).toBeInTheDocument();
    expect(screen.getByText('5000 cr.')).toBeInTheDocument();
  });
});
