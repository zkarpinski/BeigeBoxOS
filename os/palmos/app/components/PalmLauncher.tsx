'use client';

import React from 'react';
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

interface App {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
}

const apps: App[] = [
  { id: 'address', label: 'Address', icon: Phone, color: '#2250C4' },
  { id: 'calc', label: 'Calc', icon: Calculator, color: '#2250C4' },
  { id: 'cardinfo', label: 'Card Info', icon: CreditCard, color: '#2250C4' },
  { id: 'clock', label: 'Clock', icon: Clock, color: '#5544AA' },
  { id: 'datebook', label: 'Date Book', icon: Calendar, color: '#BB5500' },
  { id: 'expense', label: 'Expense', icon: Receipt, color: '#2250C4' },
  { id: 'hotsync', label: 'HotSync', icon: RefreshCw, color: '#CC2222' },
  { id: 'mail', label: 'Mail', icon: Mail, color: '#2250C4' },
  { id: 'memo', label: 'Memo Pad', icon: FileText, color: '#2250C4' },
  { id: 'notepad', label: 'Note Pad', icon: Pencil, color: '#2250C4' },
  { id: 'prefs', label: 'Prefs', icon: Settings, color: '#2250C4' },
  { id: 'security', label: 'Security', icon: Lock, color: '#2250C4' },
  { id: 'todo', label: 'To Do List', icon: CheckSquare, color: '#2250C4' },
  { id: 'space_trader', label: 'Space Trader', icon: Rocket, color: '#1a8a2e' },
];

interface PalmLauncherProps {
  onAppOpen: (appId: string) => void;
}

export function PalmLauncher({ onAppOpen }: PalmLauncherProps) {
  const { playClick } = usePalmSounds();

  const handleAppClick = (id: string) => {
    playClick();
    onAppOpen(id);
  };

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', background: 'white' }}>
      {/* App grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 2px 4px 6px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            rowGap: '2px',
          }}
        >
          {apps.map((app) => (
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
                  fontWeight: 'bold',
                  textAlign: 'center',
                  color: '#000',
                  lineHeight: '1.1',
                  fontFamily: 'sans-serif',
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
          style={{
            background: 'none',
            border: 'none',
            padding: '2px 0',
            cursor: 'pointer',
            lineHeight: 0,
          }}
        >
          <svg width="9" height="7" viewBox="0 0 9 7">
            <polygon points="4.5,0.5 8.5,6.5 0.5,6.5" fill="#333" />
          </svg>
        </button>
        <div
          style={{
            flex: 1,
            width: '9px',
            background: '#e0e0e0',
            borderRadius: '2px',
            position: 'relative',
            margin: '2px 0',
            border: '1px solid #bbb',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '0',
              left: '0',
              right: '0',
              height: '50%',
              background: '#777',
              borderRadius: '2px',
            }}
          />
        </div>
        <button
          style={{
            background: 'none',
            border: 'none',
            padding: '2px 0',
            cursor: 'pointer',
            lineHeight: 0,
          }}
        >
          <svg width="9" height="7" viewBox="0 0 9 7">
            <polygon points="4.5,6.5 8.5,0.5 0.5,0.5" fill="#333" />
          </svg>
        </button>
      </div>
    </div>
  );
}
