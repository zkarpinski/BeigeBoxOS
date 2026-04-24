'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { PalmFrame } from './PalmFrame';
import { PalmStatusBar } from './PalmStatusBar';
import { PalmLauncher, LauncherCategory } from './PalmLauncher';
import { PalmTodoApp } from './PalmTodoApp';
import { DateBookApp } from './DateBookApp';
import { SpaceTraderGame, AppShortcut } from '@retro-web/app-space-trader';
import { CalcApp } from './CalcApp';
import { ClockApp } from './ClockApp';
import { HotSyncApp } from './HotSyncApp';
import { SystemKeyboard } from './SystemKeyboard';
import { MemoPadApp } from './MemoPadApp';
import { AddressApp } from './AddressApp';
import { NotePadApp } from './NotePadApp';

// Static titles for built-in apps that don't manage their own title
const STATIC_TITLES: Record<string, string> = {
  todo: 'To Do List',
  datebook: 'Date Book',
  calc: 'Calculator',
  clock: 'Clock',
  memo: 'Memo Pad',
  address: 'Address',
  notepad: 'Note Pad',
};

// Apps that show the category picker (▼ All) in the title bar
const SHOWS_CATEGORY = new Set(['todo', 'address', 'memo']);

export function PalmDesktop() {
  const [currentApp, setCurrentApp] = useState('launcher');
  const [appTitle, setAppTitle] = useState<string | undefined>(undefined);
  const [shortcuts, setShortcuts] = useState<AppShortcut[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hideStatusBar, setHideStatusBar] = useState(false);
  const [findOpen, setFindOpen] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [launcherCategory, setLauncherCategory] = useState<LauncherCategory>('All');

  // Battery: persisted to localStorage, decays 1% every 3 minutes
  const [batteryLevel, setBatteryLevel] = useState<number>(() => {
    if (typeof window === 'undefined') return 75;
    return Number(localStorage.getItem('palmos-battery') ?? 75);
  });
  useEffect(() => {
    localStorage.setItem('palmos-battery', String(batteryLevel));
  }, [batteryLevel]);
  useEffect(() => {
    const id = setInterval(
      () => {
        setBatteryLevel((b) => Math.max(0, b - 1));
      },
      3 * 60 * 1000,
    );
    return () => clearInterval(id);
  }, []);

  const scrollHandlerRef = useRef<((dir: 'up' | 'down') => void) | null>(null);
  const registerScroll = useCallback((fn: ((dir: 'up' | 'down') => void) | null) => {
    scrollHandlerRef.current = fn;
  }, []);
  const handleRockerScroll = useCallback((dir: 'up' | 'down') => {
    scrollHandlerRef.current?.(dir);
  }, []);

  // Tap feedback (stylus ripple)
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      const tap = document.createElement('div');
      tap.className = 'stylus-tap';
      tap.style.position = 'absolute';
      tap.style.left = `${e.pageX - 15}px`;
      tap.style.top = `${e.pageY - 15}px`;
      tap.style.zIndex = '2147483647';
      document.body.appendChild(tap);
      setTimeout(() => tap.remove(), 550);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  const openApp = (app: string) => {
    if (app === 'hotsync') setBatteryLevel(100);
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
    currentApp === 'calc' ||
    currentApp === 'clock' ||
    currentApp === 'hotsync' ||
    currentApp === 'memo' ||
    currentApp === 'address' ||
    currentApp === 'notepad' ||
    currentApp === 'space_trader';

  const handleFind = () => {
    setFindOpen(true);
    setFindQuery('');
  };

  const getSearchResults = (query: string) => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const results: { app: string; appId: string; text: string }[] = [];

    try {
      const todos: { text: string; completed: boolean }[] = JSON.parse(
        localStorage.getItem('palmos-todos') ?? '[]',
      );
      todos.forEach((t) => {
        if (t.text.toLowerCase().includes(q))
          results.push({ app: 'To Do', appId: 'todo', text: t.text });
      });
    } catch {}

    try {
      const memos: { title: string; body: string }[] = JSON.parse(
        localStorage.getItem('palmos-memos') ?? '[]',
      );
      memos.forEach((m) => {
        if (m.title.toLowerCase().includes(q) || m.body.toLowerCase().includes(q))
          results.push({ app: 'Memo', appId: 'memo', text: m.title || m.body.slice(0, 40) });
      });
    } catch {}

    return results;
  };

  const searchResults = getSearchResults(findQuery);

  return (
    <PalmFrame
      onHomeClick={goHome}
      onMenuClick={handleMenuClick}
      onAppButtonClick={openApp}
      onScroll={handleRockerScroll}
      onSearchClick={handleFind}
      onGraffitiTap={() => setKeyboardOpen(true)}
    >
      <div className="flex h-full w-full flex-col bg-white" style={{ position: 'relative' }}>
        {!hideStatusBar && (
          <PalmStatusBar
            appTitle={currentApp !== 'launcher' ? appTitle : undefined}
            showCategory={SHOWS_CATEGORY.has(currentApp)}
            shortcuts={currentApp !== 'launcher' ? shortcuts : undefined}
            onTitleClick={currentApp === 'space_trader' ? () => setMenuOpen((o) => !o) : undefined}
            launcherCategory={launcherCategory}
            onLauncherCategoryChange={setLauncherCategory}
            batteryLevel={batteryLevel}
          />
        )}
        <div key={currentApp} className="palm-app-fade flex-1 overflow-hidden">
          {currentApp === 'launcher' && (
            <PalmLauncher
              onAppOpen={openApp}
              onRegisterScroll={registerScroll}
              category={launcherCategory}
            />
          )}
          {currentApp === 'todo' && <PalmTodoApp onRegisterScroll={registerScroll} />}
          {currentApp === 'datebook' && <DateBookApp />}
          {currentApp === 'calc' && <CalcApp />}
          {currentApp === 'clock' && <ClockApp />}
          {currentApp === 'hotsync' && <HotSyncApp onComplete={goHome} />}
          {currentApp === 'memo' && <MemoPadApp />}
          {currentApp === 'address' && <AddressApp />}
          {currentApp === 'notepad' && <NotePadApp />}
          {currentApp === 'space_trader' && (
            <SpaceTraderGame
              host="palmos"
              TitleBar={null}
              onTitleChange={setAppTitle}
              onShortcutsChange={setShortcuts}
              onHideStatusBarChange={setHideStatusBar}
              menuOpen={menuOpen}
              onMenuClose={() => setMenuOpen(false)}
            />
          )}
          {!isKnownApp && (
            <div className="flex h-full w-full items-center justify-center p-4">
              <div className="flex w-10/12 flex-col border-2 border-black bg-white shadow-md">
                {/* Title Bar */}
                <div className="bg-[#1A1A8C] px-2 py-0.5 text-white font-bold text-xs">
                  Information
                </div>
                {/* Content */}
                <div className="flex flex-col items-center gap-4 p-3 text-black">
                  <div className="flex items-start gap-3 w-full">
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 border-black font-bold">
                      i
                    </div>
                    <span className="text-xs leading-tight text-left mt-1">
                      The '
                      {currentApp.charAt(0).toUpperCase() + currentApp.slice(1).replace(/_/g, ' ')}'
                      application is not implemented yet.
                    </span>
                  </div>
                  <button
                    onClick={goHome}
                    className="border border-black rounded bg-white px-4 py-0.5 text-xs font-bold active:bg-black active:text-white"
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* System keyboard overlay */}
        {keyboardOpen && <SystemKeyboard onClose={() => setKeyboardOpen(false)} />}

        {/* Find overlay */}
        {findOpen && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 200,
              background: 'rgba(0,0,0,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ width: '220px', border: '2px solid #000', background: 'white' }}>
              {/* Title bar */}
              <div
                style={{
                  background: '#1A1A8C',
                  color: 'white',
                  padding: '2px 6px',
                  fontWeight: 'bold',
                  fontSize: '12px',
                }}
              >
                Find
              </div>
              {/* Input row */}
              <div style={{ padding: '6px', borderBottom: '1px solid #ccc' }}>
                <div style={{ fontSize: '10px', marginBottom: '3px' }}>Find:</div>
                <input
                  autoFocus
                  type="text"
                  value={findQuery}
                  onChange={(e) => setFindQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Escape' && setFindOpen(false)}
                  style={{
                    width: '100%',
                    border: '1px solid #333',
                    padding: '2px 4px',
                    fontSize: '12px',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
              {/* Results */}
              <div style={{ maxHeight: '100px', overflowY: 'auto', fontSize: '10px' }}>
                {findQuery.trim() === '' ? (
                  <div style={{ padding: '6px', color: '#888' }}>Type to search all apps.</div>
                ) : searchResults.length === 0 ? (
                  <div style={{ padding: '6px', color: '#555' }}>No matches found.</div>
                ) : (
                  searchResults.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setFindOpen(false);
                        openApp(r.appId);
                      }}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        padding: '3px 6px',
                        border: 'none',
                        background: 'white',
                        borderBottom: '1px solid #eee',
                        cursor: 'pointer',
                        fontSize: '10px',
                      }}
                    >
                      <span style={{ color: '#1A1A8C', fontWeight: 'bold' }}>{r.app}: </span>
                      {r.text}
                    </button>
                  ))
                )}
              </div>
              {/* Footer */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '4px',
                  padding: '4px 6px',
                  borderTop: '1px solid #ccc',
                }}
              >
                <button
                  onClick={() => setFindOpen(false)}
                  style={{
                    border: '1px solid #000',
                    background: 'white',
                    padding: '1px 10px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (searchResults.length > 0) {
                      setFindOpen(false);
                      openApp(searchResults[0].appId);
                    }
                  }}
                  style={{
                    border: '1px solid #000',
                    background: 'white',
                    padding: '1px 10px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                  }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PalmFrame>
  );
}
