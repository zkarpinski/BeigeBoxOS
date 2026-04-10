import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DateBookApp } from './DateBookApp';

describe('DateBookApp Component', () => {
  it('renders the date and day picker', () => {
    render(<DateBookApp />);
    expect(screen.getByText('Sep 23, 04')).toBeInTheDocument();
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
    expect(screen.getByRole('button', { name: 'Details' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go To' })).toBeInTheDocument();
  });
});
