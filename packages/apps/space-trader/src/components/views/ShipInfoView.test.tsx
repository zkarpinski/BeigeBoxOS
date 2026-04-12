import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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
    gadget: [],
    escapePod: false,
  },
  credits: 1000,
  reputationScore: 1234,
  policeRecordScore: 5678,
};

describe('ShipInfoView Component', () => {
  beforeEach(() => {
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue(mockStore);
  });

  it('renders ship stats correctly', () => {
    render(<ShipInfoView onViewChange={jest.fn()} />);
    expect(screen.getByText('Flea')).toBeInTheDocument();
  });

  it('renders weapon names correctly', () => {
    render(<ShipInfoView onViewChange={jest.fn()} />);
    expect(screen.getByText(/Pulse laser/)).toBeInTheDocument();
  });

  it('renders reputation and police record', () => {
    render(<ShipInfoView onViewChange={jest.fn()} />);
    expect(screen.getByText('1234')).toBeInTheDocument(); // Reputation
    expect(screen.getByText('5678')).toBeInTheDocument(); // Police Record
  });
});
