import React, { useMemo } from 'react';
import { useSpaceTraderGame } from '../../logic/useSpaceTraderGame';
import { ViewType, SystemNames } from '../../logic/DataTypes';
import { generateNews } from '../../logic/News';
import { useTitleBar } from '../TitleBarContext';

interface NewsViewProps {
  onViewChange: (view: ViewType) => void;
}

export const NewsView: React.FC<NewsViewProps> = ({ onViewChange }) => {
  const { TitleBar } = useTitleBar();
  const state = useSpaceTraderGame();
  const { systems, currentSystem } = state;
  const system = systems[currentSystem];

  const headlines = useMemo(
    () =>
      system
        ? generateNews(system, systems, {
            monsterStatus: state.monsterStatus,
            dragonflyStatus: state.dragonflyStatus,
            scarabStatus: state.scarabStatus,
            invasionStatus: state.invasionStatus,
            experimentStatus: state.experimentStatus,
            japoriStatus: state.japoriStatus,
            wildStatus: state.wildStatus,
            jarekStatus: state.jarekStatus,
          })
        : [],
    [system, systems, currentSystem],
  );

  if (!system) return null;

  return (
    <div className="palm-window">
      {TitleBar && <TitleBar title="News" onViewChange={onViewChange} />}

      <div className="palm-content" style={{ padding: '6px 8px' }}>
        <div
          style={{
            fontSize: '14px',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '8px',
            borderBottom: '2px solid #000',
            paddingBottom: '4px',
          }}
        >
          {SystemNames[system.nameIndex]} Herald
        </div>

        {headlines.map((headline, idx) => (
          <div
            key={idx}
            style={{
              fontSize: '12px',
              lineHeight: '1.5',
              marginBottom: '6px',
              paddingBottom: '4px',
              borderBottom: idx < headlines.length - 1 ? '1px dotted #aaa' : 'none',
            }}
          >
            {headline}
          </div>
        ))}
      </div>

      <div className="palm-footer">
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '2px 4px' }}>
          <button className="palm-btn" onClick={() => onViewChange('system')}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
