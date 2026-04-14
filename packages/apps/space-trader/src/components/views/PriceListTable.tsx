import React from 'react';
import { TradeItems, SystemNames, TradeItem } from '../../logic/DataTypes';

interface PriceListTableProps {
  systemName: string;
  buyPrices: number[];
  tradeItems: typeof TradeItems;
}

export const PriceListTable: React.FC<PriceListTableProps> = ({
  systemName,
  buyPrices,
  tradeItems,
}) => {
  return (
    <div style={{ padding: '8px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '8px',
          fontWeight: 'bold',
        }}
      >
        <span>{systemName}</span>
        <span>⬅ ⚖ ➡</span>
      </div>
      <p style={{ fontStyle: 'italic', marginBottom: '8px' }}>Nothing special</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
        {tradeItems.map((item) => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{item.name}</span>
            <span style={{ fontFamily: 'monospace' }}>
              {buyPrices[item.id] > 0
                ? `${buyPrices[item.id] - item.priceLowTech >= 0 ? '+' : ''}${
                    buyPrices[item.id] - item.priceLowTech
                  } cr.`
                : '---'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
