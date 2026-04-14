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
import { BuyShipListView } from './views/BuyShipListView';
import { ShipInformationView } from './views/ShipInformationView';
import { TargetSystemView } from './views/TargetSystemView';
import { AveragePriceListView } from './views/AveragePriceListView';
import { TitleBarProvider, TitleBarProps } from './TitleBarContext';
import { PalmHeader } from './PalmHeader';
import { SpaceTraderMenu } from './SpaceTraderMenu';
import { ViewType } from '../logic/DataTypes';

export interface AppShortcut {
  label: string;
  onClick: () => void;
}

interface SpaceTraderGameProps {
  skin?: string;
  host?: string;
  TitleBar?: React.ComponentType<TitleBarProps> | null;
  onTitleChange?: (title: string) => void;
  onShortcutsChange?: (shortcuts: AppShortcut[]) => void;
  onEncounterActiveChange?: (active: boolean) => void;
  menuOpen?: boolean;
  onMenuClose?: () => void;
}

export const SpaceTraderGame: React.FC<SpaceTraderGameProps> = ({
  skin,
  host,
  TitleBar = PalmHeader,
  onTitleChange,
  onShortcutsChange,
  onEncounterActiveChange,
  menuOpen = false,
  onMenuClose,
}) => {
  const { nameCommander, isGameOver, tradeMode, setTradeMode, encounter } = useSpaceTraderGame();
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

  useEffect(() => {
    if (!onShortcutsChange) return;
    // Only show shortcuts when actively playing (not on new game screen)
    if (activeView === 'newgame') {
      onShortcutsChange([]);
      return;
    }
    onShortcutsChange([
      {
        label: 'B',
        onClick: () => {
          setTradeMode('buy');
          setActiveView('trade');
        },
      },
      {
        label: 'S',
        onClick: () => {
          setTradeMode('sell');
          setActiveView('trade');
        },
      },
      { label: 'Y', onClick: () => setActiveView('shipyard') },
      { label: 'W', onClick: () => setActiveView('map') },
    ]);
    return () => onShortcutsChange([]);
  }, [activeView, setTradeMode, onShortcutsChange]);

  useEffect(() => {
    onEncounterActiveChange?.(!!encounter);
  }, [encounter, onEncounterActiveChange]);

  useEffect(() => {
    if (!onTitleChange) return;
    const titles: Record<ViewType, string> = {
      trade:
        tradeMode === 'buy' ? 'Buy Cargo' : tradeMode === 'sell' ? 'Sell Cargo' : 'Avg Price List',
      system: 'System Info',
      ship: 'Commander Status',
      map: 'Short Range Chart',
      target: 'Target System',
      pricelist: 'Average Price List',
      shipyard: 'Ship Yard',
      equipment: 'Equipment',
      newgame: 'Space Trader',
      buyShip: 'Buy Ship',
      shipInfo: 'Ship Information',
    };
    onTitleChange(titles[activeView] ?? 'Space Trader');
  }, [activeView, tradeMode, onTitleChange]);

  if (!hydrated) return null;

  return (
    <TitleBarProvider TitleBar={TitleBar ?? null}>
      <div
        className="space-trader-app"
        data-space-trader-skin={skin}
        style={{ position: 'relative' }}
      >
        {activeView === 'trade' && <MainTradeView onViewChange={setActiveView} />}
        {activeView === 'system' && <SystemInfoView onViewChange={setActiveView} />}
        {activeView === 'ship' && <ShipInfoView onViewChange={setActiveView} />}
        {activeView === 'map' && <GalacticChartView onViewChange={setActiveView} />}
        {activeView === 'target' && <TargetSystemView onViewChange={setActiveView} />}
        {activeView === 'pricelist' && <AveragePriceListView onViewChange={setActiveView} />}
        {activeView === 'shipyard' && <ShipYardView onViewChange={setActiveView} />}
        {activeView === 'equipment' && <EquipmentView onViewChange={setActiveView} />}
        {activeView === 'newgame' && <NewGameView onStart={() => setActiveView('trade')} />}
        {activeView === 'buyShip' && <BuyShipListView onViewChange={setActiveView} />}
        {activeView === 'shipInfo' && <ShipInformationView onViewChange={setActiveView} />}

        {isGameOver && <GameOverView />}
        <EncounterModal />

        {menuOpen && (
          <SpaceTraderMenu
            onViewChange={(view) => {
              setActiveView(view);
              onMenuClose?.();
            }}
            onClose={() => onMenuClose?.()}
          />
        )}
      </div>
    </TitleBarProvider>
  );
};
