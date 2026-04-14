import React from 'react';
import { useSpaceTraderGame } from '../../logic/useSpaceTraderGame';
import { SystemNames, ViewType, PoliticalSystems, TechLevels } from '../../logic/DataTypes';
import { useTitleBar } from '../TitleBarContext';

interface TargetSystemViewProps {
  onViewChange: (view: ViewType) => void;
}

const SIZE_LABELS = ['Tiny', 'Small', 'Medium', 'Large', 'Huge'];
const STRENGTH_LABELS = [
  'None',
  'Harmless',
  'Few',
  'Some',
  'Moderate',
  'Many',
  'Abundant',
  'Swarms',
];

function dist(ax: number, ay: number, bx: number, by: number) {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

// Two-column grid: bold label on left, value starts at ~50% (near center)
const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '50% 1fr',
  alignItems: 'baseline',
  fontSize: '13px',
  fontFamily: 'monospace',
  lineHeight: '1.5',
};

const smallBtnStyle: React.CSSProperties = {
  fontSize: '10px',
  fontFamily: 'monospace',
  padding: '2px 8px',
  background: '#f5f5f5',
  border: '1px solid #888',
  borderRadius: '4px',
  cursor: 'pointer',
  textAlign: 'left',
  whiteSpace: 'nowrap',
};

export const TargetSystemView: React.FC<TargetSystemViewProps> = ({ onViewChange }) => {
  const { TitleBar } = useTitleBar();
  const { systems, currentSystem, selectedMapSystemId, setSelectedMapSystem, travelTo, ship } =
    useSpaceTraderGame();

  const current = systems[currentSystem];
  const targetIdx = selectedMapSystemId ?? currentSystem;
  const target = systems[targetIdx] ?? systems[0];
  const pol = PoliticalSystems[target.politics ?? 0];

  const targetDist = dist(target.x, target.y, current.x, current.y);
  const fuelCost = Math.floor(targetDist);
  const canTravel = targetIdx !== currentSystem && fuelCost <= ship.fuel;

  // In-range systems sorted by distance for arrow navigation
  const inRangeSystems = React.useMemo(() => {
    if (!current) return [];
    return systems
      .map((s, idx) => ({ idx, d: dist(s.x, s.y, current.x, current.y) }))
      .filter(({ idx, d }) => idx !== currentSystem && d <= ship.fuel)
      .sort((a, b) => a.d - b.d)
      .map(({ idx }) => idx);
  }, [systems, currentSystem, current, ship.fuel]);

  const currentPos = inRangeSystems.indexOf(targetIdx);

  const navPrev = () => {
    if (!inRangeSystems.length) return;
    const newPos = (currentPos - 1 + inRangeSystems.length) % inRangeSystems.length;
    setSelectedMapSystem(inRangeSystems[newPos]);
  };

  const navNext = () => {
    if (!inRangeSystems.length) return;
    const newPos = (currentPos + 1) % inRangeSystems.length;
    setSelectedMapSystem(inRangeSystems[newPos]);
  };

  const handleWarp = () => {
    travelTo(targetIdx);
    onViewChange('trade');
  };

  const warpBtnStyle: React.CSSProperties = {
    fontSize: '18px',
    fontFamily: 'monospace',
    fontWeight: 'normal',
    padding: '6px 14px',
    minWidth: '60px',
    minHeight: '54px',
    background: canTravel ? '#f5f5f5' : '#e0e0e0',
    color: canTravel ? '#000' : '#888',
    border: '2px solid #888',
    borderRadius: '8px',
    cursor: canTravel ? 'pointer' : 'default',
    alignSelf: 'stretch',
  };

  return (
    <div
      className="palm-window"
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      {TitleBar && <TitleBar title="Target System" onViewChange={onViewChange} />}

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
        <div style={gridStyle}>
          <strong>Name:</strong>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{SystemNames[target.nameIndex]}</span>
            <div style={{ display: 'flex' }}>
              <button
                onClick={navPrev}
                disabled={inRangeSystems.length === 0}
                style={{
                  padding: '1px 5px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  background: '#f0f0f0',
                  border: '1px solid #888',
                  cursor: 'pointer',
                  lineHeight: '14px',
                }}
                aria-label="Previous system"
              >
                ◄
              </button>
              <button
                onClick={navNext}
                disabled={inRangeSystems.length === 0}
                style={{
                  padding: '1px 5px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  background: '#f0f0f0',
                  border: '1px solid #888',
                  borderLeft: 'none',
                  cursor: 'pointer',
                  lineHeight: '14px',
                }}
                aria-label="Next system"
              >
                ►
              </button>
            </div>
          </div>

          <strong>Size:</strong>
          <span>{SIZE_LABELS[target.size ?? 1]}</span>

          <strong>Tech level:</strong>
          <span>{TechLevels[target.techLevel ?? 0]}</span>

          <strong>Government:</strong>
          <span>{pol?.name ?? '—'}</span>

          <strong>Distance:</strong>
          <span>{fuelCost} parsecs</span>

          <strong>Police:</strong>
          <span>{STRENGTH_LABELS[Math.min(pol?.strengthPolice ?? 0, 7)]}</span>

          <strong>Pirates:</strong>
          <span>{STRENGTH_LABELS[Math.min(pol?.strengthPirates ?? 0, 7)]}</span>

          <strong>Current costs:</strong>
          <span>0 cr.</span>
        </div>

        {!canTravel && targetIdx !== currentSystem && (
          <div style={{ fontSize: '11px', fontFamily: 'monospace', marginTop: '2px' }}>
            This system is out of range
          </div>
        )}
      </div>

      <div
        style={{
          padding: '4px 6px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '6px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1 }}>
          {canTravel && (
            <button style={smallBtnStyle} onClick={() => onViewChange('pricelist')}>
              Average Price List
            </button>
          )}
          <button style={smallBtnStyle} onClick={() => onViewChange('map')}>
            Short Range Chart
          </button>
        </div>
        {canTravel && (
          <button style={warpBtnStyle} onClick={handleWarp}>
            Warp
          </button>
        )}
      </div>
    </div>
  );
};
