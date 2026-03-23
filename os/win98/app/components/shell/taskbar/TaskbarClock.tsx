'use client';

import { useEffect, useState } from 'react';

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

/** Local datetime for <time dateTime> (calendar + wall clock). */
function localDateTimeString(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

export function TaskbarClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const h = now.getHours();
  const m = pad2(now.getMinutes());
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;

  return (
    <time
      id="clock"
      className="taskbar-clock"
      dateTime={localDateTimeString(now)}
      suppressHydrationWarning
    >
      <span className="taskbar-clock__hm">
        {hour}:{m}
      </span>
      <span className="taskbar-clock__ampm">{ampm}</span>
    </time>
  );
}
