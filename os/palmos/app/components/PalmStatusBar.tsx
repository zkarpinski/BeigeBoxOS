'use client';

import React, { useState, useEffect } from 'react';

export function PalmStatusBar() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex h-6 w-full items-center justify-between border-b border-[#2a2d24] px-2 text-sm font-bold">
      <div className="flex items-center gap-1">
        <div className="relative h-2 w-4 border border-[#2a2d24]">
          <div className="h-full bg-[#2a2d24]" style={{ width: '80%' }}></div>
          <div className="absolute -right-1 top-0.5 h-1 w-0.5 bg-[#2a2d24]"></div>
        </div>
      </div>
      <div>{time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>
      <div className="flex items-center gap-1">
        <div className="flex h-3 items-end gap-[1px]">
          <div className="h-1 w-1 bg-[#2a2d24]"></div>
          <div className="h-1.5 w-1 bg-[#2a2d24]"></div>
          <div className="h-2 w-1 bg-[#2a2d24]"></div>
          <div className="h-2.5 w-1 bg-[#2a2d24]"></div>
          <div className="h-3 w-1 bg-[#2a2d24] opacity-30"></div>
        </div>
      </div>
    </div>
  );
}
