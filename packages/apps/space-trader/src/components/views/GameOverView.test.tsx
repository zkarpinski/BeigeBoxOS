import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GameOverView } from './GameOverView';
import { useSpaceTraderGame } from '../../logic/useSpaceTraderGame';

jest.mock('../../logic/useSpaceTraderGame');

const mockStore = {
  restartGame: jest.fn(),
  nameCommander: 'Jameson',
  days: 15,
  credits: 500,
  debt: 0,
  difficulty: 2,
  killsPirate: 3,
  killsPolice: 0,
  reputationScore: 5,
  policeRecordScore: 2,
  moonBought: false,
  sellPrices: new Array(10).fill(0),
  ship: {
    type: 1,
    cargo: new Array(10).fill(0),
    weapon: [0, -1, -1],
    shield: [-1, -1, -1],
    shieldStrength: [-1, -1, -1],
    gadget: [-1, -1, -1],
    escapePod: false,
    fuel: 14,
    hull: 100,
  },
};

describe('GameOverView Component', () => {
  beforeEach(() => {
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue(mockStore);
    jest.clearAllMocks();
  });

  it('renders defeat message', () => {
    render(<GameOverView />);
    expect(screen.getByText('YOU ARE DESTROYED')).toBeInTheDocument();
  });

  it('renders OK button that calls restartGame', () => {
    render(<GameOverView />);
    fireEvent.click(screen.getByText('OK'));
    expect(mockStore.restartGame).toHaveBeenCalled();
  });

  it('shows victory state when moonBought is true', () => {
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue({
      ...mockStore,
      moonBought: true,
    });
    render(<GameOverView />);
    expect(screen.getByText('CONGRATULATIONS')).toBeInTheDocument();
  });
});
