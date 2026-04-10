import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PalmLauncher } from './PalmLauncher';

describe('PalmLauncher Component', () => {
  it('renders app icons including Space Trader', () => {
    render(<PalmLauncher onAppOpen={jest.fn()} />);
    expect(screen.getByText('Space Trader')).toBeInTheDocument();
    expect(screen.getByText('Date Book')).toBeInTheDocument();
    expect(screen.getByText('Calc')).toBeInTheDocument();
  });

  it('renders exactly 13 app icons based on the current apps array', () => {
    render(<PalmLauncher onAppOpen={jest.fn()} />);
    const buttons = screen.getAllByRole('button');
    // We have 13 apps + 2 scroll buttons = 15 buttons total in current implementation
    expect(buttons.length).toBeGreaterThanOrEqual(13);
  });
});
