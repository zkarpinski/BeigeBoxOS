import React from 'react';
import { useSpaceTraderGame } from '../../logic/useSpaceTraderGame';
import { ViewType } from '../../logic/DataTypes';
import { GameModal } from '../modals/GameModal';
import { SpecialEvents } from '../../logic/SpecialEvents';

interface SpecialEventViewProps {
  onViewChange: (view: ViewType) => void;
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

export const SpecialEventView: React.FC<SpecialEventViewProps> = ({ onViewChange }) => {
  const { systems, currentSystem, triggerSpecialEvent, credits } = useSpaceTraderGame();
  const system = systems[currentSystem];

  if (!system || system.special < 0) {
    onViewChange('system');
    return null;
  }

  const eventDef = SpecialEvents[system.special];
  if (!eventDef) {
    onViewChange('system');
    return null;
  }

  const canAfford = eventDef.price <= 0 || credits >= eventDef.price;

  const handleAccept = () => {
    triggerSpecialEvent(currentSystem);
    onViewChange('system');
  };

  const handleDecline = () => {
    onViewChange('system');
  };

  const footer = eventDef.justAMessage ? (
    <button style={btnStyle} onClick={handleAccept}>
      OK
    </button>
  ) : (
    <div style={{ display: 'flex', gap: '8px' }}>
      <button
        style={{ ...btnStyle, opacity: canAfford ? 1 : 0.5 }}
        disabled={!canAfford}
        onClick={handleAccept}
      >
        Yes
      </button>
      <button style={btnStyle} onClick={handleDecline}>
        No
      </button>
    </div>
  );

  return (
    <GameModal isOpen={true} onClose={() => {}} title={eventDef.title} footer={footer}>
      <div style={{ fontSize: '13px', lineHeight: '1.5', padding: '4px 0' }}>
        {eventDef.description}
      </div>
      {eventDef.price > 0 && (
        <div
          style={{
            fontSize: '12px',
            marginTop: '8px',
            fontWeight: 'bold',
          }}
        >
          Cost: {eventDef.price.toLocaleString()} cr.
          {!canAfford && ' (Not enough credits)'}
        </div>
      )}
    </GameModal>
  );
};
