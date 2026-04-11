import React, { useEffect, useState } from 'react';
import { useSpaceTraderGame } from '../logic/useSpaceTraderGame';
import { MainTradeView } from './views/MainTradeView';
import { SystemInfoView } from './views/SystemInfoView';
import { ShipInfoView } from './views/ShipInfoView';
import { GalacticChartView } from './views/GalacticChartView';
import { ShipYardView } from './views/ShipYardView';
import { EquipmentView } from './views/EquipmentView';
import { EncounterModal } from './views/EncounterModal';
import { NewGameView } from './views/NewGameView';
import { GameOverView } from './views/GameOverView';
import { TitleBarProvider, TitleBarProps } from './TitleBarContext';
import { PalmHeader } from './PalmHeader';
import { ViewType } from '../logic/DataTypes';

interface SpaceTraderGameProps {
  skin?: string;
  host?: string;
  TitleBar?: React.ComponentType<TitleBarProps> | null;
}

export const SpaceTraderGame: React.FC<SpaceTraderGameProps> = ({
  skin,
  host,
  TitleBar = PalmHeader,
}) => {
  const { nameCommander, isGameOver } = useSpaceTraderGame();
  const [activeView, setActiveView] = useState<ViewType>('newgame');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Check if store has hydrated from localStorage
    const hasGame = !!localStorage.getItem('space-trader-save');
    if (nameCommander || hasGame) {
      setActiveView('trade');
    } else {
      setActiveView('newgame');
    }
    setHydrated(true);
  }, [nameCommander]);

  if (!hydrated) return null;

  return (
    <TitleBarProvider TitleBar={TitleBar ?? null}>
      <div className="space-trader-app" data-space-trader-skin={skin}>
        {activeView === 'trade' && <MainTradeView onViewChange={setActiveView} />}
        {activeView === 'system' && <SystemInfoView onViewChange={setActiveView} />}
        {activeView === 'ship' && <ShipInfoView onViewChange={setActiveView} />}
        {activeView === 'map' && <GalacticChartView onViewChange={setActiveView} />}
        {activeView === 'shipyard' && <ShipYardView onViewChange={setActiveView} />}
        {activeView === 'equipment' && <EquipmentView onViewChange={setActiveView} />}
        {activeView === 'newgame' && <NewGameView onStart={() => setActiveView('trade')} />}

        {isGameOver && <GameOverView />}
        <EncounterModal />
      </div>
    </TitleBarProvider>
  );
};
