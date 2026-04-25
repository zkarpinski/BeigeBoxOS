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
import { OptionsView } from './views/OptionsView';
import { OptionsPage2View } from './views/OptionsPage2View';
import { SpecialEventView } from './views/SpecialEventView';
import { QuestsView } from './views/QuestsView';
import { BankView } from './views/BankView';
import { NewsView } from './views/NewsView';
import { TitleBarProvider, TitleBarProps } from './TitleBarContext';
import { PalmHeader } from './PalmHeader';
import { SpaceTraderMenu } from './SpaceTraderMenu';
import { ViewType } from '../logic/DataTypes';
import { AppView } from '../logic/store/types';
import { AiController } from '../logic/ai/AiController';

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
  onHideStatusBarChange?: (hide: boolean) => void;
  menuOpen?: boolean;
  onMenuClose?: () => void;
}

export const SpaceTraderGame: React.FC<SpaceTraderGameProps> = ({
  skin,
  host,
  TitleBar = PalmHeader,
  onTitleChange,
  onShortcutsChange,
  onHideStatusBarChange,
  menuOpen = false,
  onMenuClose,
}) => {
  const {
    nameCommander,
    isGameOver,
    tradeMode,
    setTradeMode,
    encounter,
    activeView,
    setActiveView,
    isAiEnabled,
  } = useSpaceTraderGame();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Check if store has hydrated from localStorage for initial routing
    const saved = localStorage.getItem('space-trader-save');
    let hasValidGame = false;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.state?.nameCommander) hasValidGame = true;
      } catch (e) {}
    }

    if (nameCommander || hasValidGame) {
      setActiveView('trade');
    } else {
      setActiveView('newgame');
    }
    setHydrated(true);
  }, [hydrated]); // Run exactly once to handle hydration routing

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
    const modalActive =
      !!encounter ||
      activeView === 'newgame' ||
      activeView === 'shipInfo' ||
      activeView === 'options' ||
      activeView === 'options2' ||
      activeView === 'specialEvent' ||
      activeView === 'quests' ||
      activeView === 'bank' ||
      activeView === 'news';
    onHideStatusBarChange?.(modalActive);
  }, [encounter, activeView, onHideStatusBarChange]);

  useEffect(() => {
    if (!onTitleChange) return;
    const titles: Record<AppView, string> = {
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
      options: 'Options',
      options2: 'Options',
      specialEvent: 'Special Event',
      quests: 'Quests',
      bank: 'Bank',
      news: 'News',
      gameOver: 'Game Over',
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
        <style>
          {`
            @keyframes stylus-tap {
              0% { transform: scale(0.5); opacity: 0.8; }
              100% { transform: scale(2.5); opacity: 0; }
            }
            .stylus-tap {
              position: absolute;
              width: 30px;
              height: 30px;
              background: rgba(255, 255, 255, 0.7);
              border: 2px solid rgba(0, 255, 0, 0.5);
              border-radius: 50%;
              pointer-events: none;
              animation: stylus-tap 0.5s ease-out forwards;
              z-index: 10000;
            }
            @keyframes ai-pulse {
              0% { box-shadow: 0 0 0px #0f0; border-color: inherit; }
              50% { box-shadow: 0 0 15px #0f0; border-color: #0f0; border-width: 2px; }
              100% { box-shadow: 0 0 0px #0f0; border-color: inherit; }
            }
            .ai-highlight {
              animation: ai-pulse 0.6s ease-in-out;
              position: relative;
              z-index: 1000;
            }
          `}
        </style>
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
        {activeView === 'options' && <OptionsView onViewChange={setActiveView} />}
        {activeView === 'options2' && <OptionsPage2View onViewChange={setActiveView} />}
        {activeView === 'specialEvent' && <SpecialEventView onViewChange={setActiveView} />}
        {activeView === 'quests' && <QuestsView onViewChange={setActiveView} />}
        {activeView === 'bank' && <BankView onViewChange={setActiveView} />}
        {activeView === 'news' && <NewsView onViewChange={setActiveView} />}

        {isGameOver && <GameOverView />}
        <EncounterModal />
        <AiController />

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
