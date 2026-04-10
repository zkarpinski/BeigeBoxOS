import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { NewGameView } from './NewGameView';
import { useSpaceTraderGame } from '../../logic/useSpaceTraderGame';

jest.mock('../../logic/useSpaceTraderGame');

const mockStore = {
  startNewGame: jest.fn(),
};

describe('NewGameView Component', () => {
  beforeEach(() => {
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue(mockStore);
    jest.clearAllMocks();
  });

  it('renders correctly with default fields', () => {
    render(<NewGameView onStart={jest.fn()} />);
    expect(screen.getByDisplayValue('Jameson')).toBeInTheDocument();
    expect(screen.getByText('Skill Points: 0 remaining')).toBeInTheDocument();
  });

  it('allows decreasing skill and updates points left', () => {
    render(<NewGameView onStart={jest.fn()} />);
    const pilotMinus = screen.getAllByText('-')[0]; // Pilot
    fireEvent.click(pilotMinus);
    expect(screen.getByText('Skill Points: 1 remaining')).toBeInTheDocument();
  });

  it('increases points back when clicking plus after decrease', () => {
    render(<NewGameView onStart={jest.fn()} />);
    const pilotMinus = screen.getAllByText('-')[0];
    fireEvent.click(pilotMinus);
    const pilotPlus = screen.getAllByText('+')[0];
    fireEvent.click(pilotPlus);
    expect(screen.getByText('Skill Points: 0 remaining')).toBeInTheDocument();
  });

  it('calls startNewGame when clicking Start Trading', () => {
    render(<NewGameView onStart={jest.fn()} />);
    const nameInput = screen.getByDisplayValue('Jameson');
    fireEvent.change(nameInput, { target: { value: 'Zaphod' } });

    const startBtn = screen.getByText('Start Trading');
    fireEvent.click(startBtn);

    expect(mockStore.startNewGame).toHaveBeenCalledWith('Zaphod', 2, {
      pilot: 4,
      fighter: 4,
      trader: 4,
      engineer: 4,
    });
  });
});
