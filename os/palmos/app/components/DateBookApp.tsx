'use client';

import React from 'react';

export function DateBookApp() {
  const hours = [
    '8:00',
    '9:00',
    '10:00',
    '11:00',
    '12:00',
    '1:00',
    '2:00',
    '3:00',
    '4:00',
    '5:00',
    '6:00',
  ];

  return (
    <div className="flex h-full w-full flex-col bg-white font-sans text-black">
      {/* Date navigation row */}
      <div className="flex items-center border-b border-black h-7">
        <div className="px-2 h-full flex items-center font-bold text-[11px] border-r border-black">
          Sep 23, 04
        </div>
        <div className="flex-1 flex items-center justify-center gap-3 px-2">
          <span className="text-[10px]">◀</span>
          <div className="flex gap-[2px]">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
              <div
                key={i}
                className={`w-4 h-4 flex items-center justify-center border border-black text-[9px] font-bold ${i === 4 ? 'bg-[#1A1A8C] text-white' : ''}`}
              >
                {day}
              </div>
            ))}
          </div>
          <span className="text-[10px]">▶</span>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto pt-1">
        {hours.map((hour, i) => (
          <div key={hour} className="flex h-6 items-start">
            <div
              className={`w-12 text-right pr-2 text-[11px] font-bold ${i === 0 ? 'bg-[#1A1A8C] text-white rounded-r-lg px-1' : ''}`}
            >
              {hour}
            </div>
            <div className="flex-1 h-full border-b border-dotted border-black/30 relative">
              {i === 0 && (
                <div className="absolute top-0 left-0 pl-1 text-[11px] font-bold flex items-center h-full">
                  <div className="w-[2px] h-[80%] bg-black mr-1" />
                  Test
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-1 border-t border-black bg-[#f0f0f0]">
        <div className="flex gap-1">
          <div className="w-4 h-4 border border-black rounded-sm bg-[#1A1A8C]" />
          <div className="w-4 h-4 border border-black rounded-sm flex items-center justify-center text-[10px]">
            ...
          </div>
          <div className="w-4 h-4 border border-black rounded-sm flex items-center justify-center text-[10px]">
            田
          </div>
          <div className="w-4 h-4 border border-black rounded-sm flex items-center justify-center text-[10px]">
            ≡
          </div>
        </div>
        <div className="flex gap-1">
          <button className="px-2 py-0\.5 border border-black rounded-full text-[10px] font-bold bg-white active:bg-black active:text-white">
            New
          </button>
          <button className="px-2 py-0\.5 border border-black rounded-full text-[10px] font-bold bg-white active:bg-black active:text-white">
            Details
          </button>
          <button className="px-2 py-0\.5 border border-black rounded-full text-[10px] font-bold bg-white active:bg-black active:text-white">
            Go To
          </button>
        </div>
      </div>
    </div>
  );
}
