import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DateBookApp } from './DateBookApp';

describe('DateBookApp Component', () => {
  it('renders the date and day picker', () => {
    render(<DateBookApp />);
    // Initial date is today, but we can check if it renders some date label format
    // formatPalmDate(new Date())
    expect(screen.getByText(/^[A-Z][a-z]{2} \d{1,2}, \d{2}$/)).toBeInTheDocument();
    expect(screen.getAllByText('S')[0]).toBeInTheDocument();
  });

  it('renders hourly slots from 8:00 to 6:00', () => {
    render(<DateBookApp />);
    expect(screen.getByText('8:00')).toBeInTheDocument();
    expect(screen.getByText('12:00')).toBeInTheDocument();
    expect(screen.getByText('6:00')).toBeInTheDocument();
  });

  it('renders the core footer buttons', () => {
    render(<DateBookApp />);
    expect(screen.getByRole('button', { name: 'New' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument();
  });
});
