import React, { useState } from 'react';
import { ViewType } from '../logic/DataTypes';
import { useSpaceTraderGame } from '../logic/useSpaceTraderGame';

interface PalmHeaderProps {
  title: string;
  onViewChange: (view: ViewType) => void;
  className?: string;
}

export const PalmHeader: React.FC<PalmHeaderProps> = ({ title, onViewChange, className }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'Command' | 'Game' | 'Help'>('Command');
  const { setTradeMode } = useSpaceTraderGame();

  const menuItems = [
    { label: 'Buy Cargo', shortcut: '/B', view: 'trade' as ViewType, mode: 'buy' as const },
    { label: 'Sell Cargo', shortcut: '/S', view: 'trade' as ViewType, mode: 'sell' as const },
    { label: 'Ship Yard', shortcut: '/Y', view: 'shipyard' as ViewType },
    { label: 'Buy Equipment', shortcut: '/E', view: 'equipment' as ViewType },
    { label: 'Sell Equipment', shortcut: '/Q', view: 'equipment' as ViewType },
    { label: 'Personnel Roster', shortcut: '/P', view: 'ship' as ViewType },
    { label: 'Bank', shortcut: '/K', view: 'trade' as ViewType },
    { label: 'System Information', shortcut: '/I', view: 'system' as ViewType },
    { label: 'Commander Status', shortcut: '/C', view: 'ship' as ViewType },
    { label: 'Galactic Chart', shortcut: '/G', view: 'map' as ViewType },
    { label: 'Short Range Chart', shortcut: '/W', view: 'map' as ViewType },
  ];

  return (
    <div className={`palm-header ${className || ''}`}>
      <div className="palm-header-title-container">
        <div className="palm-header-title" onClick={() => setMenuOpen(!menuOpen)}>
          {title}
        </div>
      </div>

      {!menuOpen && (
        <div className="palm-title-shortcuts-wrapped">
          <div
            className="palm-shortcut-btn"
            onClick={() => {
              setTradeMode('buy');
              onViewChange('trade');
            }}
          >
            B
          </div>
          <div
            className="palm-shortcut-btn"
            onClick={() => {
              setTradeMode('sell');
              onViewChange('trade');
            }}
          >
            S
          </div>
          <div className="palm-shortcut-btn" onClick={() => onViewChange('shipyard')}>
            Y
          </div>
          <div className="palm-shortcut-btn" onClick={() => onViewChange('map')}>
            W
          </div>
        </div>
      )}

      {menuOpen && (
        <div className="palm-dropdown-container">
          <div className="palm-dropdown-tabs">
            <div
              className={`palm-dropdown-tab ${activeTab === 'Command' ? 'active' : ''}`}
              onClick={() => setActiveTab('Command')}
            >
              Command
            </div>
            <div
              className={`palm-dropdown-tab ${activeTab === 'Game' ? 'active' : ''}`}
              onClick={() => setActiveTab('Game')}
            >
              Game
            </div>
            <div
              className={`palm-dropdown-tab ${activeTab === 'Help' ? 'active' : ''}`}
              onClick={() => setActiveTab('Help')}
            >
              Help
            </div>
          </div>

          {activeTab === 'Command' && (
            <div className="palm-dropdown-list">
              {menuItems.map((item, idx) => (
                <div
                  key={idx}
                  className="palm-dropdown-item"
                  onClick={() => {
                    if (item.mode) setTradeMode(item.mode);
                    onViewChange(item.view);
                    setMenuOpen(false);
                  }}
                >
                  <span>{item.label}</span>
                  <span className="shortcut">{item.shortcut}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'Game' && (
            <div className="palm-dropdown-list">
              <div
                className="palm-dropdown-item"
                onClick={() => {
                  window.location.reload();
                }}
              >
                <span>Quit</span>
              </div>
            </div>
          )}

          {activeTab === 'Help' && (
            <div className="palm-dropdown-list">
              <div className="palm-dropdown-item">
                <span>About Space Trader</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {menuOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'transparent',
            zIndex: 1999,
          }}
          onClick={() => setMenuOpen(false)}
        />
      )}
    </div>
  );
};
