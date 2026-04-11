import React, { useState } from 'react';
import { useSpaceTraderGame } from '../../logic/useSpaceTraderGame';
import { SystemNames, ViewType, WAR } from '../../logic/DataTypes';
import { useTitleBar } from '../TitleBarContext';

interface GalacticChartViewProps {
  onViewChange: (view: ViewType) => void;
}

const CHART_W = 264;
const CHART_H = 230;
const CX = CHART_W / 2;
const CY = CHART_H / 2;

function dist(ax: number, ay: number, bx: number, by: number) {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

// Compute a label anchor offset so names don't sit on top of the dot
function labelOffset(sx: number, sy: number): { dx: number; dy: number } {
  const angle = Math.atan2(sy - CY, sx - CX);
  const r = 10;
  return {
    dx: Math.cos(angle) * r,
    dy: Math.sin(angle) * r,
  };
}

export const GalacticChartView: React.FC<GalacticChartViewProps> = ({ onViewChange }) => {
  const { TitleBar } = useTitleBar();
  const { systems, currentSystem, travelTo, ship } = useSpaceTraderGame();
  const [selectedSystem, setSelectedSystem] = useState<number>(currentSystem);

  const current = systems[currentSystem];
  const target = systems[selectedSystem] ?? systems[0];

  if (!current || !systems.length) {
    return (
      <div
        className="palm-window"
        style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
      >
        {TitleBar && <TitleBar title="Short Range Chart" onViewChange={onViewChange} />}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontFamily: 'monospace',
            padding: '8px',
            textAlign: 'center',
          }}
        >
          No galaxy data. Start a new game first.
        </div>
      </div>
    );
  }
  const targetDist = dist(target.x, target.y, current.x, current.y);
  const canTravel = targetDist > 0 && targetDist <= ship.fuel;

  // Scale so that 2x the warp range fits within the chart (warp circle at ~45% radius)
  const fuelRange = Math.max(ship.fuel, 1);
  const scale = (Math.min(CX, CY) * 0.45) / fuelRange;
  const warpRadius = fuelRange * scale;

  // Project a system to SVG coords relative to current system
  const project = (sx: number, sy: number) => ({
    x: CX + (sx - current.x) * scale,
    y: CY + (sy - current.y) * scale,
  });

  return (
    <div
      className="palm-window"
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      {TitleBar && <TitleBar title="Short Range Chart" onViewChange={onViewChange} />}

      <div style={{ flex: 1, overflow: 'hidden', background: 'white' }}>
        <svg
          width={CHART_W}
          height={CHART_H}
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          style={{ display: 'block', background: 'white' }}
        >
          <defs>
            <clipPath id="chart-clip">
              <rect x="0" y="0" width={CHART_W} height={CHART_H} />
            </clipPath>
          </defs>
          {/* Warp range circle */}
          <circle cx={CX} cy={CY} r={warpRadius} fill="none" stroke="#000" strokeWidth="1" />

          {/* Systems */}
          <g clipPath="url(#chart-clip)">
            {systems.map((s, idx) => {
              if (idx === currentSystem) return null;
              const { x: sx, y: sy } = project(s.x, s.y);

              const inRange = dist(s.x, s.y, current.x, current.y) <= ship.fuel;
              const isSelected = idx === selectedSystem;
              const dotColor = s.status === WAR ? '#cc4400' : '#33aa00';
              const { dx, dy } = labelOffset(sx, sy);

              // Anchor text away from center
              const textX = sx + dx;
              const textY = sy + dy;
              const anchor = dx > 0 ? 'start' : dx < -2 ? 'end' : 'middle';
              const baseline = dy > 0 ? 'hanging' : dy < -2 ? 'auto' : 'middle';

              return (
                <g key={idx} onClick={() => setSelectedSystem(idx)} style={{ cursor: 'pointer' }}>
                  {isSelected && (
                    <circle
                      cx={sx}
                      cy={sy}
                      r="7"
                      fill="none"
                      stroke="#000"
                      strokeWidth="1"
                      strokeDasharray="2,1"
                    />
                  )}
                  <circle
                    cx={sx}
                    cy={sy}
                    r={inRange ? 4.5 : 3}
                    fill={inRange ? dotColor : '#888'}
                  />
                  <text
                    x={textX}
                    y={textY}
                    fontSize="9"
                    fontFamily="'Courier New', monospace"
                    fill="#000"
                    textAnchor={anchor}
                    dominantBaseline={baseline}
                  >
                    {SystemNames[s.nameIndex]}
                  </text>
                </g>
              );
            })}
          </g>
          {/* Current system — blue diamond */}
          <polygon
            points={`${CX},${CY - 9} ${CX + 7},${CY} ${CX},${CY + 9} ${CX - 7},${CY}`}
            fill="#2244cc"
          />
          <polygon
            points={`${CX},${CY - 5} ${CX + 4},${CY} ${CX},${CY + 5} ${CX - 4},${CY}`}
            fill="#6688ff"
          />
        </svg>
      </div>

      {/* Travel button strip */}
      <div
        style={{
          borderTop: '1px solid #000',
          padding: '3px 4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#f0f0f0',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: '10px', fontFamily: 'monospace' }}>
          {selectedSystem === currentSystem
            ? 'Select a system'
            : `${SystemNames[target.nameIndex]} — ${Math.floor(targetDist)} parsecs`}
        </span>
        <button
          disabled={!canTravel}
          onClick={() => {
            travelTo(selectedSystem);
            onViewChange('trade');
          }}
          style={{
            fontSize: '10px',
            fontFamily: 'monospace',
            padding: '2px 6px',
            background: canTravel ? '#1A1A8C' : '#ccc',
            color: canTravel ? 'white' : '#888',
            border: '1px solid #000',
            cursor: canTravel ? 'pointer' : 'default',
          }}
        >
          Warp
        </button>
      </div>
    </div>
  );
};
