'use client';

import React, { forwardRef } from 'react';
import { AolIconSmall, AolLogoLarge } from './AolIcon';

export interface AolChannelsWindowProps {
  openChannel: (channel: string) => void;
}

export const AolChannelsWindow = forwardRef<HTMLDivElement, AolChannelsWindowProps>(
  function AolChannelsWindow({ openChannel }, ref) {
    return (
      <div ref={ref} className="aol-channels-window">
        <div className="aol-channels-titlebar">
          <AolIconSmall /> Channels
          <div className="aol-channels-titlebar-controls">
            <button className="aol-win-btn">_</button>
            <button className="aol-win-btn">□</button>
            <button className="aol-win-btn">X</button>
          </div>
        </div>
        <div className="aol-channels-body">
          <div className="aol-channels-left">
            <div className="aol-channels-logo">
              <AolLogoLarge />
              <h2>Channels</h2>
              <div className="aol-channels-return">
                <span className="running-man">🏃</span> Return to Welcome
              </div>
              <button className="aol-channels-find-btn">
                <span className="find-icon">🔍</span> Find
              </button>
            </div>
          </div>
          <div className="aol-channels-right">
            <div className="aol-channels-grid-left">
              <button
                className="aol-channel-btn btn-aol-today"
                onClick={() => openChannel('AOL Today')}
              >
                AOL Today
              </button>
              <button className="aol-channel-btn btn-news" onClick={() => openChannel('NEWS')}>
                NEWS
              </button>
              <button className="aol-channel-btn btn-sports" onClick={() => openChannel('SPORTS')}>
                SPORTS
              </button>
              <button
                className="aol-channel-btn btn-influence"
                onClick={() => openChannel('Influence')}
              >
                Influence
              </button>
              <button className="aol-channel-btn btn-travel" onClick={() => openChannel('Travel')}>
                Travel
              </button>
              <button
                className="aol-channel-btn btn-international"
                onClick={() => openChannel('International')}
              >
                International
              </button>
              <button
                className="aol-channel-btn btn-personal-finance"
                onClick={() => openChannel('Personal Finance')}
              >
                Personal Finance
              </button>
              <button
                className="aol-channel-btn btn-workplace"
                onClick={() => openChannel('WorkPlace')}
              >
                WorkPlace
              </button>
              <button
                className="aol-channel-btn btn-computing"
                onClick={() => openChannel('Computing')}
              >
                Computing
              </button>
              <button
                className="aol-channel-btn btn-research"
                onClick={() => openChannel('Research & Learn')}
              >
                Research & Learn
              </button>
              <button
                className="aol-channel-btn btn-entertainment"
                onClick={() => openChannel('entertainment')}
              >
                entertainment
              </button>
            </div>
            <div className="aol-channels-grid-right">
              <button className="aol-channel-btn btn-games" onClick={() => openChannel('Games')}>
                Games
              </button>
              <button
                className="aol-channel-btn btn-interests"
                onClick={() => openChannel('Interests')}
              >
                Interests
              </button>
              <button
                className="aol-channel-btn btn-lifestyles"
                onClick={() => openChannel('Lifestyles')}
              >
                Lifestyles
              </button>
              <button
                className="aol-channel-btn btn-shopping"
                onClick={() => openChannel('Shopping')}
              >
                Shopping
              </button>
              <button className="aol-channel-btn btn-health" onClick={() => openChannel('Health')}>
                Health
              </button>
              <button
                className="aol-channel-btn btn-families"
                onClick={() => openChannel('families')}
              >
                families
              </button>
              <button
                className="aol-channel-btn btn-kidsonly"
                onClick={() => openChannel('Kids Only')}
              >
                Kids Only
              </button>
              <button className="aol-channel-btn btn-local" onClick={() => openChannel('Local')}>
                Local
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  },
);
