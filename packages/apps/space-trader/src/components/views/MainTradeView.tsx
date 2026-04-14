import React, { useState } from 'react';
import { useSpaceTraderGame } from '../../logic/useSpaceTraderGame';
import { TradeItems, SystemNames, ShipTypes, ViewType } from '../../logic/DataTypes';
import { TradeQuantityModal } from './TradeQuantityModal';
import { useTitleBar } from '../TitleBarContext';
import { TradeRow } from './TradeRow';
import { PriceListTable } from './PriceListTable';
import './MainTradeView.css';

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
    dumpCargo,
    difficulty,
    tradeMode,
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
          <PriceListTable
            systemName={SystemNames[system.nameIndex]}
            buyPrices={buyPrices}
            tradeItems={TradeItems}
          />
        ) : (
          TradeItems.map((item) => (
            <TradeRow
              key={item.id}
              item={item}
              price={tradeMode === 'buy' ? buyPrices[item.id] : sellPrices[item.id]}
              qtyInShip={ship.cargo[item.id]}
              qtyInSystem={systemQuantities[item.id]}
              tradeMode={tradeMode as 'buy' | 'sell'}
              credits={credits}
              shipType={shipType}
              usedCargo={usedCargo}
              difficulty={difficulty}
              onSelect={setSelectedGoodId}
              onAction={tradeMode === 'buy' ? buyGood : sellGood}
              onDump={dumpCargo}
            />
          ))
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
