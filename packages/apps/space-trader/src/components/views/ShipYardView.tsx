import React from 'react';
import { useSpaceTraderGame } from '../../logic/useSpaceTraderGame';
import { ShipTypes, ViewType } from '../../logic/DataTypes';
import { useTitleBar } from '../TitleBarContext';

interface ShipYardViewProps {
  onViewChange: (view: ViewType) => void;
}

export const ShipYardView: React.FC<ShipYardViewProps> = ({ onViewChange }) => {
  const { TitleBar } = useTitleBar();
  const { systems, currentSystem, credits, ship, repairHull, buyFuel } = useSpaceTraderGame();
  const system = systems[currentSystem];
  const shipType = ShipTypes[ship.type];

  // OG rules: fuel always available; repairs at Medieval (2)+; ships filtered by minTechLevel
  const canRepair = system.techLevel >= 2;

  // Calculate fuel and hull costs
  const fuelCost = shipType.costOfFuel;
  const fuelNeeded = shipType.fuelTanks - ship.fuel;
  const fuelCostTotal = fuelNeeded * fuelCost;
  const hullNeeded = shipType.hullStrength - ship.hull;
  const repairCostTotal = hullNeeded * shipType.repairCosts;

  const availableShips = ShipTypes.filter((s) => s.minTechLevel <= system.techLevel);

  return (
    <div
      className="palm-window"
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      {TitleBar && <TitleBar title="Ship Yard" onViewChange={onViewChange} />}

      <div style={{ flex: 1, overflow: 'hidden', background: 'white', position: 'relative' }}>
        {/* Fuel Section */}
        <div style={{ marginBottom: '16px' }}>
          <div>You have fuel to fly {ship.fuel} parsecs.</div>
          {ship.fuel >= shipType.fuelTanks ? (
            <div style={{ marginBottom: '4px' }}>Your tank cannot hold more fuel.</div>
          ) : (
            <>
              <div style={{ marginBottom: '4px' }}>A full tank costs {fuelCostTotal} cr.</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="palm-btn"
                  disabled={credits < fuelCost}
                  onClick={() => buyFuel(1)}
                >
                  Buy Fuel
                </button>
                <button
                  className="palm-btn"
                  disabled={credits < fuelCostTotal}
                  onClick={() => buyFuel(fuelNeeded)}
                >
                  Buy Full Tank
                </button>
              </div>
            </>
          )}
        </div>

        {/* Hull Section */}
        <div style={{ marginTop: '25px', marginBottom: '16px' }}>
          {canRepair ? (
            <>
              <div>
                Your hull strength is at {Math.floor((ship.hull / shipType.hullStrength) * 100)}%.
              </div>
              {ship.hull >= shipType.hullStrength ? (
                <div style={{ marginBottom: '4px' }}>No repairs are needed.</div>
              ) : (
                <>
                  <div style={{ marginBottom: '4px' }}>
                    Full repair will cost {repairCostTotal} cr.
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="palm-btn"
                      disabled={credits < shipType.repairCosts}
                      onClick={repairHull}
                    >
                      Repair
                    </button>
                    <button
                      className="palm-btn"
                      disabled={credits < repairCostTotal}
                      onClick={repairHull}
                    >
                      Full Repairs
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            <div>This system is too primitive for hull repairs.</div>
          )}
        </div>

        {/* Ships for Sale Section */}
        <div style={{ marginTop: '25px', marginBottom: '16px' }}>
          <div style={{ marginBottom: '4px' }}>
            {availableShips.length > 0 ? 'Ships are for sale.' : 'No new ships are for sale.'}
          </div>
          <button className="palm-btn" onClick={() => onViewChange('buyShip')}>
            View Ship Info
          </button>
        </div>

        {/* Escape Pods Section */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ marginBottom: '4px' }}>No escape pods are for sale.</div>
        </div>

        <div style={{ textAlign: 'right', fontSize: '12px', fontWeight: 'bold', marginTop: '8px' }}>
          Cash: {credits} cr.
        </div>
      </div>
    </div>
  );
};
