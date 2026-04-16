import React, { useState } from 'react';
import { useSpaceTraderGame } from '../../logic/useSpaceTraderGame';
import {
  SystemNames,
  ViewType,
  TradeItems,
  ShipTypes,
  SpecialResources,
} from '../../logic/DataTypes';
import { useTitleBar } from '../TitleBarContext';
import { getStandardPrice } from '../../logic/Merchant';

interface AveragePriceListViewProps {
  onViewChange: (view: ViewType) => void;
}

function dist(ax: number, ay: number, bx: number, by: number) {
  return Math.sqrt((ax - bx) ** 2 + (ay - by) ** 2);
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

export const AveragePriceListView: React.FC<AveragePriceListViewProps> = ({ onViewChange }) => {
  const { TitleBar } = useTitleBar();
  const { systems, currentSystem, selectedMapSystemId, setSelectedMapSystem, ship, travelTo } =
    useSpaceTraderGame();
  const [showDiff, setShowDiff] = useState(false);

  const current = systems[currentSystem];
  const targetIdx = selectedMapSystemId ?? currentSystem;
  const target = systems[targetIdx] ?? systems[0];

  const targetDist = dist(target.x, target.y, current.x, current.y);
  const fuelCost = Math.floor(targetDist);
  const canTravel = targetIdx !== currentSystem && fuelCost <= ship.fuel;

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
    setSelectedMapSystem(
      inRangeSystems[(currentPos - 1 + inRangeSystems.length) % inRangeSystems.length],
    );
  };
  const navNext = () => {
    if (!inRangeSystems.length) return;
    setSelectedMapSystem(inRangeSystems[(currentPos + 1) % inRangeSystems.length]);
  };

  const estimatedPrices = TradeItems.map((item) =>
    getStandardPrice(
      item,
      target.size ?? 1,
      target.techLevel ?? 5,
      target.politics ?? 0,
      target.specialResources ?? 0,
    ),
  );

  const currentPrices = TradeItems.map((item) =>
    getStandardPrice(
      item,
      current.size ?? 1,
      current.techLevel ?? 5,
      current.politics ?? 0,
      current.specialResources ?? 0,
    ),
  );

  const shipType = ShipTypes[ship.type];
  const usedCargo = ship.cargo ? ship.cargo.reduce((a: number, b: number) => a + b, 0) : 0;
  const leftItems = TradeItems.slice(0, 5);
  const rightItems = TradeItems.slice(5, 10);

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
            const lcp = currentPrices[leftItem.id];
            const rcp = currentPrices[rightItem.id];

            let lLabel: string;
            let rLabel: string;
            let lBold: boolean;
            let rBold: boolean;

            if (showDiff) {
              const lDiff = lp > 0 && lcp > 0 ? lp - lcp : null;
              const rDiff = rp > 0 && rcp > 0 ? rp - rcp : null;
              lLabel = lDiff !== null ? `${lDiff >= 0 ? '+' : ''}${lDiff} cr.` : '---';
              rLabel = rDiff !== null ? `${rDiff >= 0 ? '+' : ''}${rDiff} cr.` : '---';
              lBold = lDiff !== null && lDiff !== 0;
              rBold = rDiff !== null && rDiff !== 0;
            } else {
              lLabel = lp > 0 ? `${lp} cr.` : '---';
              rLabel = rp > 0 ? `${rp} cr.` : '---';
              lBold = leftItem.techProduction >= 3;
              rBold = rightItem.techProduction >= 3;
            }

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
                  <span>{lLabel}</span>
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
                  <span>{rLabel}</span>
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
          <button style={smallBtnStyle} onClick={() => onViewChange('target')}>
            System Information
          </button>
          <button style={smallBtnStyle} onClick={() => onViewChange('map')}>
            Short Range Chart
          </button>
        </div>
        <button
          style={warpBtnStyle}
          disabled={!canTravel}
          onClick={() => {
            /* warp handled from target */
          }}
        >
          Warp
        </button>
      </div>
    </div>
  );
};
