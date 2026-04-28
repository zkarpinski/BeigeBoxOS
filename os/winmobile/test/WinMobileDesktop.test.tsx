import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { WinMobileDesktop } from '../app/components/WinMobileDesktop';
import '@testing-library/jest-dom';

// Mock Three.js WebGLRenderer which fails in JSDOM
jest.mock('three', () => {
  const THREE = jest.requireActual('three');
  return {
    ...THREE,
    WebGLRenderer: jest.fn().mockImplementation(() => ({
      setSize: jest.fn(),
      setPixelRatio: jest.fn(),
      setClearColor: jest.fn(),
      render: jest.fn(),
      dispose: jest.fn(),
      shadowMap: { enabled: false },
      domElement: document.createElement('canvas'),
    })),
  };
});

describe('WinMobileDesktop', () => {
  test('renders the Today screen by default', () => {
    render(<WinMobileDesktop />);
    expect(screen.getByText('Today')).toBeInTheDocument();
    // Date is dynamic — verify a long-form date string is present
    expect(screen.getByText(/\w+day, \w+ \d+, \d{4}/i)).toBeInTheDocument();
  });

  test('can open and close the Start menu', () => {
    render(<WinMobileDesktop />);
    const startBtn = screen.getByText('Start');
    fireEvent.click(startBtn);

    expect(screen.getByText('Calculator')).toBeInTheDocument();

    // Clicking the backdrop closes it
    const backdrop = document.querySelector('[data-testid="start-backdrop"]');
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
    const homeBtn = screen.getByLabelText(/Home/i);
    fireEvent.click(homeBtn);

    expect(screen.getByText('Today')).toBeInTheDocument();
  });
});
