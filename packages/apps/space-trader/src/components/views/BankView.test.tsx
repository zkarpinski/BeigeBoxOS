import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BankView } from './BankView';
import { useSpaceTraderGame } from '../../logic/useSpaceTraderGame';
import { TitleBarProvider } from '../../components/TitleBarContext';

describe('BankView', () => {
  beforeEach(() => {
    useSpaceTraderGame.setState(useSpaceTraderGame.getInitialState());
  });

  const renderView = () =>
    render(
      <TitleBarProvider>
        <BankView onViewChange={() => {}} />
      </TitleBarProvider>,
    );

  it('renders bank details correctly', () => {
    useSpaceTraderGame.setState({ credits: 5000, debt: 1000, policeRecordScore: 0 });
    renderView();

    expect(screen.getByText('5000 cr.')).toBeInTheDocument(); // Credits
    expect(screen.getByText('1000 cr.')).toBeInTheDocument(); // Debt
  });

  it('handles borrow and payback via Max/All buttons', () => {
    useSpaceTraderGame.setState({ credits: 5000, debt: 0, policeRecordScore: 0 }); // Max loan 25000
    renderView();

    // Borrow max
    fireEvent.click(screen.getByText('Max'));
    expect(useSpaceTraderGame.getState().debt).toBe(1000);
    expect(useSpaceTraderGame.getState().credits).toBe(6000);

    // Pay back all
    fireEvent.click(screen.getByText('All'));
    expect(useSpaceTraderGame.getState().debt).toBe(0);
    expect(useSpaceTraderGame.getState().credits).toBe(5000);
  });
});
