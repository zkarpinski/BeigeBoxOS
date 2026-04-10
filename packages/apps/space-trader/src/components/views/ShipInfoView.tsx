import React from 'react';
import { useSpaceTraderGame } from '../../logic/useSpaceTraderGame';
import { ShipTypes, Weapons, Shields, Gadgets, ViewType } from '../../logic/DataTypes';
import { PalmHeader } from '../PalmHeader';

interface ShipInfoViewProps {
  onViewChange: (view: ViewType) => void;
}

export const ShipInfoView: React.FC<ShipInfoViewProps> = ({ onViewChange }) => {
  const { ship, credits, reputationScore, policeRecordScore } = useSpaceTraderGame();
  const shipType = ShipTypes[ship.type];

  // Helper to get item name
  const getWeaponName = (id: number) => (id === -1 ? 'None' : Weapons[id].name);
  const getShieldName = (id: number) => (id === -1 ? 'None' : Shields[id].name);
  const getGadgetName = (id: number) => (id === -1 ? 'None' : Gadgets[id].name);

  return (
    <div className="palm-window">
      <PalmHeader title="Commander Status" onViewChange={onViewChange} />

      <div className="palm-content" style={{ padding: '10px', overflowY: 'auto' }}>
        <p>
          <strong>Ship Type:</strong> {shipType.name}
        </p>
        <p>
          <strong>Hull Strength:</strong> {ship.hull}/{shipType.hullStrength}
        </p>
        <p>
          <strong>Fuel:</strong> {ship.fuel}/{shipType.fuelTanks}
        </p>
        <hr />
        <p>
          <strong>Weapons:</strong>{' '}
          {ship.weapon
            .filter((w) => w !== -1)
            .map(getWeaponName)
            .join(', ') || 'None'}
        </p>
        <p>
          <strong>Shields:</strong>{' '}
          {ship.shield
            .filter((s) => s !== -1)
            .map(getShieldName)
            .join(', ') || 'None'}
        </p>
        <p>
          <strong>Gadgets:</strong>{' '}
          {ship.gadget
            .filter((g) => g !== -1)
            .map(getGadgetName)
            .join(', ') || 'None'}
        </p>
        <hr />
        <p>
          <strong>Reputation:</strong> {reputationScore}
        </p>
        <p>
          <strong>Police Record:</strong> {policeRecordScore}
        </p>
      </div>

      <div className="palm-footer">
        <div className="footer-nav">
          <button className="palm-btn" onClick={() => onViewChange('trade')}>
            Trade
          </button>
          <button className="palm-btn" onClick={() => onViewChange('system')}>
            System Info
          </button>
          <button className="palm-btn active" onClick={() => onViewChange('ship')}>
            Ship Info
          </button>
          <button className="palm-btn" onClick={() => onViewChange('map')}>
            Galactic Chart
          </button>
        </div>
      </div>
    </div>
  );
};
