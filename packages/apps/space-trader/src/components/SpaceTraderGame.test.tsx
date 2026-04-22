import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SpaceTraderGame } from './SpaceTraderGame';
import '@testing-library/jest-dom';

describe('SpaceTraderGame Integration', () => {
  it('starts a new game without crashing', async () => {
    render(<SpaceTraderGame />);

    // Find the OK button to start the game
    const okBtn = await screen.findByText('OK');
    fireEvent.click(okBtn);

    // Should transition to either Trade or System view
    // Let's see if it crashes when rendering MainTradeView
    await waitFor(() => {
      expect(screen.queryByText('New Commander')).not.toBeInTheDocument();
    });
  });
});
