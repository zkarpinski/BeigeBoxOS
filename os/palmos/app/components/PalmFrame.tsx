'use client';

import React from 'react';
import { usePalmSounds } from '../hooks/usePalmSounds';
import {
  Calendar,
  Users,
  CheckSquare,
  FileText,
  ChevronUp,
  ChevronDown,
  Home,
  Menu,
  Search,
  Calculator,
} from 'lucide-react';

interface PalmFrameProps {
  children: React.ReactNode;
  onHomeClick?: () => void;
  onMenuClick?: () => void;
  onSearchClick?: () => void;
  onCalcClick?: () => void;
  onAppButtonClick?: (app: string) => void;
  onScroll?: (direction: 'up' | 'down') => void;
}

export function PalmFrame({
  children,
  onHomeClick,
  onMenuClick,
  onSearchClick,
  onCalcClick,
  onAppButtonClick,
  onScroll,
}: PalmFrameProps) {
  const { playClick } = usePalmSounds();

  const handleHomeClick = () => {
    playClick();
    onHomeClick?.();
  };

  const handleAppButtonClick = (app: string) => {
    playClick();
    onAppButtonClick?.(app);
  };

  const handleCalcClick = () => {
    playClick();
    onCalcClick?.();
  };

  const handleSearchClick = () => {
    playClick();
    onSearchClick?.();
  };

  const handleMenuClick = () => {
    playClick();
    onMenuClick?.();
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#1a1a1a] p-12">
      {/* The Device Frame */}
      <div className="relative flex h-[650px] w-[400px] flex-col items-center rounded-[40px] border-b-[8px] border-r-[4px] border-[#707070] bg-[#a0a0a0] p-4 shadow-2xl">
        {/* Top Speaker/Logo area */}
        <div className="mb-4 flex h-8 w-full items-center justify-center">
          <div className="h-1 w-16 rounded-full bg-[#888] shadow-inner"></div>
        </div>

        {/* Screen Container */}
        <div className="relative rounded-sm border-2 border-[#888] bg-[#4a4d41] p-1 shadow-inner">
          <div className="relative h-[320px] w-[320px] overflow-hidden bg-[#8c927b]">
            {children}
          </div>
        </div>

        {/* Graffiti Area */}
        <div className="relative mt-4 flex h-[120px] w-[320px] items-center justify-between rounded-sm border border-[#6a725b] bg-[#7a826b] px-2">
          <div className="flex flex-col gap-4">
            <button
              onClick={handleHomeClick}
              className="rounded p-1 text-[#2a2d24] transition-colors hover:bg-[#6a725b]"
            >
              <Home size={24} />
            </button>
            <button
              onClick={handleMenuClick}
              className="rounded p-1 text-[#2a2d24] transition-colors hover:bg-[#6a725b]"
            >
              <Menu size={24} />
            </button>
          </div>

          {/* Graffiti Input Area Placeholder */}
          <div className="mx-4 flex h-full flex-1 items-center justify-center border-x border-[#6a725b]/30">
            <div className="pointer-events-none flex h-full w-full items-center justify-center opacity-20">
              <span className="font-serif text-4xl">abc | 123</span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <button
              onClick={handleCalcClick}
              className="rounded p-1 text-[#2a2d24] transition-colors hover:bg-[#6a725b]"
            >
              <Calculator size={24} />
            </button>
            <button
              onClick={handleSearchClick}
              className="rounded p-1 text-[#2a2d24] transition-colors hover:bg-[#6a725b]"
            >
              <Search size={24} />
            </button>
          </div>
        </div>

        {/* Physical Buttons */}
        <div className="mb-4 mt-auto flex w-full items-center justify-between px-6">
          <button
            onClick={() => handleAppButtonClick('calendar')}
            className="flex h-12 w-12 items-center justify-center rounded-full border-b-4 border-[#666] bg-[#888] shadow-lg transition-all active:translate-y-1 active:border-b-0"
          >
            <Calendar className="text-[#333]" size={20} />
          </button>
          <button
            onClick={() => handleAppButtonClick('address')}
            className="flex h-12 w-12 items-center justify-center rounded-full border-b-4 border-[#666] bg-[#888] shadow-lg transition-all active:translate-y-1 active:border-b-0"
          >
            <Users className="text-[#333]" size={20} />
          </button>

          {/* Scroll Buttons */}
          <div className="flex flex-col gap-1">
            <button
              onClick={() => {
                playClick();
                onScroll?.('up');
              }}
              className="flex h-8 w-10 items-center justify-center rounded-t-lg border-b-2 border-[#666] bg-[#888] shadow-lg transition-all active:translate-y-0.5 active:border-b-0"
            >
              <ChevronUp className="text-[#333]" size={20} />
            </button>
            <button
              onClick={() => {
                playClick();
                onScroll?.('down');
              }}
              className="flex h-8 w-10 items-center justify-center rounded-b-lg border-b-4 border-[#666] bg-[#888] shadow-lg transition-all active:translate-y-0.5 active:border-b-0"
            >
              <ChevronDown className="text-[#333]" size={20} />
            </button>
          </div>

          <button
            onClick={() => handleAppButtonClick('todo')}
            className="flex h-12 w-12 items-center justify-center rounded-full border-b-4 border-[#666] bg-[#888] shadow-lg transition-all active:translate-y-1 active:border-b-0"
          >
            <CheckSquare className="text-[#333]" size={20} />
          </button>
          <button
            onClick={() => handleAppButtonClick('memo')}
            className="flex h-12 w-12 items-center justify-center rounded-full border-b-4 border-[#666] bg-[#888] shadow-lg transition-all active:translate-y-1 active:border-b-0"
          >
            <FileText className="text-[#333]" size={20} />
          </button>
        </div>
      </div>

      {/* Desk surface shadow */}
      <div className="absolute bottom-10 -z-10 h-[40px] w-[500px] rounded-full bg-black/40 blur-2xl"></div>
    </div>
  );
}
