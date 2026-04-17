import React, { useState } from 'react';
import { useSpaceTraderGame } from '../../logic/useSpaceTraderGame';
import { ViewType } from '../../logic/DataTypes';
import { calculateNetWorth } from '../../logic/store/bankSlice';
import { useTitleBar } from '../TitleBarContext';

interface BankViewProps {
  onViewChange: (view: ViewType) => void;
}

export const BankView: React.FC<BankViewProps> = ({ onViewChange }) => {
  const { TitleBar } = useTitleBar();
  const state = useSpaceTraderGame();
  const { credits, debt, policeRecordScore, borrowCredits, repayDebt } = state;
  const [borrowAmount, setBorrowAmount] = useState('');
  const [repayAmount, setRepayAmount] = useState('');

  const maxLoan = policeRecordScore >= 0 ? 25000 : 5000;
  const canBorrow = Math.max(0, maxLoan - debt);
  const netWorth = calculateNetWorth(state);

  const row = (label: string, value: string) => (
    <div style={{ display: 'flex', marginBottom: '4px', fontSize: '13px', lineHeight: '1.4' }}>
      <span style={{ fontWeight: 'bold', width: '110px', flexShrink: 0 }}>{label}</span>
      <span>{value}</span>
    </div>
  );

  return (
    <div className="palm-window">
      {TitleBar && <TitleBar title="Bank" onViewChange={onViewChange} />}

      <div className="palm-content" style={{ padding: '6px 8px' }}>
        {row('Credits:', `${credits} cr.`)}
        {row('Current Debt:', `${debt} cr.`)}
        {row('Net Worth:', `${netWorth} cr.`)}
        {row('Max Loan:', `${maxLoan} cr.`)}
        {row('Available:', `${canBorrow} cr.`)}

        <div style={{ marginTop: '12px', borderTop: '1px solid #888', paddingTop: '8px' }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
            Borrow Credits
          </div>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <input
              type="number"
              value={borrowAmount}
              onChange={(e) => setBorrowAmount(e.target.value)}
              placeholder="Amount"
              style={{ width: '80px', fontSize: '12px' }}
              min={0}
              max={canBorrow}
            />
            <button
              className="palm-btn"
              disabled={canBorrow <= 0}
              onClick={() => {
                const amt = parseInt(borrowAmount) || canBorrow;
                borrowCredits(amt);
                setBorrowAmount('');
              }}
            >
              Borrow
            </button>
            <button
              className="palm-btn"
              disabled={canBorrow <= 0}
              onClick={() => {
                borrowCredits(canBorrow);
                setBorrowAmount('');
              }}
            >
              Max
            </button>
          </div>
        </div>

        <div style={{ marginTop: '12px', borderTop: '1px solid #888', paddingTop: '8px' }}>
          <div style={{ fontSize: '13px', fontWeight: 'bold', marginBottom: '4px' }}>
            Repay Debt
          </div>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <input
              type="number"
              value={repayAmount}
              onChange={(e) => setRepayAmount(e.target.value)}
              placeholder="Amount"
              style={{ width: '80px', fontSize: '12px' }}
              min={0}
              max={Math.min(debt, credits)}
            />
            <button
              className="palm-btn"
              disabled={debt <= 0 || credits <= 0}
              onClick={() => {
                const amt = parseInt(repayAmount) || Math.min(debt, credits);
                repayDebt(amt);
                setRepayAmount('');
              }}
            >
              Repay
            </button>
            <button
              className="palm-btn"
              disabled={debt <= 0 || credits <= 0}
              onClick={() => {
                repayDebt(Math.min(debt, credits));
                setRepayAmount('');
              }}
            >
              All
            </button>
          </div>
        </div>

        {debt > 0 && (
          <div style={{ marginTop: '8px', fontSize: '11px', color: '#c00' }}>
            Interest accrues at 10% per trip.
          </div>
        )}
      </div>

      <div className="palm-footer">
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '2px 4px' }}>
          <button className="palm-btn" onClick={() => onViewChange('system')}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
