import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AiController } from './AiController';
import { useSpaceTraderGame } from '../useSpaceTraderGame';

// We just test rendering and toggling
describe('AiController', () => {
  beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // Deprecated
        removeListener: jest.fn(), // Deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  beforeEach(() => {
    useSpaceTraderGame.setState(useSpaceTraderGame.getInitialState());
  });

  it('renders correctly and can be toggled', () => {
    render(<AiController />);

    // Initially not running
    expect(screen.getByText('AI CORE')).toBeInTheDocument();

    // Toggle on
    const startBtn = screen.getByText('START');
    fireEvent.click(startBtn);

    expect(useSpaceTraderGame.getState().isAiEnabled).toBe(true);

    // Toggle off
    const stopBtn = screen.getByText('STOP');
    fireEvent.click(stopBtn);

    expect(useSpaceTraderGame.getState().isAiEnabled).toBe(false);
  });
});
