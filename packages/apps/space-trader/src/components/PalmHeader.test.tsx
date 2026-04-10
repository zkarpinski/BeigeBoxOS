import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PalmHeader } from './PalmHeader';
import { useSpaceTraderGame } from '../logic/useSpaceTraderGame';

jest.mock('../logic/useSpaceTraderGame');

const mockStore = {
  setTradeMode: jest.fn(),
};

describe('PalmHeader Component', () => {
  beforeEach(() => {
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue(mockStore);
    jest.clearAllMocks();
  });

  it('renders the title', () => {
    render(<PalmHeader title="Test Title" onViewChange={jest.fn()} />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('shows shortcuts and calls onViewChange when clicked', () => {
    const onViewChange = jest.fn();
    render(<PalmHeader title="Test Title" onViewChange={onViewChange} />);

    // Check 'B' (Buy) shortcut
    const buyBtn = screen.getByText('B');
    fireEvent.click(buyBtn);
    expect(mockStore.setTradeMode).toHaveBeenCalledWith('buy');
    expect(onViewChange).toHaveBeenCalledWith('trade');
  });

  it('opens menu when title is clicked', () => {
    render(<PalmHeader title="Test Title" onViewChange={jest.fn()} />);
    const title = screen.getByText('Test Title');
    fireEvent.click(title);

    // Menu tabs should appear
    expect(screen.getByText('Command')).toBeInTheDocument();
    expect(screen.getByText('Game')).toBeInTheDocument();
    expect(screen.getByText('Help')).toBeInTheDocument();
  });

  it('changes view via menu item', () => {
    const onViewChange = jest.fn();
    render(<PalmHeader title="Test Title" onViewChange={onViewChange} />);
    fireEvent.click(screen.getByText('Test Title'));

    // Click 'Ship Yard' from Command tab
    const shipyardItem = screen.getByText('Ship Yard');
    fireEvent.click(shipyardItem);

    expect(onViewChange).toHaveBeenCalledWith('shipyard');
  });
});
