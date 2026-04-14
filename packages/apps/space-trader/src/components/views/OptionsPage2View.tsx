import React from 'react';
import { useSpaceTraderGame } from '../../logic/useSpaceTraderGame';
import { ViewType } from '../../logic/DataTypes';
import { GameModal } from '../modals/GameModal';
import { InformationButton } from '../common/InformationButton';

interface OptionsPage2ViewProps {
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

const btnStyle: React.CSSProperties = {
  padding: '3px 16px',
  border: '1.5px solid #000',
  borderRadius: '12px',
  background: '#fff',
  fontSize: '13px',
  cursor: 'pointer',
  fontFamily: 'monospace',
};

export const OptionsPage2View: React.FC<OptionsPage2ViewProps> = ({ onViewChange }) => {
  const {
    optPayForNewspaper,
    optShowRangeToTracked,
    optStopTrackingOnArrival,
    optTextualEncounters,
    optRemindAboutLoans,
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
      <button style={btnStyle} onClick={() => onViewChange('trade')}>
        Done
      </button>
      <button style={btnStyle} onClick={() => onViewChange('options')}>
        Options Page 1
      </button>
    </div>
  );

  return (
    <GameModal
      isOpen={true}
      onClose={() => {}}
      title="Options Page 2"
      titleRight={
        <InformationButton onClick={() => {}} style={{ position: 'relative', right: 'auto' }} />
      }
      footer={footer}
    >
      {row('Always pay for newspaper', 'optPayForNewspaper', optPayForNewspaper)}
      {row('Enable use of hardware buttons', 'optHardwareButtons', false)}
      {row('Show range to tracked system', 'optShowRangeToTracked', optShowRangeToTracked)}
      {row('Stop tracking on arrival', 'optStopTrackingOnArrival', optStopTrackingOnArrival)}
      {row('Textual encounters', 'optTextualEncounters', optTextualEncounters)}
      {row('Remind about loans', 'optRemindAboutLoans', optRemindAboutLoans)}
      {row('Identify at startup', 'optIdentifyAtStartup', false)}
      {row('Copy prefs from parallel game', 'optCopyPrefs', false)}
    </GameModal>
  );
};
