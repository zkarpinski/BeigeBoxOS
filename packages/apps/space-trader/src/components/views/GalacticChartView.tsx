import React, { useState } from 'react';
import { useSpaceTraderGame } from '../../logic/useSpaceTraderGame';
import { SystemNames, ViewType } from '../../logic/DataTypes';
import { PalmHeader } from '../PalmHeader';

interface GalacticChartViewProps {
  onViewChange: (view: ViewType) => void;
}

export const GalacticChartView: React.FC<GalacticChartViewProps> = ({ onViewChange }) => {
  const { systems, currentSystem, travelTo, ship } = useSpaceTraderGame();
  const [selectedSystem, setSelectedSystem] = useState<number>(currentSystem);

  const current = systems[currentSystem];
  const target = systems[selectedSystem];

  // Simple Euclidean distance
  const dist = Math.sqrt(Math.pow(target.x - current.x, 2) + Math.pow(target.y - current.y, 2));
  const canTravel = dist > 0 && dist <= ship.fuel;

  return (
    <div className="palm-window">
      <PalmHeader title="Galactic Chart" onViewChange={onViewChange} />

      <div
        className="palm-content map-container"
        style={{ position: 'relative', height: '180px', background: '#000', overflow: 'hidden' }}
      >
        {systems.map((s, idx) => (
          <div
            key={idx}
            className={`map-dot ${idx === currentSystem ? 'current' : ''} ${idx === selectedSystem ? 'selected' : ''}`}
            style={{
              left: `${s.x}px`,
              top: `${s.y}px`,
              position: 'absolute',
              width: '3px',
              height: '3px',
              background: idx === currentSystem ? '#0f0' : s.visited ? '#fff' : '#666',
              border: idx === selectedSystem ? '1px solid yellow' : 'none',
              borderRadius: '50%',
              cursor: 'pointer',
            }}
            onClick={() => setSelectedSystem(idx)}
          />
        ))}
      </div>

      <div className="map-info" style={{ padding: '8px', flex: 1, background: '#eee' }}>
        <p>
          <strong>Target:</strong> {SystemNames[target.nameIndex]}
        </p>
        <p>
          <strong>Distance:</strong> {Math.floor(dist)} light years
        </p>
        <p>
          <strong>Fuel required:</strong> {Math.floor(dist)}
        </p>
        <button
          className="palm-btn-large"
          disabled={!canTravel}
          onClick={() => {
            travelTo(selectedSystem);
            onViewChange('trade');
          }}
          style={{
            width: '100%',
            marginTop: '4px',
            padding: '6px',
            background: canTravel ? '#2a3d66' : '#ccc',
            color: 'white',
            fontWeight: 'bold',
          }}
        >
          {canTravel ? 'Warp to System' : dist === 0 ? 'Already here' : 'Out of Range'}
        </button>
      </div>

      <div className="palm-footer">
        <div className="footer-nav">
          <button className="palm-btn" onClick={() => onViewChange('trade')}>
            Trade
          </button>
          <button className="palm-btn" onClick={() => onViewChange('system')}>
            System Info
          </button>
          <button className="palm-btn" onClick={() => onViewChange('ship')}>
            Ship Info
          </button>
          <button className="palm-btn active" onClick={() => onViewChange('map')}>
            Chart
          </button>
        </div>
      </div>
    </div>
  );
};
