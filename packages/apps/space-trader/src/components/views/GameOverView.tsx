import React from 'react';
import { useSpaceTraderGame } from '../../logic/useSpaceTraderGame';

export const GameOverView: React.FC = () => {
  const { restartGame, nameCommander, days, credits } = useSpaceTraderGame();

  return (
    <div
      className="palm-window"
      style={{
        background: '#000',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div className="palm-header" style={{ width: '100%', background: '#ff0000' }}>
        GAME OVER
      </div>

      <div className="palm-content" style={{ padding: '20px', textAlign: 'center' }}>
        <h1 style={{ color: '#ff0000', fontSize: '24px', marginBottom: '20px' }}>DEFEAT</h1>
        <p style={{ marginBottom: '10px' }}>Your ship has been destroyed.</p>
        <p style={{ marginBottom: '10px' }}>Commander {nameCommander} is lost in the void.</p>

        <div style={{ margin: '20px 0', border: '1px solid #fff', padding: '10px' }}>
          <p>Days active: {days}</p>
          <p>Final credits: {credits}</p>
        </div>

        <button
          className="palm-btn-large"
          style={{ background: '#fff', color: '#000', padding: '10px 20px' }}
          onClick={restartGame}
        >
          Restart Game
        </button>
      </div>
    </div>
  );
};
