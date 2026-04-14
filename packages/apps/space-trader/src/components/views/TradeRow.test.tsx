import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TradeRow } from './TradeRow';
import { ShipTypes, TradeItems } from '../../logic/DataTypes';

const mockItem = TradeItems[0]; // Water

const mockShipType = ShipTypes[0]; // Flea

describe('TradeRow Component', () => {
  const defaultProps = {
    item: mockItem,
    price: 35,
    qtyInShip: 5,
    qtyInSystem: 10,
    tradeMode: 'buy' as const,
    credits: 1000,
    effectiveCredits: 1000,
    shipType: mockShipType,
    usedCargo: 2,
    effectiveFreeBays: mockShipType.cargoBays - 2,
    difficulty: 2,
    onSelect: jest.fn(),
    onAction: jest.fn(),
    onDump: jest.fn(),
  };

  it('renders item name and price', () => {
    render(<TradeRow {...defaultProps} />);
    expect(screen.getByText('Water')).toBeInTheDocument();
    expect(screen.getByText('35 cr.')).toBeInTheDocument();
  });

  it('renders qty in system when in buy mode', () => {
    render(<TradeRow {...defaultProps} />);
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('renders qty in ship when in sell mode', () => {
    render(<TradeRow {...defaultProps} tradeMode="sell" />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('calls onSelect when clicking quantity box', () => {
    render(<TradeRow {...defaultProps} />);
    fireEvent.click(screen.getByText('10'));
    expect(defaultProps.onSelect).toHaveBeenCalledWith(0);
  });

  it('calls onAction with Max amount when in buy mode', () => {
    render(<TradeRow {...defaultProps} />);
    fireEvent.click(screen.getByText('Max'));
    // credits 1000 / price 35 = 28.5 (28)
    // qtyInSystem = 10
    // freeCargo = 10 - 2 = 8
    // min(10, 28, 8) = 8
    expect(defaultProps.onAction).toHaveBeenCalledWith(0, 8);
  });

  it('calls onAction with All amount when in sell mode', () => {
    render(<TradeRow {...defaultProps} tradeMode="sell" />);
    fireEvent.click(screen.getByText('All'));
    expect(defaultProps.onAction).toHaveBeenCalledWith(0, 5);
  });

  it('handles "not sold" state', () => {
    render(<TradeRow {...defaultProps} price={0} />);
    expect(screen.getByText('not sold')).toBeInTheDocument();
    expect(screen.queryByText('Max')).not.toBeInTheDocument();
  });

  it('handles "no trade" state in sell mode', () => {
    render(<TradeRow {...defaultProps} price={0} tradeMode="sell" />);
    expect(screen.getByText('no trade')).toBeInTheDocument();
    expect(screen.getByText('Dump')).toBeInTheDocument();
  });

  it('calls onDump when clicking Dump', () => {
    render(<TradeRow {...defaultProps} price={0} tradeMode="sell" />);
    fireEvent.click(screen.getByText('Dump'));
    expect(defaultProps.onDump).toHaveBeenCalledWith(0, 5);
  });
});
