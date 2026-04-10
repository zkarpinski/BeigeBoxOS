import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EncounterModal } from './EncounterModal';
import { useSpaceTraderGame } from '../../logic/useSpaceTraderGame';

jest.mock('../../logic/useSpaceTraderGame');

const mockStore = {
  encounter: { type: 'Pirate' },
  clearEncounter: jest.fn(),
  ship: { type: 0 },
  takeDamage: jest.fn(),
};

describe('EncounterModal Component', () => {
  beforeEach(() => {
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue(mockStore);
    jest.clearAllMocks();
  });

  it('renders pirate encounter text', () => {
    render(<EncounterModal />);
    expect(screen.getByText(/You have encountered a Pirate!/)).toBeInTheDocument();
    expect(screen.getByText(/They are attacking!/)).toBeInTheDocument();
  });

  it('calls takeDamage(20) and clearEncounter when Attack is clicked for Pirate', () => {
    render(<EncounterModal />);
    const attackBtn = screen.getByText('Attack');
    fireEvent.click(attackBtn);
    expect(mockStore.takeDamage).toHaveBeenCalledWith(20);
    expect(mockStore.clearEncounter).toHaveBeenCalled();
  });

  it('calls clearEncounter when Surrender is clicked', () => {
    render(<EncounterModal />);
    const surrenderBtn = screen.getByText('Surrender');
    fireEvent.click(surrenderBtn);
    expect(mockStore.clearEncounter).toHaveBeenCalled();
  });

  it('renders nothing when no encounter active', () => {
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue({ ...mockStore, encounter: null });
    const { container } = render(<EncounterModal />);
    expect(container.firstChild).toBeNull();
  });
});
