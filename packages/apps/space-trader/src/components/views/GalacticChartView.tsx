import React, { useState, useMemo } from 'react';
import { useSpaceTraderGame } from '../../logic/useSpaceTraderGame';
import {
  SystemNames,
  ViewType,
  WAR,
  TradeItems,
  PoliticalSystems,
  TechLevels,
  ShipTypes,
  SpecialResources,
} from '../../logic/DataTypes';
import { useTitleBar } from '../TitleBarContext';
import { getStandardPrice } from '../../logic/Merchant';

interface GalacticChartViewProps {
  onViewChange: (view: ViewType) => void;
}

type MapScreen = 'chart' | 'target' | 'prices';

const CHART_W = 264;
const CHART_H = 220;
const CX = CHART_W / 2;
const CY = CHART_H / 2;

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

function labelOffset(sx: number, sy: number): { dx: number; dy: number } {
  const angle = Math.atan2(sy - CY, sx - CX);
  const r = 10;
  return { dx: Math.cos(angle) * r, dy: Math.sin(angle) * r };
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'baseline',
  fontSize: '11px',
  fontFamily: 'monospace',
  lineHeight: '1.5',
  padding: '0',
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

export const GalacticChartView: React.FC<GalacticChartViewProps> = ({ onViewChange }) => {
  const { TitleBar } = useTitleBar();
  const { systems, currentSystem, travelTo, ship } = useSpaceTraderGame();

  const [screen, setScreen] = useState<MapScreen>('chart');
  const [selectedSystem, setSelectedSystem] = useState<number>(currentSystem);
  const [inRangePos, setInRangePos] = useState(0);

  const current = systems[currentSystem];

  // Sorted list of in-range system indices for arrow navigation
  const inRangeSystems = useMemo(() => {
    if (!current) return [];
    return systems
      .map((s, idx) => ({ idx, d: dist(s.x, s.y, current.x, current.y) }))
      .filter(({ idx, d }) => idx !== currentSystem && d <= ship.fuel)
      .sort((a, b) => a.d - b.d)
      .map(({ idx }) => idx);
  }, [systems, currentSystem, current, ship.fuel]);

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

  const target = systems[selectedSystem] ?? systems[0];
  const targetDist = dist(target.x, target.y, current.x, current.y);
  const fuelCost = Math.floor(targetDist);
  const canTravel = selectedSystem !== currentSystem && fuelCost <= ship.fuel;

  // Click on map dot → Target System screen
  const handleMapClick = (idx: number) => {
    setSelectedSystem(idx);
    const pos = inRangeSystems.indexOf(idx);
    setInRangePos(pos >= 0 ? pos : 0);
    setScreen('target');
  };

  // Arrow navigation through in-range systems
  const navPrev = () => {
    if (!inRangeSystems.length) return;
    const newPos = (inRangePos - 1 + inRangeSystems.length) % inRangeSystems.length;
    setInRangePos(newPos);
    setSelectedSystem(inRangeSystems[newPos]);
  };
  const navNext = () => {
    if (!inRangeSystems.length) return;
    const newPos = (inRangePos + 1) % inRangeSystems.length;
    setInRangePos(newPos);
    setSelectedSystem(inRangeSystems[newPos]);
  };

  const handleWarp = () => {
    travelTo(selectedSystem);
    onViewChange('trade');
  };

  const warpBtnStyle: React.CSSProperties = {
    fontSize: '13px',
    fontFamily: 'monospace',
    fontWeight: 'bold',
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

  const NavArrows = () => (
    <div style={{ display: 'flex', gap: '0' }}>
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
  );

  // ── TARGET SYSTEM SCREEN ──
  if (screen === 'target') {
    const pol = PoliticalSystems[target.politics ?? 0];
    return (
      <div
        className="palm-window"
        style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
      >
        {TitleBar && <TitleBar title="Target System" onViewChange={onViewChange} />}

        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
          <div style={{ ...rowStyle, marginBottom: '1px' }}>
            <span>
              <strong>Name:</strong> {SystemNames[target.nameIndex]}
            </span>
            <NavArrows />
          </div>
          <div style={rowStyle}>
            <strong>Size:</strong>&nbsp;{SIZE_LABELS[target.size ?? 1]}
          </div>
          <div style={rowStyle}>
            <strong>Tech level:</strong>&nbsp;{TechLevels[target.techLevel ?? 0]}
          </div>
          <div style={rowStyle}>
            <strong>Government:</strong>&nbsp;{pol?.name ?? '—'}
          </div>
          <div style={rowStyle}>
            <strong>Distance:</strong>&nbsp;
            <span>{fuelCost} parsecs</span>
          </div>
          <div style={rowStyle}>
            <strong>Police:</strong>&nbsp;
            {STRENGTH_LABELS[Math.min(pol?.strengthPolice ?? 0, 7)]}
          </div>
          <div style={rowStyle}>
            <strong>Pirates:</strong>&nbsp;
            {STRENGTH_LABELS[Math.min(pol?.strengthPirates ?? 0, 7)]}
          </div>
          <div style={rowStyle}>
            <strong>Current costs:</strong>&nbsp;0 cr.
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid #000',
            padding: '4px 6px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1 }}>
            <button style={smallBtnStyle} onClick={() => setScreen('prices')}>
              Average Price List
            </button>
            <button style={smallBtnStyle} onClick={() => setScreen('chart')}>
              Short Range Chart
            </button>
          </div>
          <button style={warpBtnStyle} disabled={!canTravel} onClick={handleWarp}>
            Warp
          </button>
        </div>
      </div>
    );
  }

  // ── AVERAGE PRICE LIST SCREEN ──
  if (screen === 'prices') {
    const estimatedPrices = TradeItems.map((item) =>
      getStandardPrice(
        item,
        target.size ?? 1,
        target.techLevel ?? 5,
        target.politics ?? 0,
        target.specialResources ?? 0,
      ),
    );

    const shipType = ShipTypes[ship.type];
    const usedCargo = ship.cargo ? ship.cargo.reduce((a: number, b: number) => a + b, 0) : 0;
    const leftItems = TradeItems.slice(0, 5);
    const rightItems = TradeItems.slice(5, 10);

    return (
      <div
        className="palm-window"
        style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
      >
        {TitleBar && <TitleBar title="Average Price List" onViewChange={onViewChange} />}

        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
          <div style={{ ...rowStyle, marginBottom: '2px' }}>
            <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>
              {SystemNames[target.nameIndex]}
            </span>
            <NavArrows />
          </div>

          <div
            style={{
              fontSize: '10px',
              fontFamily: 'monospace',
              marginBottom: '4px',
              color: '#444',
            }}
          >
            {target.visited
              ? SpecialResources[target.specialResources ?? 0]
              : 'Special resources unknown'}
          </div>

          {/* Price grid — 5 rows × 2 columns */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              columnGap: '6px',
              rowGap: '1px',
            }}
          >
            {leftItems.map((leftItem, i) => {
              const rightItem = rightItems[i];
              const lp = estimatedPrices[leftItem.id];
              const rp = estimatedPrices[rightItem.id];
              // Items requiring tech level ≥ 3 to produce are highlighted (higher-value goods)
              const lBold = leftItem.techProduction >= 3;
              const rBold = rightItem.techProduction >= 3;
              return (
                <React.Fragment key={i}>
                  <div
                    style={{
                      fontSize: '10px',
                      fontFamily: 'monospace',
                      fontWeight: lBold ? 'bold' : 'normal',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>{leftItem.name}</span>
                    <span>{lp > 0 ? `${lp} cr.` : '---'}</span>
                  </div>
                  <div
                    style={{
                      fontSize: '10px',
                      fontFamily: 'monospace',
                      fontWeight: rBold ? 'bold' : 'normal',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>{rightItem.name}</span>
                    <span>{rp > 0 ? `${rp} cr.` : '---'}</span>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid #000',
            padding: '4px 6px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '6px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button style={smallBtnStyle}>Price Differences</button>
              <span style={{ fontSize: '10px', fontFamily: 'monospace' }}>
                Bays: {usedCargo}/{shipType?.cargoBays ?? 15}
              </span>
            </div>
            <button style={smallBtnStyle} onClick={() => setScreen('target')}>
              System Information
            </button>
            <button style={smallBtnStyle} onClick={() => setScreen('chart')}>
              Short Range Chart
            </button>
          </div>
          <button style={warpBtnStyle} disabled={!canTravel} onClick={handleWarp}>
            Warp
          </button>
        </div>
      </div>
    );
  }

  // ── SHORT RANGE CHART (default) ──
  const fuelRange = Math.max(ship.fuel, 1);
  const scale = (Math.min(CX, CY) * 0.45) / fuelRange;
  const warpRadius = fuelRange * scale;

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
          <circle cx={CX} cy={CY} r={warpRadius} fill="none" stroke="#000" strokeWidth="1" />

          <g clipPath="url(#chart-clip)">
            {systems.map((s, idx) => {
              if (idx === currentSystem) return null;
              const { x: sx, y: sy } = project(s.x, s.y);
              const inRange = dist(s.x, s.y, current.x, current.y) <= ship.fuel;
              const isSelected = idx === selectedSystem;
              const dotColor = s.status === WAR ? '#cc4400' : '#33aa00';
              const { dx, dy } = labelOffset(sx, sy);
              const textX = sx + dx;
              const textY = sy + dy;
              const anchor = dx > 0 ? 'start' : dx < -2 ? 'end' : 'middle';
              const baseline = dy > 0 ? 'hanging' : dy < -2 ? 'auto' : 'middle';

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

      {/* Chart footer: selected system info + warp */}
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
            : `${SystemNames[target.nameIndex]} — ${fuelCost} parsecs`}
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
