import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EquipmentView } from './EquipmentView';
import { useSpaceTraderGame } from '../../logic/useSpaceTraderGame';

jest.mock('../../logic/useSpaceTraderGame');

const mockStore = {
  systems: [
    { nameIndex: 0, techLevel: 7 }, // End-game tech
  ],
  currentSystem: 0,
  credits: 100000,
  ship: {
    type: 0,
    weapon: [-1, -1, -1],
    shield: [-1, -1],
    gadget: [],
  },
  buyWeapon: jest.fn(),
  buyShield: jest.fn(),
  buyGadget: jest.fn(),
};

describe('EquipmentView Component', () => {
  beforeEach(() => {
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue(mockStore);
    jest.clearAllMocks();
  });

  it('renders correctly and defaults to weapon tab', () => {
    render(<EquipmentView onViewChange={jest.fn()} />);
    expect(screen.getByText('Pulse laser')).toBeInTheDocument();
  });

  it('switches tabs and shows correct items', () => {
    render(<EquipmentView onViewChange={jest.fn()} />);

    // Switch to Shields
    const shdBtn = screen.getByText('Shd');
    fireEvent.click(shdBtn);
    expect(screen.getByText('Energy shield')).toBeInTheDocument();

    // Switch to Gadgets
    const gdtBtn = screen.getByText('Gdt');
    fireEvent.click(gdtBtn);
    expect(screen.getByText('5 extra cargo bays')).toBeInTheDocument();
  });

  it('calls buyWeapon when clicking Buy in weapon tab', () => {
    render(<EquipmentView onViewChange={jest.fn()} />);
    const buyBtns = screen.getAllByText('Buy');
    fireEvent.click(buyBtns[0]); // Pulse laser
    expect(mockStore.buyWeapon).toHaveBeenCalled();
  });

  it('shows system message when tech level is too low', () => {
    const lowTechStore = { ...mockStore, systems: [{ nameIndex: 0, techLevel: 2 }] };
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue(lowTechStore);

    render(<EquipmentView onViewChange={jest.fn()} />);
    expect(
      screen.getByText('This system is too primitive for equipment sales.'),
    ).toBeInTheDocument();
  });
});
