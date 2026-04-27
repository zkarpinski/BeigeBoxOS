import React from 'react';

interface WinMobileFrameProps {
  children: React.ReactNode;
  onPowerBtn?: () => void;
  onHomeBtn?: () => void;
}

export function WinMobileFrame({ children, onHomeBtn }: WinMobileFrameProps) {
  return (
    <div className="winmo-page-wrapper">
      <div className="axim-chassis">
        <div className="axim-speaker" />

        <div className="axim-bezel">
          <div className="winmo-screen">{children}</div>
        </div>

        <div className="axim-controls">
          <div className="axim-button-row">
            <button className="axim-hw-btn" onClick={onHomeBtn} title="Calendar">
              📅
            </button>
            <button className="axim-hw-btn" title="Contacts">
              👤
            </button>
          </div>

          <div className="axim-dpad">
            <div className="axim-dpad-center" />
          </div>

          <div className="axim-button-row">
            <button className="axim-hw-btn" title="Inbox">
              ✉️
            </button>
            <button className="axim-hw-btn" onClick={onHomeBtn} title="Home">
              🏠
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
