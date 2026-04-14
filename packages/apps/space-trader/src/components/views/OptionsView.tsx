import React from 'react';
import { useSpaceTraderGame } from '../../logic/useSpaceTraderGame';
import { ViewType } from '../../logic/DataTypes';
import { GameModal } from '../modals/GameModal';
import { InformationButton } from '../common/InformationButton';

interface OptionsViewProps {
  onViewChange: (view: ViewType) => void;
}

const checkStyle: React.CSSProperties = {
  width: '14px',
  height: '14px',
  border: '1px solid #000',
  background: '#fff',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  flexShrink: 0,
  fontSize: '11px',
  fontWeight: 'bold',
};

function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <div style={checkStyle} onClick={onChange}>
      {checked ? '✓' : ''}
    </div>
  );
}

export const OptionsView: React.FC<OptionsViewProps> = ({ onViewChange }) => {
  const {
    optAutoFuel,
    optAutoRepair,
    optIgnorePolice,
    optIgnorePirates,
    optIgnoreTraders,
    optIgnoreDealingTraders,
    optReserveMoney,
    optChartToInfo,
    optContinuousFight,
    optAttackFleeing,
    reserveBays,
    setOption,
  } = useSpaceTraderGame();

  const toggle = (key: string, current: boolean) => setOption(key, !current);

  const row = (label: string, key: string, checked: boolean) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '1px',
        fontSize: '13px',
      }}
    >
      <Checkbox checked={checked} onChange={() => toggle(key, checked)} />
      <span>{label}</span>
    </div>
  );

  const footer = (
    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
      <button
        onClick={() => onViewChange('trade')}
        style={{
          padding: '3px 16px',
          border: '1.5px solid #000',
          borderRadius: '12px',
          background: '#fff',
          fontSize: '13px',
          cursor: 'pointer',
          fontFamily: 'monospace',
        }}
      >
        Done
      </button>
      <button
        onClick={() => onViewChange('options2')}
        style={{
          padding: '3px 16px',
          border: '1.5px solid #000',
          borderRadius: '12px',
          background: '#fff',
          fontSize: '13px',
          cursor: 'pointer',
          fontFamily: 'monospace',
        }}
      >
        Options Page 2
      </button>
    </div>
  );

  return (
    <GameModal
      isOpen={true}
      onClose={() => {}}
      title="Options Page 1"
      titleRight={
        <InformationButton onClick={() => {}} style={{ position: 'relative', right: 'auto' }} />
      }
      footer={footer}
    >
      <div style={{ fontSize: '13px', marginBottom: '1px' }}>Always ignore when it is safe:</div>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '2px', fontSize: '13px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Checkbox
            checked={optIgnorePolice}
            onChange={() => toggle('optIgnorePolice', optIgnorePolice)}
          />
          <span>Police</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Checkbox
            checked={optIgnorePirates}
            onChange={() => toggle('optIgnorePirates', optIgnorePirates)}
          />
          <span>Pirates</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Checkbox
            checked={optIgnoreTraders}
            onChange={() => toggle('optIgnoreTraders', optIgnoreTraders)}
          />
          <span>Traders</span>
        </div>
      </div>

      {row('Ignore dealing traders', 'optIgnoreDealingTraders', optIgnoreDealingTraders)}
      {row('Get full tank on arrival', 'optAutoFuel', optAutoFuel)}
      {row('Get full hull repair on arrival', 'optAutoRepair', optAutoRepair)}
      {row('Reserve money for warp costs', 'optReserveMoney', optReserveMoney)}
      {row('Always go from Chart to Info', 'optChartToInfo', optChartToInfo)}
      {row('Continuous attack and flight', 'optContinuousFight', optContinuousFight)}
      {row('Continue attacking fleeing ship', 'optAttackFleeing', optAttackFleeing)}

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
        <span>Cargo bays to leave empty:</span>
        <span
          style={{
            borderBottom: '1px dotted #000',
            minWidth: '20px',
            textAlign: 'center',
            cursor: 'pointer',
            fontFamily: 'monospace',
          }}
          onClick={() => {
            const val = parseInt(
              prompt('Cargo bays to leave empty:', String(reserveBays)) ?? String(reserveBays),
              10,
            );
            if (!isNaN(val) && val >= 0) setOption('reserveBays', val);
          }}
        >
          {reserveBays}
        </span>
      </div>
    </GameModal>
  );
};
