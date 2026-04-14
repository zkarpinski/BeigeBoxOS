import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SystemInfoView } from './SystemInfoView';
import { useSpaceTraderGame } from '../../logic/useSpaceTraderGame';

jest.mock('../../logic/useSpaceTraderGame');

const mockStore = {
  systems: [
    {
      nameIndex: 0, // Acamar
      size: 1, // Small
      techLevel: 5, // Industrial
      politics: 4, // index 4 — has police/pirates values
      specialResources: 0, // Nothing special
      status: 0, // under no particular pressure
    },
  ],
  currentSystem: 0,
};

describe('SystemInfoView Component', () => {
  beforeEach(() => {
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue(mockStore);
  });

  it('renders system name', () => {
    render(<SystemInfoView onViewChange={jest.fn()} />);
    expect(screen.getByText('Acamar')).toBeInTheDocument();
  });

  it('renders size, tech level, and resources', () => {
    render(<SystemInfoView onViewChange={jest.fn()} />);
    expect(screen.getByText('Small')).toBeInTheDocument();
    expect(screen.getByText('Industrial')).toBeInTheDocument();
    expect(screen.getByText('Nothing special')).toBeInTheDocument();
  });

  it('renders status text', () => {
    render(<SystemInfoView onViewChange={jest.fn()} />);
    expect(screen.getByText(/under no particular pressure/)).toBeInTheDocument();
  });

  it('renders police and pirate levels', () => {
    render(<SystemInfoView onViewChange={jest.fn()} />);
    // Corporate State (index 4): strengthPolice=6 → Swarms, strengthPirates=2 → Few
    expect(screen.getByText('Swarms')).toBeInTheDocument();
    expect(screen.getByText('Few')).toBeInTheDocument();
  });

  it('renders News and Special buttons', () => {
    render(<SystemInfoView onViewChange={jest.fn()} />);
    expect(screen.getByText('News')).toBeInTheDocument();
    expect(screen.getByText('Special')).toBeInTheDocument();
  });
});
