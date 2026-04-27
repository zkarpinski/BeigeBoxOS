import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { WinMobileDesktop } from '../app/components/WinMobileDesktop';
import '@testing-library/jest-dom';

describe('WinMobileDesktop', () => {
  test('renders the Today screen by default', () => {
    render(<WinMobileDesktop />);
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText(/Sunday, April 26, 2026/i)).toBeInTheDocument();
  });

  test('can open and close the Start menu', () => {
    render(<WinMobileDesktop />);
    const startBtn = screen.getByText('Start');
    fireEvent.click(startBtn);

    expect(screen.getByText('Calculator')).toBeInTheDocument();

    // Clicking the backdrop closes it
    const backdrop = document.querySelector('.bg-black\\/5');
    if (backdrop) fireEvent.click(backdrop);

    expect(screen.queryByText('Calculator')).not.toBeInTheDocument();
  });

  test('can switch to Calculator app', () => {
    render(<WinMobileDesktop />);
    fireEvent.click(screen.getByText('Start'));
    fireEvent.click(screen.getByText('Calculator'));

    expect(screen.getByText('Calculator')).toBeInTheDocument();
    // The calculator app itself should be rendered
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  test('Home button returns to Today screen', () => {
    render(<WinMobileDesktop />);
    // Go to calculator
    fireEvent.click(screen.getByText('Start'));
    fireEvent.click(screen.getByText('Calculator'));

    // Press hardware home button
    const homeBtn = screen.getByTitle('Home');
    fireEvent.click(homeBtn);

    expect(screen.getByText('Today')).toBeInTheDocument();
  });
});
