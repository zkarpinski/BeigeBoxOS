import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PalmStatusBar } from './PalmStatusBar';

describe('PalmStatusBar Component', () => {
  it('renders the time', () => {
    render(<PalmStatusBar />);
    // Check if something like "12:00 pm" is rendered
    const timeMatch = screen.getByText(/(\d+:\d+ (am|pm))/i);
    expect(timeMatch).toBeInTheDocument();
  });

  it('renders the "All" category dropdown', () => {
    render(<PalmStatusBar />);
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('▼')).toBeInTheDocument();
  });

  it('contains a battery indicator', () => {
    const { container } = render(<PalmStatusBar />);
    // The battery container has a specific width/height in styles
    const batteryContainer = container.querySelector(
      'div[style*="width: 28px"][style*="height: 10px"]',
    );
    expect(batteryContainer).toBeInTheDocument();
  });
});
