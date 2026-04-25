import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PalmStatusBar } from './PalmStatusBar';

describe('PalmStatusBar Component', () => {
  it('renders the time', () => {
    render(<PalmStatusBar />);
    // Check if something like "12:00 pm" is rendered
    const timeMatch = screen.getByText(/(\d{1,2}:\d{2}\s?(am|pm)?)/i);
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
    // In PalmStatusBar.tsx it is 60px wide and 18px high (wrapper)
    // or 54px wide and 18px high (body)
    const batteryContainer = container.querySelector(
      'div[style*="width: 60px"][style*="height: 18px"]',
    );
    expect(batteryContainer).toBeInTheDocument();
  });
});
