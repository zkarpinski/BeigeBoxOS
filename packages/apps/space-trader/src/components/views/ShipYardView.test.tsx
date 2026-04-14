import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ShipYardView } from './ShipYardView';
import { useSpaceTraderGame } from '../../logic/useSpaceTraderGame';

jest.mock('../../logic/useSpaceTraderGame');

const mockStore = {
  systems: [
    { nameIndex: 0, techLevel: 5 }, // Tech 5 can access shipyard
  ],
  currentSystem: 0,
  credits: 50000,
  ship: { type: 0, hull: 25, fuel: 10 }, // Flea, partial fuel (max 20)
  repairHull: jest.fn(),
  buyFuel: jest.fn(),
};

describe('ShipYardView Component', () => {
  beforeEach(() => {
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue(mockStore);
    jest.clearAllMocks();
  });

  it('shows "Ships are for sale" at tech level 5', () => {
    render(<ShipYardView onViewChange={jest.fn()} />);
    expect(screen.getByText('Ships are for sale.')).toBeInTheDocument();
  });

  it('"View Ship Info" button navigates to buyShip', () => {
    const onViewChange = jest.fn();
    render(<ShipYardView onViewChange={onViewChange} />);
    fireEvent.click(screen.getByText('View Ship Info'));
    expect(onViewChange).toHaveBeenCalledWith('buyShip');
  });

  it('shows hull repair unavailable message at Agricultural (tech 1) but still shows fuel', () => {
    const lowTechStore = { ...mockStore, systems: [{ nameIndex: 0, techLevel: 1 }] };
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue(lowTechStore);

    render(<ShipYardView onViewChange={jest.fn()} />);
    expect(screen.getByText('This system is too primitive for hull repairs.')).toBeInTheDocument();
    // Fuel is still available at any tech level
    expect(screen.getByText(/parsecs/)).toBeInTheDocument();
  });

  it('calls repairHull when Repair button is clicked', () => {
    const damagedStore = { ...mockStore, ship: { type: 0, hull: 10, fuel: 10 } };
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue(damagedStore);

    render(<ShipYardView onViewChange={jest.fn()} />);
    fireEvent.click(screen.getByText('Repair'));
    expect(mockStore.repairHull).toHaveBeenCalled();
  });

  it('shows fuel cost and calls buyFuel with full amount when Buy Full Tank is clicked', () => {
    render(<ShipYardView onViewChange={jest.fn()} />);
    // Flea: fuelTanks=20, fuel=10, costOfFuel=1 → full tank costs 10 cr
    expect(screen.getByText('A full tank costs 10 cr.')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Buy Full Tank'));
    expect(mockStore.buyFuel).toHaveBeenCalledWith(10); // 20 - 10 = 10 units
  });

  it('shows "tank cannot hold more fuel" when tank is full', () => {
    const fullFuelStore = { ...mockStore, ship: { type: 0, hull: 25, fuel: 20 } };
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue(fullFuelStore);

    render(<ShipYardView onViewChange={jest.fn()} />);
    expect(screen.getByText('Your tank cannot hold more fuel.')).toBeInTheDocument();
    expect(screen.queryByText('Buy Full Tank')).not.toBeInTheDocument();
  });
});
