'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePalmSounds } from '../hooks/usePalmSounds';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const STORAGE_KEY = 'palmos-datebook';

interface Event {
  id: string;
  dateKey: string; // "YYYY-MM-DD"
  hourIndex: number;
  title: string;
}

const HOURS = [
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

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function formatPalmDate(d: Date) {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${String(d.getFullYear()).slice(-2)}`;
}
function addDays(d: Date, n: number) {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}
function load(): Event[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}
function save(events: Event[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

export function DateBookApp() {
  const [viewDate, setViewDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [editingSlot, setEditingSlot] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { playClick, playSuccess } = usePalmSounds();

  useEffect(() => {
    setViewDate(new Date());
    setEvents(load());
  }, []);

  if (!viewDate) return null;

  const key = dateKey(viewDate);
  const todayKey = dateKey(new Date());
  const dowIndex = viewDate.getDay(); // 0=Sun
  const dateLabel = formatPalmDate(viewDate);

  const dayEvents = events.filter((e) => e.dateKey === key);

  const navigate = (delta: number) => {
    playClick();
    setViewDate((d) => addDays(d!, delta));
    setEditingSlot(null);
  };

  const openSlot = (hourIndex: number) => {
    const existing = dayEvents.find((e) => e.hourIndex === hourIndex);
    if (existing) return; // already has an event — could expand to edit later
    playClick();
    setEditingSlot(hourIndex);
    setInputValue('');
    setTimeout(() => inputRef.current?.focus(), 30);
  };

  const saveEvent = () => {
    if (!inputValue.trim()) {
      setEditingSlot(null);
      return;
    }
    const e: Event = {
      id: Date.now().toString(),
      dateKey: key,
      hourIndex: editingSlot!,
      title: inputValue.trim(),
    };
    const next = [...events, e];
    setEvents(next);
    save(next);
    setEditingSlot(null);
    setInputValue('');
    playSuccess();
  };

  const deleteEvent = (id: string) => {
    playClick();
    const next = events.filter((e) => e.id !== id);
    setEvents(next);
    save(next);
  };

  const isToday = key === todayKey;

  return (
    <div className="flex h-full w-full flex-col bg-white text-black">
      {/* Date navigation row */}
      <div className="flex items-center border-b border-black h-7" style={{ flexShrink: 0 }}>
        <button
          onClick={() => navigate(-1)}
          className="px-2 h-full flex items-center text-[11px] border-r border-black font-bold bg-white"
          style={{ cursor: 'pointer' }}
        >
          ◀
        </button>
        <div className="px-2 h-full flex items-center font-bold text-[11px] border-r border-black">
          {dateLabel}
        </div>
        <div className="flex-1 flex items-center justify-center gap-[2px] px-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div
              key={i}
              className={`w-4 h-4 flex items-center justify-center border border-black text-[9px] font-bold
                ${i === dowIndex ? 'bg-[#1A1A8C] text-white' : isToday && i === new Date().getDay() ? 'bg-[#1A1A8C] text-white' : ''}`}
            >
              {day}
            </div>
          ))}
        </div>
        <button
          onClick={() => navigate(1)}
          className="px-2 h-full flex items-center text-[11px] border-l border-black font-bold bg-white"
          style={{ cursor: 'pointer' }}
        >
          ▶
        </button>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto pt-1">
        {HOURS.map((hour, i) => {
          const ev = dayEvents.find((e) => e.hourIndex === i);
          const isEditing = editingSlot === i;

          return (
            <div key={hour} className="flex items-stretch" style={{ minHeight: '24px' }}>
              {/* Hour label */}
              <div
                className="text-right pr-2 text-[11px] font-bold flex-shrink-0 flex items-center justify-end"
                style={{ width: '44px' }}
              >
                {hour}
              </div>

              {/* Slot */}
              <div
                className="flex-1 border-b border-dotted border-black/30 relative"
                style={{ cursor: ev || isEditing ? 'default' : 'pointer' }}
                onClick={() => !ev && !isEditing && openSlot(i)}
              >
                {isEditing ? (
                  <input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEvent();
                      if (e.key === 'Escape') setEditingSlot(null);
                    }}
                    onBlur={saveEvent}
                    style={{
                      position: 'absolute',
                      inset: '1px 2px',
                      border: '1px solid #1A1A8C',
                      outline: 'none',
                      fontSize: '11px',
                      padding: '0 3px',
                      fontFamily: 'inherit',
                      background: '#eef',
                    }}
                    placeholder="Event title..."
                  />
                ) : ev ? (
                  <div
                    className="absolute inset-0 flex items-center pl-1 text-[11px] font-bold group"
                    style={{ background: '#e8e8ff', borderLeft: '3px solid #1A1A8C' }}
                  >
                    <div className="w-[2px] h-[70%] bg-[#1A1A8C] mr-1 flex-shrink-0" />
                    <span className="flex-1 truncate">{ev.title}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteEvent(ev.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 pr-1 text-[10px] text-red-600"
                      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      ✕
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between p-1 border-t border-black bg-[#f0f0f0]"
        style={{ flexShrink: 0 }}
      >
        <div className="flex gap-1">
          <div className="w-4 h-4 border border-black rounded-sm bg-[#1A1A8C]" />
          <div className="w-4 h-4 border border-black rounded-sm flex items-center justify-center text-[10px]">
            ≡
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => {}}
            className="px-2 border border-black rounded-full text-[10px] font-bold bg-white active:bg-black active:text-white"
            style={{ cursor: 'pointer' }}
          >
            Details
          </button>
          <button
            onClick={() => {}}
            className="px-2 border border-black rounded-full text-[10px] font-bold bg-white active:bg-black active:text-white"
            style={{ cursor: 'pointer' }}
          >
            Go To
          </button>
          <button
            onClick={() =>
              openSlot(HOURS.findIndex((_, i) => !dayEvents.find((e) => e.hourIndex === i)))
            }
            className="px-2 border border-black rounded-full text-[10px] font-bold bg-white active:bg-black active:text-white"
            style={{ cursor: 'pointer' }}
          >
            New
          </button>
          <button
            onClick={() => {
              setViewDate(new Date());
              playClick();
            }}
            className="px-2 border border-black rounded-full text-[10px] font-bold bg-white active:bg-black active:text-white"
            style={{ cursor: 'pointer' }}
          >
            Today
          </button>
        </div>
      </div>
    </div>
  );
}
