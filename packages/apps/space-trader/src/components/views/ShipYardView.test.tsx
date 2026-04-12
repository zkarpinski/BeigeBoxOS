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
  ship: { type: 0, hull: 25, fuel: 10 }, // Flea, partial fuel
  buyShip: jest.fn(),
  repairHull: jest.fn(),
  buyFuel: jest.fn(),
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
    const damagedStore = { ...mockStore, ship: { type: 0, hull: 10, fuel: 10 } };
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue(damagedStore);

    render(<ShipYardView onViewChange={jest.fn()} />);
    const repairBtn = screen.getByText(/Repair/);
    fireEvent.click(repairBtn);
    expect(mockStore.repairHull).toHaveBeenCalled();
  });

  it('shows fuel status and calls buyFuel when Fill is clicked', () => {
    render(<ShipYardView onViewChange={jest.fn()} />);
    // Flea has fuelTanks=20, fuel=10, so Fill = 10 units × 1 cr = 10 cr
    expect(screen.getByText('Fuel: 10/20 (1 cr/unit)')).toBeInTheDocument();
    const fillBtn = screen.getByText(/Fill/);
    fireEvent.click(fillBtn);
    expect(mockStore.buyFuel).toHaveBeenCalledWith(10); // 20 - 10 = 10 units
  });

  it('disables Fill button when tank is full', () => {
    const fullFuelStore = { ...mockStore, ship: { type: 0, hull: 25, fuel: 20 } };
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue(fullFuelStore);

    render(<ShipYardView onViewChange={jest.fn()} />);
    const fillBtn = screen.getByText(/Fill/);
    expect(fillBtn).toBeDisabled();
  });
});
