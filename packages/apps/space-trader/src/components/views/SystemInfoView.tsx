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

const STRENGTH_LEVELS = [
  'Absent',
  'Minimal',
  'Few',
  'Some',
  'Moderate',
  'Abundant',
  'Swarms',
  'Overwhelming',
];

const SIZE_LABELS = ['Tiny', 'Small', 'Medium', 'Large', 'Huge'];

export const SystemInfoView: React.FC<SystemInfoViewProps> = ({ onViewChange }) => {
  const { TitleBar } = useTitleBar();
  const { systems, currentSystem, isAiEnabled, toggleAi } = useSpaceTraderGame();
  const system = systems[currentSystem];

  if (!system) return null;

  const pol = PoliticalSystems[system.politics];
  const policeLabel = STRENGTH_LEVELS[pol.strengthPolice] ?? 'Unknown';
  const pirateLabel = STRENGTH_LEVELS[pol.strengthPirates] ?? 'Unknown';

  const row = (label: string, value: string) => (
    <div
      style={{
        display: 'flex',
        marginBottom: '4px',
        fontSize: '13px',
        lineHeight: '1.4',
      }}
    >
      <span style={{ fontWeight: 'bold', width: '110px', flexShrink: 0 }}>{label}</span>
      <span>{value}</span>
    </div>
  );

  return (
    <div className="palm-window">
      {TitleBar && <TitleBar title="System Info" onViewChange={onViewChange} />}

      <div
        className="palm-content"
        style={{ padding: '6px 8px', display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ flex: 1 }}>
          {row('Name:', SystemNames[system.nameIndex])}
          {row('Size:', SIZE_LABELS[system.size])}
          {row('Tech level:', TechLevels[system.techLevel])}
          {row('Government:', pol.name)}
          {row('Resources:', SpecialResources[system.specialResources])}
          {row('Police:', policeLabel)}
          {row('Pirates:', pirateLabel)}

          <div style={{ marginTop: '8px', fontSize: '13px', lineHeight: '1.5' }}>
            The system is currently {Status[system.status]}
          </div>
        </div>
      </div>

      <div className="palm-footer">
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 4px' }}>
          <button className="palm-btn" onClick={() => onViewChange('news')}>
            News
          </button>
          <button className="palm-btn" onClick={() => onViewChange('bank')}>
            Bank
          </button>
          <button className="palm-btn" onClick={() => toggleAi()}>
            {isAiEnabled ? 'Stop AI' : 'Start AI'}
          </button>
          <button
            className="palm-btn"
            disabled={system.special < 0}
            onClick={() => system.special >= 0 && onViewChange('specialEvent')}
          >
            Special
          </button>
        </div>
      </div>
    </div>
  );
};
