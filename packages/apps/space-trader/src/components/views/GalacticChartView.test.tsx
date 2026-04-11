import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GalacticChartView } from './GalacticChartView';
import { useSpaceTraderGame } from '../../logic/useSpaceTraderGame';

jest.mock('../../logic/useSpaceTraderGame');

const mockStore = {
  systems: [
    { nameIndex: 0, x: 0, y: 0, visited: true },
    { nameIndex: 1, x: 10, y: 10, visited: false },
    { nameIndex: 2, x: 100, y: 100, visited: false },
  ],
  currentSystem: 0,
  travelTo: jest.fn(),
  ship: {
    fuel: 20,
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

  it('shows Warp button enabled when target is in range', () => {
    render(<GalacticChartView onViewChange={jest.fn()} />);
    // Click first dot (which is systems[1], dist ~14.14, fuel 20)
    const dots = document.querySelectorAll('.map-dot');
    fireEvent.click(dots[0]);

    expect(screen.getByText('Warp')).not.toBeDisabled();
    expect(screen.getByText(/14 parsecs/i)).toBeInTheDocument();
  });

  it('shows Warp button disabled when target is too far', () => {
    render(<GalacticChartView onViewChange={jest.fn()} />);
    // Click second dot (which is systems[2], dist ~141.4, fuel 20)
    const dots = document.querySelectorAll('.map-dot');
    fireEvent.click(dots[1]);

    expect(screen.getByText('Warp')).toBeDisabled();
  });

  it('calls travelTo when Warp button is clicked', () => {
    render(<GalacticChartView onViewChange={jest.fn()} />);
    const dots = document.querySelectorAll('.map-dot');
    fireEvent.click(dots[0]);

    const warpBtn = screen.getByText('Warp');
    fireEvent.click(warpBtn);

    expect(mockStore.travelTo).toHaveBeenCalledWith(1);
  });
});
