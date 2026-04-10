import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SystemInfoView } from './SystemInfoView';
import { useSpaceTraderGame } from '../../logic/useSpaceTraderGame';

jest.mock('../../logic/useSpaceTraderGame');

const mockStore = {
  systems: [
    {
      nameIndex: 0,
      size: 2, // Medium
      techLevel: 5, // Industrial
      politics: 4, // Corporate State
      specialResources: 1, // Mineral rich
      status: 0, // UNEVENTFUL
    },
  ],
  currentSystem: 0,
};

describe('SystemInfoView Component', () => {
  beforeEach(() => {
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue(mockStore);
  });

  it('renders system details correctly', () => {
    render(<SystemInfoView onViewChange={jest.fn()} />);
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Industrial')).toBeInTheDocument();
    expect(screen.getByText('Corporate State')).toBeInTheDocument();
    expect(screen.getByText('Mineral rich')).toBeInTheDocument();
  });
});
