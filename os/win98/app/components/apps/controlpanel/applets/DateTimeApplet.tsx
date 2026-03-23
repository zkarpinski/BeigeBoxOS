'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useDraggable, centerDialog } from './shared';

const DATETIME_ICON = 'apps/controlpanel/datetime.png';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function drawClock(canvas: HTMLCanvasElement, date: Date) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const cx = 60,
    cy = 60,
    r = 56;
  ctx.clearRect(0, 0, 120, 120);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  ctx.strokeStyle = '#888';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const inner = i % 3 === 0 ? r - 10 : r - 6;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * inner, cy + Math.sin(a) * inner);
    ctx.lineTo(cx + Math.cos(a) * (r - 2), cy + Math.sin(a) * (r - 2));
    ctx.strokeStyle = '#333';
    ctx.lineWidth = i % 3 === 0 ? 2 : 1;
    ctx.stroke();
  }
  const h = date.getHours() % 12,
    m = date.getMinutes(),
    s = date.getSeconds();
  function hand(angle: number, length: number, width: number, color: string) {
    ctx!.beginPath();
    ctx!.moveTo(cx, cy);
    ctx!.lineTo(cx + Math.cos(angle) * length, cy + Math.sin(angle) * length);
    ctx!.strokeStyle = color;
    ctx!.lineWidth = width;
    ctx!.lineCap = 'round';
    ctx!.stroke();
  }
  hand((h / 12 + m / 720) * Math.PI * 2 - Math.PI / 2, 30, 3, '#222');
  hand((m / 60 + s / 3600) * Math.PI * 2 - Math.PI / 2, 42, 2, '#222');
  hand((s / 60) * Math.PI * 2 - Math.PI / 2, 48, 1, '#c00');
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#222';
  ctx.fill();
}

function buildCalendarData(date: Date) {
  const y = date.getFullYear(),
    m = date.getMonth(),
    d = date.getDate();
  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const rows: (number | null)[][] = [];
  let row: (number | null)[] = Array(firstDay).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    row.push(day);
    if (row.length === 7) {
      rows.push(row);
      row = [];
    }
  }
  while (row.length < 7) row.push(null);
  if (row.some((x) => x !== null)) rows.push(row);
  return { rows, y, m, d };
}

export function DateTimeApplet({ onClose }: { onClose: () => void }) {
  const [workDate, setWorkDate] = useState<Date>(() => {
    const stored =
      typeof window !== 'undefined'
        ? parseInt(localStorage.getItem('win98-time-offset') || '0', 10)
        : 0;
    return new Date(Date.now() + (isNaN(stored) ? 0 : stored));
  });
  const dialogRef = useRef<HTMLDivElement>(null);
  const clockCanvasRef = useRef<HTMLCanvasElement>(null);
  const titleMouseDown = useDraggable(dialogRef);

  useEffect(() => {
    if (dialogRef.current) centerDialog(dialogRef.current, 370, 320);
  }, []);
  useEffect(() => {
    if (clockCanvasRef.current) drawClock(clockCanvasRef.current, workDate);
  }, [workDate]);
  useEffect(() => {
    const id = setInterval(() => setWorkDate((prev) => new Date(prev.getTime() + 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  function applyOffset() {
    const offset = workDate.getTime() - Date.now();
    (window as unknown as { Win98TimeOffset: number }).Win98TimeOffset = offset;
    localStorage.setItem('win98-time-offset', String(offset));
  }

  function handleMonthChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setWorkDate((prev) => {
      const d = new Date(prev);
      d.setMonth(parseInt(e.target.value, 10));
      return d;
    });
  }
  function handleYearChange(e: React.ChangeEvent<HTMLInputElement>) {
    const y = parseInt(e.target.value, 10);
    if (!isNaN(y)) {
      setWorkDate((prev) => {
        const d = new Date(prev);
        d.setFullYear(y);
        return d;
      });
    }
  }
  function handleTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const parts = e.target.value.split(':').map(Number);
    if (parts.length >= 2 && !isNaN(parts[0])) {
      setWorkDate((prev) => {
        const d = new Date(prev);
        d.setHours(parts[0] || 0, parts[1] || 0, parts[2] || 0);
        return d;
      });
    }
  }

  const { rows, y, m, d } = buildCalendarData(workDate);
  const timeStr = `${String(workDate.getHours()).padStart(2, '0')}:${String(workDate.getMinutes()).padStart(2, '0')}:${String(workDate.getSeconds()).padStart(2, '0')}`;

  return (
    <div id="datetime-dialog" ref={dialogRef}>
      <div className="dp-titlebar" onMouseDown={titleMouseDown}>
        <span className="dp-titlebar-text">
          <img
            src={DATETIME_ICON}
            alt=""
            style={{ width: 14, height: 14, imageRendering: 'pixelated' }}
          />
          {' Date/Time Properties'}
        </span>
        <div className="dp-titlebar-btns">
          <button className="dp-titlebtn" title="Help">
            ?
          </button>
          <button className="dp-titlebtn" title="Close" onClick={onClose}>
            ✕
          </button>
        </div>
      </div>
      <div className="dp-tabs">
        <button className="dp-tab active">Date &amp; Time</button>
        <button className="dp-tab disabled" disabled>
          Time Zone
        </button>
      </div>
      <div className="dp-panel-border">
        <div className="dt-panel">
          <div className="dt-left">
            <div className="dt-section-label">Date</div>
            <div className="dt-month-row">
              <select className="dt-select-month" value={m} onChange={handleMonthChange}>
                {MONTHS.map((month, i) => (
                  <option key={i} value={i}>
                    {month}
                  </option>
                ))}
              </select>
              <input
                type="number"
                className="dt-year-input"
                min={1900}
                max={2099}
                value={y}
                onChange={handleYearChange}
              />
            </div>
            <table className="dt-calendar">
              <thead>
                <tr>
                  <th>Su</th>
                  <th>Mo</th>
                  <th>Tu</th>
                  <th>We</th>
                  <th>Th</th>
                  <th>Fr</th>
                  <th>Sa</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((day, ci) => (
                      <td
                        key={ci}
                        className={day === null ? 'dt-empty' : day === d ? 'dt-selected' : ''}
                        onClick={
                          day !== null
                            ? () =>
                                setWorkDate((prev) => {
                                  const nd = new Date(prev);
                                  nd.setDate(day);
                                  return nd;
                                })
                            : undefined
                        }
                      >
                        {day ?? ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="dt-right">
            <div className="dt-section-label">Time</div>
            <canvas ref={clockCanvasRef} width="120" height="120" className="dt-clock-canvas" />
            <input
              type="text"
              className="dt-time-input"
              value={timeStr}
              onChange={handleTimeChange}
            />
          </div>
        </div>
      </div>
      <div className="dp-footer">
        <button
          className="dp-footer-btn default-btn"
          onClick={() => {
            applyOffset();
            onClose();
          }}
        >
          OK
        </button>
        <button className="dp-footer-btn" onClick={onClose}>
          Cancel
        </button>
        <button className="dp-footer-btn" onClick={applyOffset}>
          Apply
        </button>
      </div>
    </div>
  );
}
