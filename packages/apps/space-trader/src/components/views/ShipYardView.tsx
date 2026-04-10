import React, { useState } from 'react';
import { useSpaceTraderGame } from '../../logic/useSpaceTraderGame';
import { ShipTypes, ViewType } from '../../logic/DataTypes';
import { PalmHeader } from '../PalmHeader';

interface ShipYardViewProps {
  onViewChange: (view: ViewType) => void;
}

export const ShipYardView: React.FC<ShipYardViewProps> = ({ onViewChange }) => {
  const { systems, currentSystem, credits, buyShip, ship, repairHull } = useSpaceTraderGame();
  const system = systems[currentSystem];

  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  // Shipyard only at tech level 4+
  if (system.techLevel < 4) {
    return (
      <div className="palm-window">
        <PalmHeader title="Shipyard" onViewChange={onViewChange} />
        <div className="palm-content" style={{ padding: '20px', textAlign: 'center' }}>
          This system is too primitive for a shipyard.
        </div>
        <div className="palm-footer">
          <button className="palm-btn" onClick={() => onViewChange('trade')}>
            Back
          </button>
        </div>
      </div>
    );
  }

  const availableShips = ShipTypes.filter((s) => s.minTechLevel <= system.techLevel);
  const selectedShip = availableShips[selectedIndex] || availableShips[0];

  return (
    <div className="palm-window">
      <PalmHeader title="Shipyard" onViewChange={onViewChange} />

      <div
        className="palm-content"
        style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
      >
        <div className="ship-list-authentic" style={{ height: '100px', overflowY: 'auto' }}>
          {availableShips.map((s, idx) => (
            <div
              key={s.id}
              className={`ship-row-authentic ${idx === selectedIndex ? 'selected' : ''}`}
              onClick={() => setSelectedIndex(idx)}
            >
              <span className="item-name-authentic">{s.name}</span>
              <span style={{ textAlign: 'right' }}>{s.price} cr</span>
            </div>
          ))}
        </div>

        <div className="ship-details details-panel-authentic" style={{ flex: 1 }}>
          <div style={{ marginBottom: '4px' }}>
            <strong>Bays:</strong> {selectedShip.cargoBays} | <strong>Hull:</strong>{' '}
            {selectedShip.hullStrength}
            <br />
            <strong>Wpn/Shd/Gdt:</strong> {selectedShip.weaponSlots}/{selectedShip.shieldSlots}/
            {selectedShip.gadgetSlots}
            <br />
            <strong>Crew:</strong> {selectedShip.crewQuarters} | <strong>Fuel:</strong>{' '}
            {selectedShip.fuelTanks}
          </div>

          <button
            className="palm-btn-large"
            disabled={credits < selectedShip.price}
            style={{ width: '100%', fontWeight: 'bold' }}
            onClick={() => {
              buyShip(selectedShip.id);
              onViewChange('trade');
            }}
          >
            Buy {selectedShip.name}
          </button>

          <div style={{ marginTop: '8px', borderTop: '1px solid #ccc', paddingTop: '4px' }}>
            <div style={{ fontSize: '9px', marginBottom: '2px' }}>
              Current: {ShipTypes[ship.type].name} ({ship.hull}/{ShipTypes[ship.type].hullStrength}{' '}
              Hull)
            </div>
            <button
              className="palm-btn-small"
              style={{ width: '100%' }}
              disabled={
                ship.hull >= ShipTypes[ship.type].hullStrength ||
                credits <
                  (ShipTypes[ship.type].hullStrength - ship.hull) * ShipTypes[ship.type].repairCosts
              }
              onClick={repairHull}
            >
              Repair (
              {(ShipTypes[ship.type].hullStrength - ship.hull) * ShipTypes[ship.type].repairCosts}{' '}
              cr)
            </button>
          </div>
        </div>
      </div>

      <div className="palm-footer trade-footer-authentic">
        <button className="palm-btn" onClick={() => onViewChange('trade')}>
          Back
        </button>
        <span>Cash: {credits} cr.</span>
      </div>
    </div>
  );
};
