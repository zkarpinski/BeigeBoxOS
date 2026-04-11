'use client';

import React, { useState } from 'react';
import { useSpaceTraderGame } from '../logic/useSpaceTraderGame';
import { ViewType } from '../logic/DataTypes';

interface SpaceTraderMenuProps {
  onViewChange: (view: ViewType) => void;
  onClose: () => void;
}

const BG = '#1A1A8C';

const commandItems: Array<{
  label: string;
  shortcut: string;
  view: ViewType;
  mode?: 'buy' | 'sell';
}> = [
  { label: 'Buy Cargo', shortcut: '/B', view: 'trade', mode: 'buy' },
  { label: 'Sell Cargo', shortcut: '/S', view: 'trade', mode: 'sell' },
  { label: 'Ship Yard', shortcut: '/Y', view: 'shipyard' },
  { label: 'Buy Equipment', shortcut: '/E', view: 'equipment' },
  { label: 'Sell Equipment', shortcut: '/Q', view: 'equipment' },
  { label: 'Personnel Roster', shortcut: '/P', view: 'ship' },
  { label: 'Bank', shortcut: '/K', view: 'trade' },
  { label: 'System Information', shortcut: '/I', view: 'system' },
  { label: 'Commander Status', shortcut: '/C', view: 'ship' },
  { label: 'Galactic Chart', shortcut: '/G', view: 'map' },
  { label: 'Short Range Chart', shortcut: '/W', view: 'map' },
];

export function SpaceTraderMenu({ onViewChange, onClose }: SpaceTraderMenuProps) {
  const [tab, setTab] = useState<'Command' | 'Game' | 'Help'>('Command');
  const { setTradeMode } = useSpaceTraderGame();

  const row = (content: React.ReactNode, key: string | number, onClick?: () => void) => (
    <div
      key={key}
      onClick={onClick}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '3px 8px',
        borderBottom: '1px solid #eee',
        cursor: onClick ? 'pointer' : 'default',
        fontFamily: 'sans-serif',
        fontSize: '11px',
      }}
    >
      {content}
    </div>
  );

  return (
    <>
      {/* Dismiss backdrop */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1999 }} onClick={onClose} />

      {/* Menu panel — anchored to top of space-trader-app */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 2000,
          background: 'white',
          border: '1px solid #000',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
        }}
      >
        {/* Tab bar */}
        <div style={{ display: 'flex', background: BG }}>
          {(['Command', 'Game', 'Help'] as const).map((t) => (
            <div
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '3px 8px',
                color: tab === t ? BG : 'white',
                background: tab === t ? 'white' : 'transparent',
                cursor: 'pointer',
                fontWeight: tab === t ? 'bold' : 'normal',
                fontFamily: 'sans-serif',
                fontSize: '11px',
              }}
            >
              {t}
            </div>
          ))}
        </div>

        {tab === 'Command' &&
          commandItems.map((item, idx) =>
            row(
              <>
                <span>{item.label}</span>
                <span style={{ color: '#888' }}>{item.shortcut}</span>
              </>,
              idx,
              () => {
                if (item.mode) setTradeMode(item.mode);
                onViewChange(item.view);
                onClose();
              },
            ),
          )}

        {tab === 'Game' && (
          <>
            {row(<span>New Game</span>, 'new', () => {
              window.location.reload();
            })}
            {row(<span>Switch Game</span>, 'switch', onClose)}
            {row(<span>Retire</span>, 'retire', onClose)}
            <div style={{ borderTop: '1px solid #ccc', margin: '2px 0' }} />
            {row(
              <>
                <span>Options</span>
                <span style={{ color: '#888' }}>/O</span>
              </>,
              'opts',
              onClose,
            )}
            {row(<span>Shortcuts</span>, 'sc', onClose)}
            <div style={{ borderTop: '1px solid #ccc', margin: '2px 0' }} />
            {row(<span>High Scores</span>, 'hs', onClose)}
            {row(<span>Clear High Scores</span>, 'chs', onClose)}
            <div style={{ borderTop: '1px solid #ccc', margin: '2px 0' }} />
            {row(<span>Snapshot</span>, 'snap', onClose)}
          </>
        )}

        {tab === 'Help' && row(<span>About Space Trader</span>, 'about', onClose)}
      </div>
    </>
  );
}
