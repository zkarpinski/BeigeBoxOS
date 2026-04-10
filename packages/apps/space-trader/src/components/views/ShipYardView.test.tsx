import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ShipYardView } from './ShipYardView';
import { useSpaceTraderGame } from '../../logic/useSpaceTraderGame';

jest.mock('../../logic/useSpaceTraderGame');

const mockStore = {
  systems: [
    { nameIndex: 0, techLevel: 5 }, // Can access shipyard
  ],
  currentSystem: 0,
  credits: 50000,
  ship: { type: 0, hull: 25 }, // Flea
  buyShip: jest.fn(),
  repairHull: jest.fn(),
};

describe('ShipYardView Component', () => {
  beforeEach(() => {
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue(mockStore);
    jest.clearAllMocks();
  });

  it('renders available ships based on tech level', () => {
    render(<ShipYardView onViewChange={jest.fn()} />);
    // Tech level 5 should see several ships (Flea, Gnat, Firefly, Mosquito, Bumblebee)
    expect(screen.getByText('Gnat')).toBeInTheDocument();
    expect(screen.getByText('Firefly')).toBeInTheDocument();
  });

  it('shows system message when tech level is too low', () => {
    const lowTechStore = { ...mockStore, systems: [{ nameIndex: 0, techLevel: 2 }] };
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue(lowTechStore);

    render(<ShipYardView onViewChange={jest.fn()} />);
    expect(screen.getByText('This system is too primitive for a shipyard.')).toBeInTheDocument();
  });

  it('calls buyShip when clicking Buy button', () => {
    render(<ShipYardView onViewChange={jest.fn()} />);
    // Select Gnat (first should be Selected by default or just use text)
    const buyBtn = screen.getByText(/Buy Flea/); // Flea is available at tech level 5
    fireEvent.click(buyBtn);
    expect(mockStore.buyShip).toHaveBeenCalled();
  });

  it('calls repairHull when Hull is damaged and affordable', () => {
    const damagedStore = { ...mockStore, ship: { type: 0, hull: 10 } };
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue(damagedStore);

    render(<ShipYardView onViewChange={jest.fn()} />);
    const repairBtn = screen.getByText(/Repair/);
    fireEvent.click(repairBtn);
    expect(mockStore.repairHull).toHaveBeenCalled();
  });
});
