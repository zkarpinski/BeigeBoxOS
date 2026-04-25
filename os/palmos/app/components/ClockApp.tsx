'use client';

import React, { useState, useEffect } from 'react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
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

function handCoords(angleDeg: number, length: number, cx: number, cy: number) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return {
    x: cx + length * Math.cos(rad),
    y: cy + length * Math.sin(rad),
  };
}

export function ClockApp() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const cx = 100;
  const cy = 100;
  const r = 90;

  const sec = now.getSeconds();
  const min = now.getMinutes();
  const hr = now.getHours() % 12;

  const secDeg = sec * 6;
  const minDeg = min * 6 + sec * 0.1;
  const hrDeg = hr * 30 + min * 0.5;

  const secEnd = handCoords(secDeg, r * 0.82, cx, cy);
  const minEnd = handCoords(minDeg, r * 0.72, cx, cy);
  const hrEnd = handCoords(hrDeg, r * 0.5, cx, cy);

  const timeStr = now.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });
  const dateStr = `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}`;

  // Hour tick marks
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const angle = (i * 30 - 90) * (Math.PI / 180);
    const isMajor = i % 3 === 0;
    const inner = r * (isMajor ? 0.78 : 0.86);
    const outer = r * 0.93;
    return {
      x1: cx + inner * Math.cos(angle),
      y1: cy + inner * Math.sin(angle),
      x2: cx + outer * Math.cos(angle),
      y2: cy + outer * Math.sin(angle),
      isMajor,
    };
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
        background: 'white',
        gap: '6px',
      }}
    >
      {/* Analog clock */}
      <svg width="200" height="200" viewBox="0 0 200 200">
        {/* Face */}
        <circle cx={cx} cy={cy} r={r} fill="white" stroke="#000" strokeWidth="2" />

        {/* Tick marks */}
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke="#000"
            strokeWidth={t.isMajor ? 2 : 1}
          />
        ))}

        {/* Hour hand */}
        <line
          x1={cx}
          y1={cy}
          x2={hrEnd.x}
          y2={hrEnd.y}
          stroke="#000"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Minute hand */}
        <line
          x1={cx}
          y1={cy}
          x2={minEnd.x}
          y2={minEnd.y}
          stroke="#000"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Second hand */}
        <line
          x1={cx}
          y1={cy}
          x2={secEnd.x}
          y2={secEnd.y}
          stroke="#cc0000"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Center dot */}
        <circle cx={cx} cy={cy} r="3" fill="#000" />
      </svg>

      {/* Digital time */}
      <div
        style={{
          fontSize: '18px',
          fontWeight: 'bold',
          letterSpacing: '1px',
          color: '#000',
        }}
      >
        {timeStr}
      </div>

      {/* Date */}
      <div
        style={{
          fontSize: '11px',
          color: '#444',
        }}
      >
        {dateStr}
      </div>
    </div>
  );
}
