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
};

describe('GameOverView Component', () => {
  beforeEach(() => {
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue(mockStore);
    jest.clearAllMocks();
  });

  it('renders defat message and stats', () => {
    render(<GameOverView />);
    expect(screen.getByText('DEFEAT')).toBeInTheDocument();
    expect(screen.getByText(/Commander Jameson is lost in the void/)).toBeInTheDocument();
    expect(screen.getByText('Days active: 15')).toBeInTheDocument();
    expect(screen.getByText('Final credits: 500')).toBeInTheDocument();
  });

  it('calls restartGame when clicking button', () => {
    render(<GameOverView />);
    const restartBtn = screen.getByText('Restart Game');
    fireEvent.click(restartBtn);
    expect(mockStore.restartGame).toHaveBeenCalled();
  });
});
