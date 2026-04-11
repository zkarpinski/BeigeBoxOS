'use client';

import React, { useState } from 'react';
import { PalmFrame } from './PalmFrame';
import { PalmStatusBar } from './PalmStatusBar';
import { PalmLauncher } from './PalmLauncher';
import { PalmTodoApp } from './PalmTodoApp';
import { DateBookApp } from './DateBookApp';
import { SpaceTraderGame, AppShortcut } from '@retro-web/app-space-trader';

// Static titles for built-in apps that don't manage their own title
const STATIC_TITLES: Record<string, string> = {
  todo: 'To Do List',
  datebook: 'Date Book',
};

// Apps that show the category picker (▼ All) in the title bar
const SHOWS_CATEGORY = new Set(['todo', 'address', 'memo']);

export function PalmDesktop() {
  const [currentApp, setCurrentApp] = useState('launcher');
  const [appTitle, setAppTitle] = useState<string | undefined>(undefined);
  const [shortcuts, setShortcuts] = useState<AppShortcut[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const openApp = (app: string) => {
    setCurrentApp(app);
    setMenuOpen(false);
    setAppTitle(STATIC_TITLES[app]);
  };

  const goHome = () => {
    setCurrentApp('launcher');
    setAppTitle(undefined);
    setShortcuts([]);
    setMenuOpen(false);
  };

  const handleMenuClick = () => {
    if (currentApp !== 'launcher') setMenuOpen((o) => !o);
  };

  const isKnownApp =
    currentApp === 'launcher' ||
    currentApp === 'todo' ||
    currentApp === 'datebook' ||
    currentApp === 'space_trader';

  return (
    <PalmFrame onHomeClick={goHome} onMenuClick={handleMenuClick} onAppButtonClick={openApp}>
      <div className="flex h-full w-full flex-col bg-white">
        <PalmStatusBar
          appTitle={currentApp !== 'launcher' ? appTitle : undefined}
          showCategory={SHOWS_CATEGORY.has(currentApp)}
          shortcuts={currentApp !== 'launcher' ? shortcuts : undefined}
          onTitleClick={currentApp === 'space_trader' ? () => setMenuOpen((o) => !o) : undefined}
        />
        <div className="flex-1 overflow-hidden">
          {currentApp === 'launcher' && <PalmLauncher onAppOpen={openApp} />}
          {currentApp === 'todo' && <PalmTodoApp />}
          {currentApp === 'datebook' && <DateBookApp />}
          {currentApp === 'space_trader' && (
            <SpaceTraderGame
              host="palmos"
              TitleBar={null}
              onTitleChange={setAppTitle}
              onShortcutsChange={setShortcuts}
              menuOpen={menuOpen}
              onMenuClose={() => setMenuOpen(false)}
            />
          )}
          {!isKnownApp && (
            <div className="flex h-full w-full items-center justify-center p-4 text-center italic">
              <div className="flex flex-col items-center gap-4">
                <span className="text-4xl opacity-20">?</span>
                <span>App not implemented yet.</span>
                <button
                  onClick={goHome}
                  className="border-2 border-[#2a2d24] px-4 py-1 text-sm font-bold active:bg-[#2a2d24] active:text-[#8c927b]"
                >
                  OK
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </PalmFrame>
  );
}
