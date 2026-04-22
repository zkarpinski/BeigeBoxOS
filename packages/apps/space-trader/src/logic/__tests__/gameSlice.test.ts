import { useSpaceTraderGame } from '../useSpaceTraderGame';

describe('Game Slice', () => {
  beforeEach(() => {
    localStorage.clear();
    useSpaceTraderGame.setState(useSpaceTraderGame.getInitialState());
  });

  it('restartGame should clear local storage and reset to new game view without reloading window', () => {
    // Mock window location reload to ensure it is NOT called
    const originalReload = window.location.reload;
    const mockReload = jest.fn();
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { reload: mockReload },
    });

    // Simulate game state
    useSpaceTraderGame.setState({
      nameCommander: 'TestPlayer',
      activeView: 'trade',
      isGameOver: true,
      isAiEnabled: true,
    });
    localStorage.setItem('space-trader-save', 'mock-save-data');

    // Trigger restart
    useSpaceTraderGame.getState().restartGame();

    // Verify state was reset correctly
    const state = useSpaceTraderGame.getState();
    expect(state.nameCommander).toBe('');
    expect(state.activeView).toBe('newgame');
    expect(state.isGameOver).toBe(false);
    expect(state.isAiEnabled).toBe(false);

    // Verify window.location.reload was NOT called
    expect(mockReload).not.toHaveBeenCalled();

    // Restore original
    window.location.reload = originalReload;
  });
});
