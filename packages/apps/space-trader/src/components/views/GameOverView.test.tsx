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

  it('renders defeat message and commander name', () => {
    render(<GameOverView />);
    expect(screen.getByText('DEFEAT')).toBeInTheDocument();
    expect(screen.getByText(/Commander Jameson is lost in the void/)).toBeInTheDocument();
  });

  it('shows score breakdown', () => {
    render(<GameOverView />);
    expect(screen.getByText('Final Score')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument(); // days
    expect(screen.getByText('3')).toBeInTheDocument(); // pirate kills
  });

  it('shows rating', () => {
    render(<GameOverView />);
    // Should show some rating title
    const ratingEl = screen.getByText(/Beginner|Trainee|Amateur|Competent/);
    expect(ratingEl).toBeInTheDocument();
  });

  it('calls restartGame when clicking New Game', () => {
    render(<GameOverView />);
    fireEvent.click(screen.getByText('New Game'));
    expect(mockStore.restartGame).toHaveBeenCalled();
  });

  it('shows victory state when moonBought is true', () => {
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue({
      ...mockStore,
      moonBought: true,
    });
    render(<GameOverView />);
    expect(screen.getByText('Congratulations!')).toBeInTheDocument();
    expect(screen.getByText('VICTORY!')).toBeInTheDocument();
  });
});
