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
  const {
    systems,
    currentSystem,
    credits,
    ship,
    buyWeapon,
    buyShield,
    buyGadget,
    buyEscapePod,
    sellEquipment,
  } = useSpaceTraderGame();
  const system = systems[currentSystem];

  const [tab, setTab] = useState<'weapon' | 'shield' | 'gadget' | 'sell'>('weapon');

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
        <button className={tab === 'sell' ? 'active' : ''} onClick={() => setTab('sell')}>
          Sell
        </button>
      </div>

      <div className="palm-content equipment-list-authentic" style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'sell' ? (
          <>
            {ship.weapon.map((wId, i) =>
              wId < 0 ? null : (
                <div key={`w${i}`} className="equipment-row-authentic">
                  <span className="item-name-authentic">{Weapons[wId].name}</span>
                  <span style={{ textAlign: 'right', paddingRight: '4px' }}>
                    {Math.floor(Weapons[wId].price / 2)} cr
                  </span>
                  <button className="palm-btn-small" onClick={() => sellEquipment('weapon', i)}>
                    Sell
                  </button>
                </div>
              ),
            )}
            {ship.shield.map((sId, i) =>
              sId < 0 ? null : (
                <div key={`s${i}`} className="equipment-row-authentic">
                  <span className="item-name-authentic">{Shields[sId].name}</span>
                  <span style={{ textAlign: 'right', paddingRight: '4px' }}>
                    {Math.floor(Shields[sId].price / 2)} cr
                  </span>
                  <button className="palm-btn-small" onClick={() => sellEquipment('shield', i)}>
                    Sell
                  </button>
                </div>
              ),
            )}
            {ship.gadget.map((gId, i) =>
              gId < 0 ? null : (
                <div key={`g${i}`} className="equipment-row-authentic">
                  <span className="item-name-authentic">{Gadgets[gId].name}</span>
                  <span style={{ textAlign: 'right', paddingRight: '4px' }}>
                    {Math.floor(Gadgets[gId].price / 2)} cr
                  </span>
                  <button className="palm-btn-small" onClick={() => sellEquipment('gadget', i)}>
                    Sell
                  </button>
                </div>
              ),
            )}
            {ship.weapon.every((w) => w < 0) &&
              ship.shield.every((s) => s < 0) &&
              ship.gadget.every((g) => g < 0) && (
                <div style={{ padding: '8px', fontSize: '9px', textAlign: 'center' }}>
                  No equipment installed.
                </div>
              )}
          </>
        ) : (
          <>
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
                <span style={{ textAlign: 'right', paddingRight: '4px' }}>
                  {ESCAPE_POD_PRICE} cr
                </span>
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
          </>
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
