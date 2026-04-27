import React, { useState } from 'react';
import { useOsShell } from '@retro-web/core/context';
import { SpaceTraderGame } from './SpaceTraderGame';

interface SpaceTraderWindowProps {
  skin?: 'karpos' | 'palmos'; // though palmos won't use this file, we set a default
}

export function SpaceTraderWindow({ skin = 'karpos' }: SpaceTraderWindowProps) {
  const { AppWindow, TitleBar } = useOsShell();
  const appId = 'space-trader';

  const onClose = () => {
    // If the game needs a save confirmation, it could be here
  };

  return (
    <AppWindow
      id={`${appId}-window`}
      appId={appId}
      className={`app-window space-trader-window windowed`}
      titleBar={<TitleBar title="Space Trader" icon="/apps/space-trader/icon.png" />}
      allowResize={false}
      getCanDrag={(el) => el.classList.contains('windowed')}
    >
      <div style={{ height: 'calc(100% - 24px)', width: '100%' }}>
        <SpaceTraderGame skin={skin} TitleBar={null} />
      </div>
    </AppWindow>
  );
}
