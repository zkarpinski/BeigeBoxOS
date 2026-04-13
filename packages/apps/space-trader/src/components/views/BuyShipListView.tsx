import React from 'react';
import { useSpaceTraderGame } from '../../logic/useSpaceTraderGame';
import { ShipTypes, ViewType } from '../../logic/DataTypes';
import { useTitleBar } from '../TitleBarContext';

interface BuyShipListViewProps {
  onViewChange: (view: ViewType) => void;
}

export const BuyShipListView: React.FC<BuyShipListViewProps> = ({ onViewChange }) => {
  const { TitleBar } = useTitleBar();
  const { systems, currentSystem, credits, buyShip, ship, setViewingShipId } = useSpaceTraderGame();
  const system = systems[currentSystem];

  return (
    <div className="palm-window" style={{ background: '#fff' }}>
      {TitleBar && <TitleBar title="Buy Ship" onViewChange={onViewChange} />}

      <div className="palm-content" style={{ padding: '0px 4px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
          {ShipTypes.map((s) => {
            const isAvailable = s.minTechLevel <= system.techLevel;
            const isOwned = ship.type === s.id;
            return (
              <div
                key={s.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '13px',
                  padding: '2px 0',
                  borderBottom: '1px solid #f0f0f0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                  <button
                    className="palm-btn"
                    disabled={!isAvailable || isOwned || credits < s.price}
                    style={{
                      padding: '1px 4px',
                      borderRadius: '0',
                      fontSize: '11px',
                      minWidth: '40px',
                      visibility: isAvailable && !isOwned ? 'visible' : 'hidden',
                    }}
                    onClick={() => {
                      buyShip(s.id);
                      onViewChange('trade');
                    }}
                  >
                    Buy
                  </button>
                  <span style={{ fontWeight: 'bold' }}>{s.name}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    className="palm-btn"
                    style={{
                      padding: '1px 6px',
                      borderRadius: '0',
                      fontSize: '11px',
                      minWidth: '34px',
                      border: '1px solid #000',
                    }}
                    onClick={() => {
                      setViewingShipId(s.id);
                      onViewChange('shipInfo');
                    }}
                  >
                    Info
                  </button>
                  <span
                    style={{
                      minWidth: '70px',
                      textAlign: 'right',
                      fontSize: '12px',
                      opacity: isAvailable ? 1 : 0.4,
                    }}
                  >
                    {isOwned ? 'got one' : isAvailable ? `${s.price} cr.` : 'not sold'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        className="palm-footer"
        style={{
          background: '#fff',
          justifyContent: 'flex-end',
          padding: '2px 8px',
          borderTop: 'none',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Cash: {credits} cr.</span>
      </div>
    </div>
  );
};
