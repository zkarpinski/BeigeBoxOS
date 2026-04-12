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
  politics: 6, // Democracy
  techLevel: 5,
  size: 1,
  specialResources: 0,
  status: 0,
  ...overrides,
});

const mockStore = {
  systems: [
    mockSystem(0, 0, 0, { visited: true }), // current system
    mockSystem(1, 10, 10), // in range (dist ~14)
    mockSystem(2, 100, 100), // out of range (dist ~141)
  ],
  currentSystem: 0,
  travelTo: jest.fn(),
  ship: {
    type: 1,
    fuel: 20,
    cargo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
};

describe('GalacticChartView Component', () => {
  beforeEach(() => {
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue(mockStore);
    jest.clearAllMocks();
  });

  it('renders all other system dots (excluding current system)', () => {
    const { container } = render(<GalacticChartView onViewChange={jest.fn()} />);
    const dots = container.querySelectorAll('.map-dot');
    expect(dots).toHaveLength(2); // 3 total - 1 current = 2
  });

  it('clicking a dot navigates to Target System screen', () => {
    const { container } = render(<GalacticChartView onViewChange={jest.fn()} />);
    const dots = container.querySelectorAll('.map-dot');
    fireEvent.click(dots[0]);
    // Target System screen has these fields (TitleBar is null in tests so check content)
    expect(screen.getByText('Government:')).toBeInTheDocument();
    expect(screen.getByText('Pirates:')).toBeInTheDocument();
  });

  it('shows Warp button enabled when target is in range', () => {
    const { container } = render(<GalacticChartView onViewChange={jest.fn()} />);
    const dots = container.querySelectorAll('.map-dot');
    fireEvent.click(dots[0]); // systems[1], dist ~14, fuel 20

    expect(screen.getByText('Warp')).not.toBeDisabled();
    // Distance row shows "14 parsecs"
    expect(screen.getByText('14 parsecs')).toBeInTheDocument();
  });

  it('shows Warp button disabled when target is too far', () => {
    const { container } = render(<GalacticChartView onViewChange={jest.fn()} />);
    const dots = container.querySelectorAll('.map-dot');
    fireEvent.click(dots[1]); // systems[2], dist ~141, fuel 20

    expect(screen.getByText('Warp')).toBeDisabled();
  });

  it('calls travelTo when Warp button is clicked', () => {
    const { container } = render(<GalacticChartView onViewChange={jest.fn()} />);
    const dots = container.querySelectorAll('.map-dot');
    fireEvent.click(dots[0]);

    fireEvent.click(screen.getByText('Warp'));
    expect(mockStore.travelTo).toHaveBeenCalledWith(1);
  });

  it('Average Price List screen shows system name and trade goods', () => {
    const { container } = render(<GalacticChartView onViewChange={jest.fn()} />);
    const dots = container.querySelectorAll('.map-dot');
    fireEvent.click(dots[0]); // go to Target System screen

    fireEvent.click(screen.getByText('Average Price List'));
    // Prices screen shows all 10 trade goods and navigation buttons
    expect(screen.getByText('Water')).toBeInTheDocument();
    expect(screen.getByText('Robots')).toBeInTheDocument();
    expect(screen.getByText('Price Differences')).toBeInTheDocument();
    expect(screen.getByText('System Information')).toBeInTheDocument();
  });

  it('Short Range Chart button returns to the map', () => {
    const { container } = render(<GalacticChartView onViewChange={jest.fn()} />);
    const dots = container.querySelectorAll('.map-dot');
    fireEvent.click(dots[0]); // go to Target System

    fireEvent.click(screen.getByText('Short Range Chart'));
    // Back on the chart — dots are visible again
    expect(container.querySelectorAll('.map-dot')).toHaveLength(2);
  });

  it('arrow buttons cycle through in-range systems', () => {
    const { container } = render(<GalacticChartView onViewChange={jest.fn()} />);
    const dots = container.querySelectorAll('.map-dot');
    fireEvent.click(dots[0]); // select systems[1] (Adahn)

    // Only 1 in-range system so arrows stay on the same one
    fireEvent.click(screen.getByLabelText('Next system'));
    expect(screen.getByText(/Adahn/i)).toBeInTheDocument();
  });
});
