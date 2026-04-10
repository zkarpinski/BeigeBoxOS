import React, { useState } from 'react';

interface TradeQuantityModalProps {
  mode: 'buy' | 'sell';
  itemName: string;
  price: number;
  available: number;
  maxAffordable: number;
  onConfirm: (amount: number) => void;
  onCancel: () => void;
}

export const TradeQuantityModal: React.FC<TradeQuantityModalProps> = ({
  mode,
  itemName,
  price,
  available,
  maxAffordable,
  onConfirm,
  onCancel,
}) => {
  const max = mode === 'buy' ? Math.min(available, maxAffordable) : available;
  const [amount, setAmount] = useState(max);

  return (
    <div className="palm-modal-overlay">
      <div className="palm-dialog">
        <div className="palm-header" style={{ marginBottom: '0' }}>
          <div className="palm-header-title-container">
            <div className="palm-header-title">
              {mode === 'buy' ? 'Buy' : 'Sell'} {itemName}
            </div>
          </div>
        </div>

        <div
          className="details-panel-authentic"
          style={{ textAlign: 'center', borderTop: '1px solid black' }}
        >
          <p style={{ marginBottom: '8px' }}>Price: {price} cr</p>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginBottom: '8px',
            }}
          >
            <button
              className="palm-btn-small"
              style={{ width: '20px', height: '20px' }}
              onClick={() => setAmount(Math.max(0, amount - 1))}
            >
              -
            </button>
            <div className="qty-box" style={{ width: '40px', height: '20px', fontSize: '14px' }}>
              {amount}
            </div>
            <button
              className="palm-btn-small"
              style={{ width: '20px', height: '20px' }}
              onClick={() => setAmount(Math.min(max, amount + 1))}
            >
              +
            </button>
          </div>
          <p style={{ fontWeight: 'bold' }}>Total: {amount * price} cr</p>
        </div>

        <div style={{ display: 'flex', borderTop: '1px solid black' }}>
          <button
            className="palm-btn"
            style={{ flex: 1, borderTop: 'none', borderLeft: 'none', borderBottom: 'none' }}
            onClick={() => onConfirm(amount)}
          >
            OK
          </button>
          <button
            className="palm-btn"
            style={{ flex: 1, borderTop: 'none', borderRight: 'none', borderBottom: 'none' }}
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
