import React from 'react';
import { TradeItem, ShipType } from '../../logic/DataTypes';

interface TradeRowProps {
  item: TradeItem;
  price: number;
  qtyInShip: number;
  qtyInSystem: number;
  tradeMode: 'buy' | 'sell';
  credits: number;
  effectiveCredits: number;
  shipType: ShipType;
  usedCargo: number;
  effectiveFreeBays: number;
  difficulty: number;
  onSelect: (id: number) => void;
  onAction: (id: number, amount: number) => void;
  onDump: (id: number, amount: number) => void;
}

export const TradeRow: React.FC<TradeRowProps> = ({
  item,
  price,
  qtyInShip,
  qtyInSystem,
  tradeMode,
  credits,
  effectiveCredits,
  shipType,
  usedCargo,
  effectiveFreeBays,
  difficulty,
  onSelect,
  onAction,
  onDump,
}) => {
  const isNotSold = price === 0;

  return (
    <div className="trade-row-authentic">
      {isNotSold ? (
        <div />
      ) : (
        <div className="qty-box" onClick={() => onSelect(item.id)}>
          {tradeMode === 'buy' ? qtyInSystem : qtyInShip}
        </div>
      )}
      <div className="item-name-authentic">{item.name}</div>
      {!isNotSold ? (
        <>
          <div
            className="all-btn-authentic"
            onClick={() => {
              if (tradeMode === 'buy') {
                const canAfford = Math.floor(effectiveCredits / price);
                const amount = Math.min(qtyInSystem, canAfford, effectiveFreeBays);
                if (amount > 0) onAction(item.id, amount);
              } else {
                if (qtyInShip > 0) onAction(item.id, qtyInShip);
              }
            }}
          >
            {tradeMode === 'buy' ? 'Max' : 'All'}
          </div>
          <div className="price-text-authentic">{price} cr.</div>
        </>
      ) : tradeMode === 'sell' ? (
        <>
          <div
            className="all-btn-authentic"
            title={`Dump cost: ${5 * (difficulty + 1)} cr/unit`}
            onClick={() => {
              if (qtyInShip > 0) onDump(item.id, qtyInShip);
            }}
          >
            Dump
          </div>
          <div className="price-text-authentic">no trade</div>
        </>
      ) : (
        <>
          <div />
          <div className="price-text-authentic">not sold</div>
        </>
      )}
    </div>
  );
};
