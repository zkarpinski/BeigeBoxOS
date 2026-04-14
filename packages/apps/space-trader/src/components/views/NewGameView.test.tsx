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

  it('renders with default name and 16 skill points', () => {
    render(<NewGameView onStart={jest.fn()} />);
    expect(screen.getByText('Jameson')).toBeInTheDocument();
    expect(screen.getByText('16')).toBeInTheDocument(); // extraPoints remaining
  });

  it('renders "New Commander" title', () => {
    render(<NewGameView onStart={jest.fn()} />);
    expect(screen.getByText('New Commander')).toBeInTheDocument();
  });

  it('renders default difficulty as Normal', () => {
    render(<NewGameView onStart={jest.fn()} />);
    expect(screen.getByText('Normal')).toBeInTheDocument();
  });

  it('spending a skill point decreases remaining count', () => {
    render(<NewGameView onStart={jest.fn()} />);
    fireEvent.click(screen.getAllByText('+')[0]); // Difficulty + (first +)
    // Difficulty changed; skill points unchanged at 16
    expect(screen.getByText('16')).toBeInTheDocument();
    fireEvent.click(screen.getAllByText('+')[1]); // Pilot +1 (second +)
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('cannot decrease a skill below 1', () => {
    render(<NewGameView onStart={jest.fn()} />);
    fireEvent.click(screen.getAllByText('-')[1]); // Pilot - (index 1, after difficulty -)
    expect(screen.getByText('16')).toBeInTheDocument(); // unchanged
  });

  it('cannot increase a skill above 10', () => {
    render(<NewGameView onStart={jest.fn()} />);
    for (let i = 0; i < 9; i++) {
      fireEvent.click(screen.getAllByText('+')[1]); // Pilot + (9 clicks: 1→10)
    }
    expect(screen.getByText('7')).toBeInTheDocument(); // 16 - 9 = 7 extraPoints
    fireEvent.click(screen.getAllByText('+')[1]); // 11th click should be blocked
    expect(screen.getByText('7')).toBeInTheDocument(); // unchanged
  });

  it('cannot spend more than 16 skill points', () => {
    render(<NewGameView onStart={jest.fn()} />);
    // Spend 9 on pilot (1→10), then 7 on fighter (1→8) = 16 total
    for (let i = 0; i < 9; i++) {
      fireEvent.click(screen.getAllByText('+')[1]); // Pilot +
    }
    for (let i = 0; i < 7; i++) {
      fireEvent.click(screen.getAllByText('+')[2]); // Fighter +
    }
    expect(screen.getByText('0')).toBeInTheDocument();
    // Further clicks should be blocked
    fireEvent.click(screen.getAllByText('+')[3]); // Trader +
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('calls startNewGame with correct args when OK is clicked', () => {
    render(<NewGameView onStart={jest.fn()} />);
    fireEvent.click(screen.getByText('OK'));
    expect(mockStore.startNewGame).toHaveBeenCalledWith('Jameson', 2, {
      pilot: 1,
      fighter: 1,
      trader: 1,
      engineer: 1,
    });
  });

  it('difficulty changes with stepper buttons', () => {
    render(<NewGameView onStart={jest.fn()} />);
    // First '+' in the DOM is difficulty's plus button (after name)
    const allPlus = screen.getAllByText('+');
    // Difficulty stepper is the first Stepper rendered (index 0 among steppers)
    // But difficulty minus/plus appear before skill minus/plus
    fireEvent.click(allPlus[0]); // Difficulty: Normal → Hard
    expect(screen.getByText('Hard')).toBeInTheDocument();
  });
});
