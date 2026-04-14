import React, { useState } from 'react';
import { useSpaceTraderGame } from '../../logic/useSpaceTraderGame';
import { ShipTypes, ViewType } from '../../logic/DataTypes';
import { useTitleBar } from '../TitleBarContext';
import { InformationButton } from '../common/InformationButton';
import { TipsModal } from '../modals/TipsModal';
import { GameModal } from '../modals/GameModal';
import { SHIP_SPRITES } from '../../assets/ships/ShipSprites';

interface ShipInformationViewProps {
  onViewChange: (view: ViewType) => void;
}

export const ShipInformationView: React.FC<ShipInformationViewProps> = ({ onViewChange }) => {
  const { viewingShipId } = useSpaceTraderGame();
  const [showTips, setShowTips] = useState(false);

  if (viewingShipId === null) {
    return null;
  }

  const selectedShip = ShipTypes[viewingShipId];
  const labelStyle: React.CSSProperties = { fontWeight: 'bold', width: '120px' };
  const shipSizes = ['Tiny', 'Small', 'Medium', 'Large', 'Huge'];

  return (
    <GameModal
      isOpen={true}
      onClose={() => onViewChange('buyShip')}
      title="Ship Information"
      footer={
        <button
          className="palm-btn"
          style={{ borderRadius: '12px', padding: '2px 20px' }}
          onClick={() => onViewChange('buyShip')}
        >
          Ship For Sale List
        </button>
      }
    >
      <div
        style={{
          position: 'absolute',
          top: '0',
          right: '0',
          padding: '4px',
          zIndex: 1,
        }}
      >
        <InformationButton
          onClick={() => setShowTips(true)}
          style={{ position: 'static', background: 'transparent', color: '#fff' }}
        />
      </div>

      <div style={{ position: 'relative', width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div style={{ display: 'flex' }}>
            <span style={labelStyle}>Name:</span>
            <span>{selectedShip.name}</span>
          </div>
          <div style={{ display: 'flex' }}>
            <span style={labelStyle}>Size:</span>
            <span>{shipSizes[selectedShip.size]}</span>
          </div>
          <div style={{ display: 'flex' }}>
            <span style={labelStyle}>Cargo Bays:</span>
            <span>{selectedShip.cargoBays}</span>
          </div>
          <div style={{ display: 'flex' }}>
            <span style={labelStyle}>Range:</span>
            <span>{selectedShip.fuelTanks} parsecs</span>
          </div>
          <div style={{ display: 'flex' }}>
            <span style={labelStyle}>Hull Strength:</span>
            <span>{selectedShip.hullStrength}</span>
          </div>
          <div style={{ display: 'flex' }}>
            <span style={labelStyle}>Weapon Slots:</span>
            <span>{selectedShip.weaponSlots}</span>
          </div>
          <div style={{ display: 'flex' }}>
            <span style={labelStyle}>Shield Slots:</span>
            <span>{selectedShip.shieldSlots}</span>
          </div>
          <div style={{ display: 'flex' }}>
            <span style={labelStyle}>Gadget Slots:</span>
            <span>{selectedShip.gadgetSlots}</span>
          </div>
          <div style={{ display: 'flex' }}>
            <span style={labelStyle}>Crew Quarters:</span>
            <span>{selectedShip.crewQuarters}</span>
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            top: '90px', // Align with 'Weapon Slots' line
            right: '0',
            textAlign: 'right',
          }}
        >
          {React.createElement(SHIP_SPRITES[selectedShip.id], {
            style: {
              transform: 'scale(0.8)',
              transformOrigin: 'right center',
              imageRendering: 'pixelated',
            },
          })}
        </div>
      </div>

      <TipsModal isOpen={showTips} onClose={() => setShowTips(false)}>
        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '15px' }}>
          The Ship Information screen shows the specs of the selected ship type. You can return to
          the Buy Ship screen by tapping the button at the bottom of the screen.
        </p>
      </TipsModal>
    </GameModal>
  );
};
