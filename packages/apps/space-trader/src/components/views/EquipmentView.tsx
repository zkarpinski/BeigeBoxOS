import React, { useState } from 'react';
import { useSpaceTraderGame } from '../../logic/useSpaceTraderGame';
import {
  Weapons,
  Shields,
  Gadgets,
  ViewType,
  ESCAPE_POD_PRICE,
  ESCAPE_POD_TECH_LEVEL,
} from '../../logic/DataTypes';
import { useTitleBar } from '../TitleBarContext';

interface EquipmentViewProps {
  onViewChange: (view: ViewType) => void;
}

export const EquipmentView: React.FC<EquipmentViewProps> = ({ onViewChange }) => {
  const { TitleBar } = useTitleBar();
  const { systems, currentSystem, credits, ship, buyWeapon, buyShield, buyGadget, buyEscapePod } =
    useSpaceTraderGame();
  const system = systems[currentSystem];

  const [tab, setTab] = useState<'weapon' | 'shield' | 'gadget'>('weapon');

  if (system.techLevel < 3) {
    return (
      <div className="palm-window">
        {TitleBar && <TitleBar title="Equipment" onViewChange={onViewChange} />}
        <div className="palm-content" style={{ padding: '20px', textAlign: 'center' }}>
          This system is too primitive for equipment sales.
        </div>
        <div className="palm-footer">
          <button className="palm-btn" onClick={() => onViewChange('trade')}>
            Back
          </button>
        </div>
      </div>
    );
  }

  const items = tab === 'weapon' ? Weapons : tab === 'shield' ? Shields : Gadgets;

  return (
    <div className="palm-window">
      {TitleBar && <TitleBar title="Equipment" onViewChange={onViewChange} />}

      <div
        className="trade-mode-tabs"
        style={{ background: 'white', borderBottom: '1px solid black' }}
      >
        <button className={tab === 'weapon' ? 'active' : ''} onClick={() => setTab('weapon')}>
          Wpn
        </button>
        <button className={tab === 'shield' ? 'active' : ''} onClick={() => setTab('shield')}>
          Shd
        </button>
        <button className={tab === 'gadget' ? 'active' : ''} onClick={() => setTab('gadget')}>
          Gdt
        </button>
      </div>

      <div className="palm-content equipment-list-authentic" style={{ flex: 1, overflowY: 'auto' }}>
        {items.map((item) => {
          const canAfford = credits >= item.price;
          const techOk = system.techLevel >= item.techLevel;

          return (
            <div key={item.id} className="equipment-row-authentic">
              <span className="item-name-authentic">{item.name}</span>
              <span style={{ textAlign: 'right', paddingRight: '4px' }}>{item.price} cr</span>
              <button
                className="palm-btn-small"
                disabled={!canAfford || !techOk}
                onClick={() => {
                  if (tab === 'weapon') buyWeapon(item.id);
                  else if (tab === 'shield') buyShield(item.id);
                  else buyGadget(item.id);
                }}
              >
                Buy
              </button>
            </div>
          );
        })}
        {tab === 'gadget' && (
          <div className="equipment-row-authentic">
            <span className="item-name-authentic">Escape pod{ship.escapePod ? ' ✓' : ''}</span>
            <span style={{ textAlign: 'right', paddingRight: '4px' }}>{ESCAPE_POD_PRICE} cr</span>
            <button
              className="palm-btn-small"
              disabled={
                ship.escapePod ||
                credits < ESCAPE_POD_PRICE ||
                system.techLevel < ESCAPE_POD_TECH_LEVEL
              }
              onClick={buyEscapePod}
            >
              {ship.escapePod ? 'Have' : 'Buy'}
            </button>
          </div>
        )}
      </div>

      <div className="palm-footer trade-footer-authentic">
        <button className="palm-btn" onClick={() => onViewChange('trade')}>
          Back
        </button>
        <span>Cash: {credits} cr.</span>
      </div>
    </div>
  );
};
