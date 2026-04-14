import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PriceListTable } from './PriceListTable';

const mockTradeItems = [
  { id: 0, name: 'Water', priceLowTech: 30 },
  { id: 1, name: 'Furs', priceLowTech: 250 },
] as any;

describe('PriceListTable Component', () => {
  const defaultProps = {
    systemName: 'Tatooine',
    buyPrices: [35, 230],
    tradeItems: mockTradeItems,
  };

  it('renders system name', () => {
    render(<PriceListTable {...defaultProps} />);
    expect(screen.getByText('Tatooine')).toBeInTheDocument();
  });

  it('renders relative prices', () => {
    render(<PriceListTable {...defaultProps} />);
    // Water: 35 - 30 = +5
    expect(screen.getByText('+5 cr.')).toBeInTheDocument();
    // Furs: 230 - 250 = -20
    expect(screen.getByText('-20 cr.')).toBeInTheDocument();
  });

  it('renders "---" for 0 prices', () => {
    render(<PriceListTable {...defaultProps} buyPrices={[0, 230]} />);
    expect(screen.getByText('---')).toBeInTheDocument();
  });
});
