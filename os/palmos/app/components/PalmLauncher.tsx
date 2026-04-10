'use client';

import React from 'react';
import { usePalmSounds } from '../hooks/usePalmSounds';
import {
  Calendar,
  Users,
  CheckSquare,
  FileText,
  Calculator,
  Mail,
  Clock,
  Settings,
} from 'lucide-react';

const apps = [
  { id: 'address', label: 'Address', icon: Users },
  { id: 'calc', label: 'Calc', icon: Calculator },
  { id: 'datebook', label: 'Date Book', icon: Calendar },
  { id: 'mail', label: 'Mail', icon: Mail },
  { id: 'memo', label: 'Memo Pad', icon: FileText },
  { id: 'prefs', label: 'Prefs', icon: Settings },
  { id: 'todo', label: 'To Do List', icon: CheckSquare },
  { id: 'worldclock', label: 'World Clock', icon: Clock },
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
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center justify-between border-b border-[#2a2d24] px-2 py-1">
        <span className="font-bold">All</span>
        <div className="flex h-4 w-4 items-center justify-center border border-[#2a2d24] text-[10px]">
          ▼
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <div className="grid grid-cols-3 gap-y-4">
          {apps.map((app) => (
            <button
              key={app.id}
              onClick={() => handleAppClick(app.id)}
              className="flex flex-col items-center gap-1 transition-all active:invert"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border-2 border-[#2a2d24]">
                <app.icon size={32} strokeWidth={1.5} />
              </div>
              <span className="text-center text-[10px] font-bold leading-tight">{app.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
