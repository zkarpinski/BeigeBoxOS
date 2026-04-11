'use client';

import React, { useState } from 'react';
import { PalmFrame } from './PalmFrame';
import { PalmStatusBar } from './PalmStatusBar';
import { PalmLauncher } from './PalmLauncher';
import { PalmTodoApp } from './PalmTodoApp';
import { DateBookApp } from './DateBookApp';
import { SpaceTraderGame } from '@retro-web/app-space-trader';

export function PalmDesktop() {
  const [currentApp, setCurrentApp] = useState('launcher');
  const [appTitle, setAppTitle] = useState<string | undefined>(undefined);

  return (
    <PalmFrame
      onHomeClick={() => {
        setCurrentApp('launcher');
        setAppTitle(undefined);
      }}
      onAppButtonClick={(app) => setCurrentApp(app)}
    >
      <div className="flex h-full w-full flex-col bg-white">
        <PalmStatusBar appTitle={currentApp !== 'launcher' ? appTitle : undefined} />
        <div className="flex-1 overflow-hidden">
          {currentApp === 'launcher' && <PalmLauncher onAppOpen={setCurrentApp} />}
          {currentApp === 'todo' && <PalmTodoApp />}
          {currentApp === 'datebook' && <DateBookApp />}
          {currentApp === 'space_trader' && (
            <SpaceTraderGame host="palmos" TitleBar={null} onTitleChange={setAppTitle} />
          )}
          {currentApp !== 'launcher' &&
            currentApp !== 'todo' &&
            currentApp !== 'datebook' &&
            currentApp !== 'space_trader' && (
              <div className="flex h-full w-full items-center justify-center p-4 text-center italic">
                <div className="flex flex-col items-center gap-4">
                  <span className="text-4xl opacity-20">?</span>
                  <span>App "{currentApp}" not implemented yet.</span>
                  <button
                    onClick={() => setCurrentApp('launcher')}
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
