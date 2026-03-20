'use client';

import React, { useRef } from 'react';
import { useAolDraggable } from './useAolDraggable';
import { AolChannelsWindow } from './AolChannelsWindow';
import { AolMockWindow } from './AolMockWindow';

export interface AolMainInterfaceProps {
  onSignOff: () => void;
  activeWindow: string | null;
  openChannel: (channel: string) => void;
  closeActiveWindow: () => void;
}

export function AolMainInterface({
  onSignOff,
  activeWindow,
  openChannel,
  closeActiveWindow,
}: AolMainInterfaceProps) {
  const workspaceRef = useRef<HTMLDivElement>(null);
  const channelsWindowRef = useRef<HTMLDivElement>(null);
  const mockWindowRef = useRef<HTMLDivElement>(null);

  useAolDraggable(channelsWindowRef, workspaceRef, '.aol-channels-titlebar');
  useAolDraggable(mockWindowRef, workspaceRef, '.aol-mock-titlebar', [activeWindow]);

  return (
    <div className="aol-main-interface">
      <div className="aol-menubar">
        <span>
          <u>F</u>ile
        </span>
        <span>
          <u>E</u>dit
        </span>
        <span>
          <u>W</u>indow
        </span>
        <span onClick={onSignOff} style={{ cursor: 'pointer' }}>
          <u>S</u>ign Off
        </span>
        <span>
          <u>H</u>elp
        </span>
      </div>

      <div className="aol-toolbar">
        <div className="aol-toolbar-group">
          <button className="aol-tool-btn">
            <span className="icon">📬</span>Read
          </button>
          <button className="aol-tool-btn">
            <span className="icon">📝</span>Write
          </button>
          <button className="aol-tool-btn">
            <span className="icon">✉️</span>Mail Center
          </button>
          <button className="aol-tool-btn">
            <span className="icon">🖨️</span>Print
          </button>
        </div>
        <div className="aol-toolbar-divider" />
        <div className="aol-toolbar-group">
          <button className="aol-tool-btn">
            <span className="icon">📁</span>My Files
          </button>
          <button className="aol-tool-btn">
            <span className="icon">⚙️</span>My AOL
          </button>
          <button className="aol-tool-btn">
            <span className="icon">❤️</span>Favorites
          </button>
          <button className="aol-tool-btn">
            <span className="icon">🌐</span>Internet
          </button>
          <button className="aol-tool-btn">
            <span className="icon">📺</span>Channels
          </button>
        </div>
        <div className="aol-toolbar-divider" />
        <div className="aol-toolbar-group">
          <button className="aol-tool-btn">
            <span className="icon">👥</span>People
          </button>
          <button className="aol-tool-btn">
            <span className="icon">💬</span>Quotes
          </button>
          <button className="aol-tool-btn">
            <span className="icon">🎁</span>Perks
          </button>
          <button className="aol-tool-btn">
            <span className="icon">☀️</span>Weather
          </button>
        </div>
      </div>

      <div className="aol-addressbar">
        <div className="aol-address-nav">
          <button className="aol-nav-btn">◀</button>
          <button className="aol-nav-btn">▶</button>
          <button className="aol-nav-btn">✖</button>
          <button className="aol-nav-btn">↻</button>
          <button className="aol-nav-btn">🏠</button>
        </div>
        <div className="aol-address-input-container">
          <button className="aol-address-find">Find ▼</button>
          <input
            type="text"
            className="aol-address-input"
            placeholder="Type Keyword or Web Address here and click Go"
          />
          <button className="aol-address-go">Go</button>
          <button className="aol-address-keyword">Keyword</button>
        </div>
      </div>

      <div ref={workspaceRef} className="aol-workspace">
        <AolChannelsWindow ref={channelsWindowRef} openChannel={openChannel} />
        {activeWindow && (
          <AolMockWindow
            ref={mockWindowRef}
            activeWindow={activeWindow}
            onClose={closeActiveWindow}
          />
        )}
      </div>
    </div>
  );
}
