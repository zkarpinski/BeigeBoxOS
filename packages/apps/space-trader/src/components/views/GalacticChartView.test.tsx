import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GalacticChartView } from './GalacticChartView';
import { useSpaceTraderGame } from '../../logic/useSpaceTraderGame';

jest.mock('../../logic/useSpaceTraderGame');

const mockSystem = (nameIndex: number, x: number, y: number, overrides = {}) => ({
  nameIndex,
  x,
  y,
  visited: false,
  politics: 6,
  techLevel: 5,
  size: 1,
  specialResources: 0,
  status: 0,
  ...overrides,
});

function makeStore(overrides = {}) {
  return {
    systems: [
      mockSystem(0, 0, 0, { visited: true }), // current system
      mockSystem(1, 10, 10), // in range (dist ~14)
      mockSystem(2, 100, 100), // out of range (dist ~141)
    ],
    currentSystem: 0,
    selectedMapSystemId: null,
    setSelectedMapSystem: jest.fn(),
    travelTo: jest.fn(),
    ship: { type: 1, fuel: 20, cargo: new Array(10).fill(0) },
    ...overrides,
  };
}

describe('GalacticChartView Component', () => {
  beforeEach(() => {
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue(makeStore());
    jest.clearAllMocks();
  });

  it('renders all other system dots (excluding current system)', () => {
    const { container } = render(<GalacticChartView onViewChange={jest.fn()} />);
    const dots = container.querySelectorAll('.map-dot');
    expect(dots).toHaveLength(2); // 3 total - 1 current = 2
  });

  it('clicking a dot calls setSelectedMapSystem and navigates to target view', () => {
    const store = makeStore();
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue(store);
    const onViewChange = jest.fn();
    const { container } = render(<GalacticChartView onViewChange={onViewChange} />);

    const dots = container.querySelectorAll('.map-dot');
    fireEvent.click(dots[0]); // clicks systems[1]

    expect(store.setSelectedMapSystem).toHaveBeenCalledWith(1);
    expect(onViewChange).toHaveBeenCalledWith('target');
  });

  it('clicking an in-range dot navigates to target view', () => {
    const store = makeStore({ selectedMapSystemId: 1 });
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue(store);
    const onViewChange = jest.fn();
    const { container } = render(<GalacticChartView onViewChange={onViewChange} />);

    const dots = container.querySelectorAll('.map-dot');
    fireEvent.click(dots[0]);
    expect(onViewChange).toHaveBeenCalledWith('target');
  });
});
