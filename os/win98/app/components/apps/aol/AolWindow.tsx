'use client';

import React, { useState } from 'react';
import { AppWindow } from '../../win98/AppWindow';
import { TitleBar } from '../../win98/TitleBar';
import type { AppConfig } from '@/app/types/app-config';
import { AolSignOn } from './AolSignOn';
import { AolMainInterface } from './AolMainInterface';
import { AolLogoLarge } from './AolIcon';

export const aolAppConfig: AppConfig = {
  id: 'aol',
  label: 'America Online 4.0',
  icon: 'apps/aol/aol-icon.png',
  openByDefault: false,
  desktop: true,
  startMenu: { path: ['Programs', 'Internet'] },
  taskbarLabel: 'America Online 4.0',
};

export function AolWindow() {
  const [isSignedOn, setIsSignedOn] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [activeWindow, setActiveWindow] = useState<string | null>(null);

  const handleSignOn = () => {
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      setIsSignedOn(true);
    }, 1500);
  };

  const handleSignOff = () => {
    setIsSignedOn(false);
    setActiveWindow(null);
  };

  return (
    <AppWindow
      id="aol-window"
      appId="aol"
      className="aol-window app-window win-border-outset"
      titleBar={
        <TitleBar
          title="America Online"
          icon={
            <img
              src="/apps/aol/aol-icon.png"
              alt=""
              width={16}
              height={16}
              className="aol-title-icon"
            />
          }
          showMin
          showMax
          showClose
        />
      }
    >
      <div className="aol-app-container">
        <div className="aol-content-area">
          {!isSignedOn && !isConnecting && <AolSignOn onSignOn={handleSignOn} />}
          {isConnecting && (
            <div className="aol-connecting-screen">
              <div className="aol-signon-dialog">
                <div className="aol-signon-left">
                  <div className="aol-logo-container">
                    <AolLogoLarge />
                    <div className="aol-version">version 4.0</div>
                  </div>
                </div>
                <div
                  className="aol-signon-right"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <h3 style={{ marginTop: 0 }}>Connecting to America Online...</h3>
                  <div className="aol-progress-bar">
                    <div className="aol-progress-fill" />
                  </div>
                  <p style={{ fontSize: '12px', marginTop: '10px' }}>
                    Step 1: Initializing Modem...
                  </p>
                </div>
              </div>
            </div>
          )}
          {isSignedOn && (
            <AolMainInterface
              onSignOff={handleSignOff}
              activeWindow={activeWindow}
              openChannel={(channel) => setActiveWindow(channel)}
              closeActiveWindow={() => setActiveWindow(null)}
            />
          )}
        </div>
      </div>
    </AppWindow>
  );
}
