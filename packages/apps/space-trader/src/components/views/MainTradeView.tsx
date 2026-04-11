import React, { useState } from 'react';
import { useSpaceTraderGame } from '../../logic/useSpaceTraderGame';
import { TradeItems, SystemNames, ShipTypes, ViewType } from '../../logic/DataTypes';
import { TradeQuantityModal } from './TradeQuantityModal';
import { useTitleBar } from '../TitleBarContext';

interface MainTradeViewProps {
  onViewChange: (view: ViewType) => void;
}

export const MainTradeView: React.FC<MainTradeViewProps> = ({ onViewChange }) => {
  const { TitleBar } = useTitleBar();
  const {
    systems,
    currentSystem,
    credits,
    ship,
    buyPrices,
    sellPrices,
    systemQuantities,
    buyGood,
    sellGood,
    tradeMode,
    setTradeMode,
  } = useSpaceTraderGame();

  const [selectedGoodId, setSelectedGoodId] = useState<number | null>(null);
  const system = systems[currentSystem];

  if (!system) return null;

  const usedCargo = ship.cargo.reduce((a: number, b: number) => a + b, 0);
  const shipType = ShipTypes[ship.type];

  return (
    <div className="palm-window">
      {TitleBar && (
        <TitleBar
          title={
            tradeMode === 'price-list'
              ? 'Average Price List'
              : tradeMode === 'buy'
                ? 'Buy Cargo'
                : 'Sell Cargo'
          }
          onViewChange={onViewChange}
        />
      )}

      <div className="trade-table-authentic">
        {tradeMode === 'price-list' ? (
          <div style={{ padding: '8px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
                fontWeight: 'bold',
              }}
            >
              <span>{SystemNames[system.nameIndex]}</span>
              <span>⬅ ⚖ ➡</span>
            </div>
            <p style={{ fontStyle: 'italic', marginBottom: '8px' }}>Nothing special</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              {TradeItems.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{item.name}</span>
                  <span style={{ fontFamily: 'monospace' }}>
                    {buyPrices[item.id] > 0
                      ? `+${buyPrices[item.id] - item.priceLowTech} cr.`
                      : '---'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          TradeItems.map((item) => {
            const price = tradeMode === 'buy' ? buyPrices[item.id] : sellPrices[item.id];
            const qtyInShip = ship.cargo[item.id];
            const qtyInSystem = systemQuantities[item.id];
            const isNotSold = price === 0;

            return (
              <div key={item.id} className="trade-row-authentic">
                <div className="qty-box" onClick={() => setSelectedGoodId(item.id)}>
                  {tradeMode === 'buy' ? qtyInSystem : qtyInShip}
                </div>
                <div className="item-name-authentic">{item.name}</div>
                {!isNotSold ? (
                  <>
                    <div
                      className="all-btn-authentic"
                      onClick={() => {
                        if (tradeMode === 'buy') {
                          const canAfford = Math.floor(credits / price);
                          const amount = Math.min(
                            qtyInSystem,
                            canAfford,
                            shipType.cargoBays - usedCargo,
                          );
                          if (amount > 0) buyGood(item.id, amount);
                        } else {
                          if (qtyInShip > 0) sellGood(item.id, qtyInShip);
                        }
                      }}
                    >
                      {tradeMode === 'buy' ? 'Max' : 'All'}
                    </div>
                    <div className="price-text-authentic">{price} cr.</div>
                  </>
                ) : (
                  <div
                    style={{
                      gridColumn: 'span 2',
                      textAlign: 'right',
                      paddingRight: '2px',
                      fontStyle: 'italic',
                      opacity: 0.7,
                    }}
                  >
                    not sold
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <div className="trade-footer-authentic">
        <span>
          Bays: {usedCargo}/{shipType.cargoBays}
        </span>
        <span>Cash: {credits} cr.</span>
      </div>

      {selectedGoodId !== null && tradeMode !== 'price-list' && (
        <TradeQuantityModal
          mode={tradeMode as 'buy' | 'sell'}
          itemName={TradeItems[selectedGoodId].name}
          price={tradeMode === 'buy' ? buyPrices[selectedGoodId] : sellPrices[selectedGoodId]}
          available={
            tradeMode === 'buy' ? systemQuantities[selectedGoodId] : ship.cargo[selectedGoodId]
          }
          maxAffordable={
            tradeMode === 'buy' ? Math.floor(credits / buyPrices[selectedGoodId]) : 999
          }
          onConfirm={(amount) => {
            if (tradeMode === 'buy') buyGood(selectedGoodId, amount);
            else sellGood(selectedGoodId, amount);
            setSelectedGoodId(null);
          }}
          onCancel={() => setSelectedGoodId(null)}
        />
      )}
    </div>
  );
};
