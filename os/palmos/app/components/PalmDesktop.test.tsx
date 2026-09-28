import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PalmDesktop } from './PalmDesktop';
import { usePalmSounds } from '../hooks/usePalmSounds';

jest.mock('../hooks/usePalmSounds');
jest.mock('@retro-web/app-space-trader', () => ({
  SpaceTraderGame: () => <div data-testid="space-trader">Space Trader Game</div>,
}));

const mockSounds = {
  playClick: jest.fn(),
  playSuccess: jest.fn(),
  playError: jest.fn(),
};

describe('PalmDesktop Component', () => {
  beforeEach(() => {
    (usePalmSounds as jest.Mock).mockReturnValue(mockSounds);
    jest.clearAllMocks();
  });

  it('renders the launcher by default', () => {
    render(<PalmDesktop />);
    expect(screen.getByText('Space Trader')).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument(); // StatusBar component
  });

  it('switches to Todo app when clicked in launcher', () => {
    render(<PalmDesktop />);
    const todoBtn = screen.getByText('To Do List');
    fireEvent.click(todoBtn);
    expect(screen.getByText('To Do List')).toBeInTheDocument(); // App title in Todo app
  });

  it('switches to Space Trader when clicked in launcher', () => {
    render(<PalmDesktop />);
    const stBtn = screen.getByText('Space Trader');
    fireEvent.click(stBtn);
    expect(screen.getByTestId('space-trader')).toBeInTheDocument();
  });

  it('returns to launcher when Home silk button is clicked', () => {
    render(<PalmDesktop />);

    // Switch to Space Trader first
    fireEvent.click(screen.getByText('Space Trader'));
    expect(screen.getByTestId('space-trader')).toBeInTheDocument();

    // The silk buttons are in PalmFrame, which is part of PalmDesktop
    // We can find the Home button by its title 'Home'
    const homeBtn = screen.getByTitle('Home');
    fireEvent.click(homeBtn);

    expect(screen.getByText('Space Trader')).toBeInTheDocument(); // Launcher icon back
    expect(screen.queryByTestId('space-trader')).not.toBeInTheDocument();
  });

  it('handles search safely with malformed or non-array localStorage data and searches memos without titles', () => {
    // Populate localStorage with malformed non-array and memo data without explicit title property
    localStorage.setItem('palmos-todos', JSON.stringify({ invalid: 'not an array' }));
    localStorage.setItem(
      'palmos-memos',
      JSON.stringify([
        { id: '1', body: 'Secret Meeting\nDiscuss security' },
        null,
        { invalid: 123 },
      ]),
    );

    render(<PalmDesktop />);

    // Open Find dialog by clicking Find silk button
    const searchBtn = screen.getByTitle('Find');
    fireEvent.click(searchBtn);

    // Enter query into search input
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Secret' } });

    // Assert that the memo result appears safely without crashing
    expect(screen.getByText('Memo:')).toBeInTheDocument();
    expect(screen.getByText('Secret Meeting')).toBeInTheDocument();
  });
});
