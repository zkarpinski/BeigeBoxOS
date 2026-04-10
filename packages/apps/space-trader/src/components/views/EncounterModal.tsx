import React from 'react';
import { useSpaceTraderGame } from '../../logic/useSpaceTraderGame';

export const EncounterModal: React.FC = () => {
  const { encounter, clearEncounter, ship, takeDamage } = useSpaceTraderGame();

  if (!encounter) return null;

  return (
    <div className="palm-modal-overlay">
      <div className="palm-dialog">
        <div className="palm-header">Encounter!</div>

        <p style={{ fontSize: '10px', marginBottom: '10px' }}>
          You have encountered a {encounter.type}!
          {encounter.type === 'Police' && ' They want to inspect your cargo.'}
          {encounter.type === 'Pirate' && ' They are attacking!'}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button
            className="palm-btn"
            onClick={() => {
              if (encounter.type === 'Pirate') takeDamage(20);
              clearEncounter();
            }}
          >
            Attack
          </button>
          <button
            className="palm-btn"
            onClick={() => {
              if (Math.random() > 0.5) takeDamage(10);
              clearEncounter();
            }}
          >
            Flee
          </button>
          <button className="palm-btn" onClick={clearEncounter}>
            Surrender
          </button>
        </div>
      </div>
    </div>
  );
};
