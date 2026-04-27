'use client';

import React, { useState } from 'react';
import { WinMobileFrame } from './WinMobileFrame';
import { WinMobileShellProvider } from './WinMobileShellContext';
import { CalculatorWindow } from '@retro-web/app-calculator';

export function WinMobileDesktop() {
  const [currentApp, setCurrentApp] = useState('today');
  const [startMenuOpen, setStartMenuOpen] = useState(false);

  const openApp = (id: string) => {
    setCurrentApp(id);
    setStartMenuOpen(false);
  };

  const goHome = () => {
    setCurrentApp('today');
    setStartMenuOpen(false);
  };

  const toggleStartMenu = () => setStartMenuOpen(!startMenuOpen);

  return (
    <WinMobileShellProvider currentApp={currentApp} openApp={openApp} goHome={goHome}>
      <WinMobileFrame onHomeBtn={goHome}>
        <div className="flex flex-col h-full relative">
          {/* Navigation Bar (Top) */}
          <div className="winmo-navbar">
            <div className="winmo-start-btn" onClick={toggleStartMenu}>
              <StartIcon />
              <span className="ml-1">Start</span>
            </div>
            <div
              className="flex-1 px-2 overflow-hidden"
              style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}
            >
              {currentApp === 'today'
                ? 'Today'
                : currentApp.charAt(0).toUpperCase() + currentApp.slice(1)}
            </div>
            <div className="px-2">10:28 AM</div>
          </div>

          {/* Start Menu Overlay - Now outside flex-1 for better positioning */}
          {startMenuOpen && (
            <StartMenu onOpenApp={openApp} onClose={() => setStartMenuOpen(false)} />
          )}

          {/* Content Area */}
          <div className="winmo-content flex-1 overflow-hidden">
            {currentApp === 'today' && <TodayScreen onOpenApp={openApp} />}
            {currentApp === 'calculator' && <CalculatorWindow />}
          </div>

          {/* Command Bar (Bottom) */}
          <div className="winmo-commandbar">
            <span>New</span>
            <span>⌨️</span>
          </div>
        </div>
      </WinMobileFrame>
    </WinMobileShellProvider>
  );
}

function StartIcon() {
  return (
    <div className="flex flex-wrap w-3 h-3 gap-[1px]">
      <div className="w-[5px] h-[5px] bg-[#f35325]"></div>
      <div className="w-[5px] h-[5px] bg-[#81bc06]"></div>
      <div className="w-[5px] h-[5px] bg-[#05a6f0]"></div>
      <div className="w-[5px] h-[5px] bg-[#ffba08]"></div>
    </div>
  );
}

function TodayScreen({ onOpenApp }: { onOpenApp: (id: string) => void }) {
  return (
    <div className="winmo-today">
      <div className="winmo-today-header">
        <div className="winmo-today-date">Sunday, April 26, 2026</div>
      </div>
      <div className="winmo-today-item" onClick={() => {}}>
        <div className="winmo-today-icon">👤</div>
        <span>Tap here to set owner information</span>
      </div>
      <div className="winmo-today-item" onClick={() => onOpenApp('calendar')}>
        <div className="winmo-today-icon">📅</div>
        <span>No upcoming appointments</span>
      </div>
      <div className="winmo-today-item" onClick={() => onOpenApp('inbox')}>
        <div className="winmo-today-icon">✉️</div>
        <span>No unread messages</span>
      </div>
      <div className="winmo-today-item" onClick={() => onOpenApp('tasks')}>
        <div className="winmo-today-icon">📝</div>
        <span>No active tasks</span>
      </div>
    </div>
  );
}

function StartMenu({
  onOpenApp,
  onClose,
}: {
  onOpenApp: (id: string) => void;
  onClose: () => void;
}) {
  const apps = [
    { id: 'today', name: 'Today', icon: '🏠' },
    { id: 'calculator', name: 'Calculator', icon: '🧮' },
    { id: 'calendar', name: 'Calendar', icon: '📅' },
    { id: 'contacts', name: 'Contacts', icon: '👤' },
    { id: 'inbox', name: 'Inbox', icon: '✉️' },
  ];

  return (
    <>
      <div className="absolute inset-0 bg-black/5 z-[999]" onClick={onClose} />
      <div className="winmo-start-menu">
        {apps.map((app) => (
          <div key={app.id} className="winmo-start-menu-item" onClick={() => onOpenApp(app.id)}>
            <span>{app.icon}</span>
            <span>{app.name}</span>
          </div>
        ))}
        <div className="border-t border-gray-200 my-1" />
        <div className="winmo-start-menu-item" style={{ fontSize: '11px', color: '#666' }}>
          Programs ▶
        </div>
        <div className="winmo-start-menu-item" style={{ fontSize: '11px', color: '#666' }}>
          Settings ▶
        </div>
        <div className="winmo-start-menu-item" style={{ fontSize: '11px', color: '#666' }}>
          Help
        </div>
      </div>
    </>
  );
}
