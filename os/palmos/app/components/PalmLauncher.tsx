'use client';

import React, { useRef, useState, useEffect } from 'react';
import { usePalmSounds } from '../hooks/usePalmSounds';
import {
  Phone,
  Calculator,
  CreditCard,
  Clock,
  Calendar,
  Receipt,
  RefreshCw,
  Mail,
  FileText,
  Pencil,
  Settings,
  CheckSquare,
  Lock,
  Rocket,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type LauncherCategory = 'All' | 'Main' | 'Games' | 'Unfiled';
export const LAUNCHER_CATEGORIES: LauncherCategory[] = ['All', 'Main', 'Games', 'Unfiled'];

interface App {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
  category: LauncherCategory;
}

const apps: App[] = [
  { id: 'address', label: 'Address', icon: Phone, color: '#2250C4', category: 'Main' },
  { id: 'calc', label: 'Calc', icon: Calculator, color: '#2250C4', category: 'Main' },
  { id: 'cardinfo', label: 'Card Info', icon: CreditCard, color: '#2250C4', category: 'Unfiled' },
  { id: 'clock', label: 'Clock', icon: Clock, color: '#5544AA', category: 'Main' },
  { id: 'datebook', label: 'Date Book', icon: Calendar, color: '#BB5500', category: 'Main' },
  { id: 'expense', label: 'Expense', icon: Receipt, color: '#2250C4', category: 'Unfiled' },
  { id: 'hotsync', label: 'HotSync', icon: RefreshCw, color: '#CC2222', category: 'Main' },
  { id: 'mail', label: 'Mail', icon: Mail, color: '#2250C4', category: 'Main' },
  { id: 'memo', label: 'Memo Pad', icon: FileText, color: '#2250C4', category: 'Main' },
  { id: 'notepad', label: 'Note Pad', icon: Pencil, color: '#2250C4', category: 'Main' },
  { id: 'prefs', label: 'Prefs', icon: Settings, color: '#2250C4', category: 'Unfiled' },
  { id: 'security', label: 'Security', icon: Lock, color: '#2250C4', category: 'Unfiled' },
  { id: 'todo', label: 'To Do List', icon: CheckSquare, color: '#2250C4', category: 'Main' },
  { id: 'space_trader', label: 'Space Trader', icon: Rocket, color: '#1a8a2e', category: 'Games' },
];

interface PalmLauncherProps {
  onAppOpen: (appId: string) => void;
  onRegisterScroll?: (fn: ((dir: 'up' | 'down') => void) | null) => void;
  category?: LauncherCategory;
}

export function PalmLauncher({ onAppOpen, onRegisterScroll, category = 'All' }: PalmLauncherProps) {
  const { playClick } = usePalmSounds();
  const scrollRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [canScroll, setCanScroll] = useState(false);

  const handleAppClick = (id: string) => {
    playClick();
    onAppOpen(id);
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const maxScroll = scrollHeight - clientHeight;
    setCanScroll(maxScroll > 0);
    if (maxScroll <= 0) {
      setScrollProgress(0);
      return;
    }
    setScrollProgress(scrollTop / maxScroll);
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, []);

  useEffect(() => {
    onRegisterScroll?.((dir) => scrollByAmount(dir === 'up' ? -60 : 60));
    return () => onRegisterScroll?.(null);
  }, [onRegisterScroll]);

  const scrollByAmount = (amount: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ top: amount, behavior: 'instant' });
      playClick();
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!scrollRef.current || !trackRef.current || !canScroll) return;
    // Attempt to prevent normal browser drag behaviors
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

    const trackRect = trackRef.current.getBoundingClientRect();
    const maxThumbTop = trackRect.height * 0.5;

    const setScrollFromY = (clientY: number) => {
      const y = clientY - trackRect.top;
      // center the 50%-height thumb on the pointer
      let thumbTop = y - trackRect.height * 0.25;
      if (thumbTop < 0) thumbTop = 0;
      if (thumbTop > maxThumbTop) thumbTop = maxThumbTop;

      const newScrollProgress = thumbTop / maxThumbTop;
      const { scrollHeight, clientHeight } = scrollRef.current!;
      const maxScroll = scrollHeight - clientHeight;
      if (maxScroll > 0) {
        scrollRef.current!.scrollTop = newScrollProgress * maxScroll;
      }
    };

    setScrollFromY(e.clientY);

    const handlePointerMove = (moveEvent: PointerEvent) => {
      setScrollFromY(moveEvent.clientY);
    };

    const handlePointerUp = (upEvent: PointerEvent) => {
      (upEvent.target as HTMLElement).releasePointerCapture?.(upEvent.pointerId);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const visibleApps = category === 'All' ? apps : apps.filter((a) => a.category === category);

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', background: 'white' }}>
      <style>{`
        .palm-launcher-grid::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      {/* App grid */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="palm-launcher-grid"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '4px 2px 4px 6px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            rowGap: '2px',
          }}
        >
          {visibleApps.map((app) => (
            <button
              key={app.id}
              onClick={() => handleAppClick(app.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
                padding: '5px 2px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  backgroundColor: app.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <app.icon size={17} strokeWidth={2} color="white" />
              </div>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 'normal',
                  textAlign: 'center',
                  color: '#000',
                  lineHeight: '1.1',
                }}
              >
                {app.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Palm OS scrollbar */}
      <div
        style={{
          width: '13px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '2px',
          paddingBottom: '2px',
          borderLeft: '1px solid #ccc',
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => scrollByAmount(-60)}
          style={{
            background: 'none',
            border: 'none',
            padding: '2px 0',
            cursor: canScroll ? 'pointer' : 'default',
            lineHeight: 0,
            opacity: canScroll ? 1 : 0.5,
          }}
          disabled={!canScroll}
        >
          <svg width="9" height="7" viewBox="0 0 9 7">
            <polygon points="4.5,0.5 8.5,6.5 0.5,6.5" fill="#333" />
          </svg>
        </button>
        <div
          ref={trackRef}
          onPointerDown={handlePointerDown}
          style={{
            flex: 1,
            width: '9px',
            background: '#e0e0e0',
            borderRadius: '2px',
            position: 'relative',
            margin: '2px 0',
            border: '1px solid #bbb',
            visibility: canScroll ? 'visible' : 'hidden',
            touchAction: 'none',
            cursor: 'ns-resize',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: `${scrollProgress * 50}%`,
              left: '0',
              right: '0',
              height: '50%',
              background: '#777',
              borderRadius: '2px',
            }}
          />
        </div>
        <button
          onClick={() => scrollByAmount(60)}
          style={{
            background: 'none',
            border: 'none',
            padding: '2px 0',
            cursor: canScroll ? 'pointer' : 'default',
            lineHeight: 0,
            opacity: canScroll ? 1 : 0.5,
          }}
          disabled={!canScroll}
        >
          <svg width="9" height="7" viewBox="0 0 9 7">
            <polygon points="4.5,6.5 8.5,0.5 0.5,0.5" fill="#333" />
          </svg>
        </button>
      </div>
    </div>
  );
}
