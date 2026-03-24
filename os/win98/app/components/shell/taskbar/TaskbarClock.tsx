'use client';

import { useEffect, useState } from 'react';

function formatTime(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m} ${ampm}`;
}

export function TaskbarClock() {
  const [time, setTime] = useState('');

  useEffect(() => {
    setTime(formatTime(new Date()));
    const id = setInterval(() => setTime(formatTime(new Date())), 10000);
    return () => clearInterval(id);
  }, []);

  return <span id="clock">{time}</span>;
}
