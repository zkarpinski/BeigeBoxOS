import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MainTradeView } from './MainTradeView';
import { useSpaceTraderGame } from '../../logic/useSpaceTraderGame';

// Mock the zustand store
jest.mock('../../logic/useSpaceTraderGame');

const mockStore = {
  systems: [
    {
      nameIndex: 0,
      x: 0,
      y: 0,
      size: 2,
      techLevel: 5,
      politics: 0,
      specialResources: 0,
      status: 0,
      visited: false,
    },
  ],
  currentSystem: 0,
  credits: 1000,
  ship: {
    type: 0,
    cargo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    weapon: [],
    shield: [],
    gadget: [],
    escapePod: false,
    fuel: 20,
    hull: 25,
  },
  buyPrices: [30, 250, 100, 350, 250, 0, 0, 0, 0, 0],
  sellPrices: [25, 230, 90, 340, 240, 0, 0, 0, 0, 0],
  systemQuantities: [10, 10, 10, 10, 10, 0, 0, 0, 0, 0],
  tradeMode: 'buy',
  setTradeMode: jest.fn(),
  buyGood: jest.fn(),
  sellGood: jest.fn(),
  dumpCargo: jest.fn(),
  difficulty: 2,
  reserveBays: 0,
  optReserveMoney: false,
};

describe('MainTradeView Component', () => {
  beforeEach(() => {
    (useSpaceTraderGame as unknown as jest.Mock).mockReturnValue(mockStore);
  });

  it('renders trade rows when in buy mode', () => {
    render(<MainTradeView onViewChange={jest.fn()} />);
    const rows = document.querySelectorAll('.trade-row-authentic');
    expect(rows.length).toBeGreaterThan(0);
  });

  it('renders 10 trade rows', () => {
    render(<MainTradeView onViewChange={jest.fn()} />);
    const rows = document.querySelectorAll('.trade-row-authentic');
    expect(rows).toHaveLength(10);
  });

  it('displays "not sold" for items with 0 price', () => {
    render(<MainTradeView onViewChange={jest.fn()} />);
    const notSoldLabels = screen.getAllByText('not sold');
    expect(notSoldLabels.length).toBeGreaterThan(0);
  });

  it('displays correct Bays and Cash information', () => {
    render(<MainTradeView onViewChange={jest.fn()} />);
    expect(screen.getByText(/Bays: 0\/10/)).toBeInTheDocument();
    expect(screen.getByText(/Cash: 1000 cr\./)).toBeInTheDocument();
  });

  it('triggers buyGood when "Max" is clicked', () => {
    render(<MainTradeView onViewChange={jest.fn()} />);
    const maxBtns = screen.getAllByText('Max');
    fireEvent.click(maxBtns[0]); // Water
    expect(mockStore.buyGood).toHaveBeenCalled();
  });

  it('opens quantity modal when clicking quantity box', () => {
    render(<MainTradeView onViewChange={jest.fn()} />);
    const qtyBoxes = document.querySelectorAll('.qty-box');
    fireEvent.click(qtyBoxes[0]);

    // The modal should show "Buy Water"
    expect(screen.getByText('Buy Water')).toBeInTheDocument();
    expect(screen.getByText(/Total: \d+ cr/)).toBeInTheDocument();
  });
});
