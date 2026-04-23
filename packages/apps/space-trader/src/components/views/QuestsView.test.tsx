import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QuestsView } from './QuestsView';
import { useSpaceTraderGame } from '../../logic/useSpaceTraderGame';

describe('QuestsView', () => {
  beforeEach(() => {
    useSpaceTraderGame.setState(useSpaceTraderGame.getInitialState());
  });

  it('renders empty quest state', () => {
    render(<QuestsView onViewChange={() => {}} />);
    expect(screen.getByText(/No active quests/i)).toBeInTheDocument();
  });

  it('renders active quests', () => {
    useSpaceTraderGame.setState({
      monsterStatus: 1,
      dragonflyStatus: 1,
      japoriStatus: 1,
      antidoteOnBoard: true,
    });
    render(<QuestsView onViewChange={() => {}} />);

    expect(screen.getByText(/Space Monster/i)).toBeInTheDocument();
    expect(screen.getByText(/Dragonfly Hunt/i)).toBeInTheDocument();
    expect(screen.getByText(/Japori Disease/i)).toBeInTheDocument();
    expect(screen.getByText(/Special Cargo:/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Antidote/i)[0]).toBeInTheDocument();
  });
});
