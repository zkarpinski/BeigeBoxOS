import React from 'react';
import { useSpaceTraderGame } from '../../logic/useSpaceTraderGame';
import { SystemNames, ViewType, WAR, ShipTypes } from '../../logic/DataTypes';
import { useTitleBar } from '../TitleBarContext';

interface GalacticChartViewProps {
  onViewChange: (view: ViewType) => void;
}

// Coordinate space for projection math — SVG scales to fill the container
const CHART_W = 264;
const CHART_H = 220;
const CX = CHART_W / 2;
const CY = CHART_H / 2;
// Fraction of min(CX, CY) used as warp-circle radius on screen.
// 0.65 matches the original PalmOS short-range chart proportions.
const ZOOM = 0.65;

function dist(ax: number, ay: number, bx: number, by: number) {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
}

// Label sits above the dot. With font-size 14 and dominantBaseline="auto", the
// text baseline is at sy+LABEL_DY. Descenders extend ~3px below baseline and
// the filter adds ~2px padding, so the white box bottom ≈ sy+LABEL_DY+5.
// Dot radius is 4.5, so we need LABEL_DY+5 < -4.5, i.e. LABEL_DY < -9.5.
// -14 gives a comfortable 4-5px gap between the label box and the dot edge.
const LABEL_DY = -14;

export const GalacticChartView: React.FC<GalacticChartViewProps> = ({ onViewChange }) => {
  const { TitleBar } = useTitleBar();
  const { systems, currentSystem, setSelectedMapSystem, selectedMapSystemId, ship } =
    useSpaceTraderGame();

  const current = systems[currentSystem];

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

  const selectedSystem = selectedMapSystemId ?? currentSystem;

  const handleMapClick = (idx: number) => {
    setSelectedMapSystem(idx);
    onViewChange('target');
  };

  // ── SHORT RANGE CHART ──
  // Scale is fixed to the full tank capacity so visible systems never change.
  // The warp circle shrinks with current fuel.
  const maxFuel = Math.max(ShipTypes[ship.type]?.fuelTanks ?? 1, 1);
  const scale = (Math.min(CX, CY) * ZOOM) / maxFuel;
  const warpRadius = Math.max(ship.fuel, 0) * scale;

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

      <div style={{ flex: 1, overflow: 'hidden', background: 'white', position: 'relative' }}>
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${CHART_W} ${CHART_H}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ display: 'block', background: 'white' }}
        >
          <defs>
            <clipPath id="chart-clip">
              <rect x="0" y="0" width={CHART_W} height={CHART_H} />
            </clipPath>
            {/* White background box behind each system name label */}
            <filter id="label-bg" x="-5%" y="-15%" width="110%" height="140%">
              <feFlood floodColor="white" result="bg" />
              <feMerge>
                <feMergeNode in="bg" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle cx={CX} cy={CY} r={warpRadius} fill="none" stroke="#000" strokeWidth="1" />

          <g clipPath="url(#chart-clip)">
            {systems.map((s, idx) => {
              if (idx === currentSystem) return null;
              const { x: sx, y: sy } = project(s.x, s.y);
              const inRange = dist(s.x, s.y, current.x, current.y) <= ship.fuel;
              const isSelected = idx === selectedSystem;
              const dotColor = s.status === WAR ? '#cc4400' : '#33aa00';

              return (
                <g
                  key={idx}
                  className="map-dot"
                  onClick={() => handleMapClick(idx)}
                  style={{ cursor: 'pointer' }}
                >
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
                    x={sx}
                    y={sy + LABEL_DY}
                    fontSize="14"
                    fontFamily="'Courier New', monospace"
                    fill="#000000"
                    textAnchor="middle"
                    dominantBaseline="auto"
                    filter="url(#label-bg)"
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
    </div>
  );
};
