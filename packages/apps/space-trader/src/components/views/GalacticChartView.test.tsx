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

  it('renders all system dots', () => {
    const { container } = render(<GalacticChartView onViewChange={jest.fn()} />);
    const dots = container.querySelectorAll('.map-dot');
    expect(dots).toHaveLength(3);
  });

  it('shows "Warp to System" when target is in range', () => {
    render(<GalacticChartView onViewChange={jest.fn()} />);
    // Click second dot (dist ~14.14, fuel 20)
    const dots = document.querySelectorAll('.map-dot');
    fireEvent.click(dots[1]);

    expect(screen.getByText('Warp to System')).not.toBeDisabled();
    expect(screen.getByText(/14 light years/)).toBeInTheDocument();
  });

  it('shows "Out of Range" when target is too far', () => {
    render(<GalacticChartView onViewChange={jest.fn()} />);
    // Click third dot (dist ~141.4, fuel 20)
    const dots = document.querySelectorAll('.map-dot');
    fireEvent.click(dots[2]);

    expect(screen.getByText('Out of Range')).toBeDisabled();
  });

  it('calls travelTo when Warp button is clicked', () => {
    render(<GalacticChartView onViewChange={jest.fn()} />);
    const dots = document.querySelectorAll('.map-dot');
    fireEvent.click(dots[1]);

    const warpBtn = screen.getByText('Warp to System');
    fireEvent.click(warpBtn);

    expect(mockStore.travelTo).toHaveBeenCalledWith(1);
  });
});
