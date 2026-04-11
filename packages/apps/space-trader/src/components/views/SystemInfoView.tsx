import React from 'react';
import { useSpaceTraderGame } from '../../logic/useSpaceTraderGame';
import {
  PoliticalSystems,
  TechLevels,
  SpecialResources,
  Status,
  SystemNames,
  ViewType,
} from '../../logic/DataTypes';
import { useTitleBar } from '../TitleBarContext';

interface SystemInfoViewProps {
  onViewChange: (view: ViewType) => void;
}

export const SystemInfoView: React.FC<SystemInfoViewProps> = ({ onViewChange }) => {
  const { TitleBar } = useTitleBar();
  const { systems, currentSystem } = useSpaceTraderGame();
  const system = systems[currentSystem];

  if (!system) return null;

  const pol = PoliticalSystems[system.politics];

  return (
    <div className="palm-window">
      {TitleBar && <TitleBar title="System Info" onViewChange={onViewChange} />}

      <div className="palm-content" style={{ padding: '10px' }}>
        <p>
          <strong>Size:</strong> {['Tiny', 'Small', 'Medium', 'Large', 'Huge'][system.size]}
        </p>
        <p>
          <strong>Tech Level:</strong> {TechLevels[system.techLevel]}
        </p>
        <p>
          <strong>Government:</strong> {pol.name}
        </p>
        <p>
          <strong>Resources:</strong> {SpecialResources[system.specialResources]}
        </p>
        <p>
          <strong>Status:</strong> {Status[system.status]}
        </p>
      </div>

      <div className="palm-footer">
        <div className="footer-nav">
          <button className="palm-btn" onClick={() => onViewChange('trade')}>
            Trade
          </button>
          <button className="palm-btn active" onClick={() => onViewChange('system')}>
            System
          </button>
          <button className="palm-btn" onClick={() => onViewChange('ship')}>
            Ship
          </button>
          <button className="palm-btn" onClick={() => onViewChange('map')}>
            Chart
          </button>
          {system.techLevel >= 4 && (
            <button className="palm-btn" onClick={() => onViewChange('shipyard')}>
              Yard
            </button>
          )}
          {system.techLevel >= 3 && (
            <button className="palm-btn" onClick={() => onViewChange('equipment')}>
              Equip
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
