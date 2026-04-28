'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { WinMobileFrame } from './WinMobileFrame';
import { WinMobileShellProvider } from './WinMobileShellContext';
import { CalculatorWindow } from '@retro-web/app-calculator';

// ---- Types ----
type AppId =
  | 'today'
  | 'calculator'
  | 'calendar'
  | 'contacts'
  | 'inbox'
  | 'tasks'
  | 'notes'
  | 'settings'
  | 'file-explorer'
  | 'ie'
  | 'programs';

// ---- Mock data ----
const MOCK_CONTACTS = [
  { id: 1, name: 'Alice Johnson', phone: '555-1234', email: 'alice@example.com' },
  { id: 2, name: 'Bob Smith', phone: '555-2345', email: 'bob@example.com' },
  { id: 3, name: 'Carol White', phone: '555-3456', email: 'carol@example.com' },
  { id: 4, name: 'David Brown', phone: '555-4567', email: 'david@example.com' },
  { id: 5, name: 'Eve Davis', phone: '555-5678', email: 'eve@example.com' },
  { id: 6, name: 'Frank Miller', phone: '555-6789', email: 'frank@example.com' },
  { id: 7, name: 'Grace Wilson', phone: '555-7890', email: 'grace@example.com' },
  { id: 8, name: 'Henry Moore', phone: '555-8901', email: 'henry@example.com' },
];

const MOCK_EMAILS = [
  {
    id: 1,
    from: 'Microsoft',
    subject: 'Welcome to Pocket PC!',
    date: 'Apr 26',
    read: true,
    body: 'Welcome to Windows Mobile 2003. Your device is now set up and ready to use.',
  },
  {
    id: 2,
    from: 'Dell Support',
    subject: 'Axim X3i Setup Guide',
    date: 'Apr 25',
    read: false,
    body: 'Thank you for purchasing your Dell Axim X3i. Please refer to this guide for setup instructions.',
  },
  {
    id: 3,
    from: 'ActiveSync',
    subject: 'Synchronization Complete',
    date: 'Apr 24',
    read: false,
    body: 'Your device has been synchronized successfully with your desktop PC.',
  },
  {
    id: 4,
    from: 'Mom',
    subject: 'Dinner Sunday?',
    date: 'Apr 23',
    read: true,
    body: 'Hi honey, are you coming for dinner on Sunday? Let me know!',
  },
];

const INITIAL_TASKS = [
  { id: 1, text: 'Buy groceries', done: false },
  { id: 2, text: 'Call dentist', done: false },
  { id: 3, text: 'Read Windows Mobile guide', done: true },
  { id: 4, text: 'Install additional software', done: false },
  { id: 5, text: 'Set up email account', done: false },
];

const MOCK_NOTES = [
  { id: 1, title: 'Shopping List', preview: 'Milk, eggs, bread...', date: 'Apr 26' },
  { id: 2, title: 'Meeting Notes', preview: 'Discussed Q2 targets...', date: 'Apr 24' },
  { id: 3, title: 'Phone Numbers', preview: 'Pizza: 555-9999...', date: 'Apr 20' },
];

// ---- Utility ----
function formatTime(d: Date) {
  let h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function formatDateLong(d: Date) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = [
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
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

// ---- Main component ----
export function WinMobileDesktop() {
  const [currentApp, setCurrentApp] = useState<AppId>('today');
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [emails, setEmails] = useState(MOCK_EMAILS);

  // Live clock — tick every 30s
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const openApp = useCallback((id: string) => {
    setCurrentApp(id as AppId);
    setStartMenuOpen(false);
  }, []);

  const goHome = useCallback(() => {
    setCurrentApp('today');
    setStartMenuOpen(false);
  }, []);

  const toggleTask = (id: number) =>
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const markEmailRead = (id: number) =>
    setEmails((es) => es.map((e) => (e.id === id ? { ...e, read: true } : e)));

  const unreadCount = emails.filter((e) => !e.read).length;
  const activeTaskCount = tasks.filter((t) => !t.done).length;

  const cmdLeft: Record<AppId, string> = {
    today: 'New',
    calculator: ' ',
    calendar: 'New',
    contacts: 'New',
    inbox: 'Reply',
    tasks: 'New Task',
    notes: 'New',
    settings: 'Done',
    'file-explorer': ' ',
    ie: 'Go',
    programs: ' ',
  };

  return (
    <WinMobileShellProvider currentApp={currentApp} openApp={openApp} goHome={goHome}>
      <WinMobileFrame onHomeBtn={goHome}>
        <div className="flex flex-col h-full relative">
          {/* Navigation Bar */}
          <NavBar
            currentApp={currentApp}
            time={formatTime(now)}
            onStartClick={() => setStartMenuOpen((s) => !s)}
          />

          {/* Content area */}
          <div className="winmo-content flex-1 overflow-hidden">
            {currentApp === 'today' && (
              <TodayScreen
                date={formatDateLong(now)}
                unreadCount={unreadCount}
                activeTaskCount={activeTaskCount}
                onOpenApp={openApp}
              />
            )}
            {currentApp === 'calculator' && <CalculatorWindow />}
            {currentApp === 'calendar' && <CalendarApp now={now} />}
            {currentApp === 'contacts' && <ContactsApp />}
            {currentApp === 'inbox' && <InboxApp emails={emails} onRead={markEmailRead} />}
            {currentApp === 'tasks' && <TasksApp tasks={tasks} onToggle={toggleTask} />}
            {currentApp === 'notes' && <NotesApp />}
            {currentApp === 'settings' && <SettingsApp />}
            {currentApp === 'file-explorer' && <FileExplorerApp />}
            {currentApp === 'ie' && <IEApp />}
            {currentApp === 'programs' && <ProgramsApp onOpenApp={openApp} />}
          </div>

          {/* Command Bar */}
          <div className="winmo-commandbar">
            <span style={{ cursor: 'pointer' }}>{cmdLeft[currentApp] ?? 'New'}</span>
            <span>&#9000;</span>
            <span style={{ cursor: 'pointer' }}>Menu</span>
          </div>

          {/* Start Menu */}
          {startMenuOpen && (
            <StartMenu onOpenApp={openApp} onClose={() => setStartMenuOpen(false)} />
          )}
        </div>
      </WinMobileFrame>
    </WinMobileShellProvider>
  );
}

// ---- NavBar ----
function NavBar({
  currentApp,
  time,
  onStartClick,
}: {
  currentApp: string;
  time: string;
  onStartClick: () => void;
}) {
  const titles: Record<string, string> = {
    today: 'Today',
    calculator: 'Calculator',
    calendar: 'Calendar',
    contacts: 'Contacts',
    inbox: 'Inbox',
    tasks: 'Tasks',
    notes: 'Notes',
    settings: 'Settings',
    'file-explorer': 'File Explorer',
    ie: 'Internet Explorer',
    programs: 'Programs',
  };

  return (
    <div className="winmo-navbar">
      <div className="winmo-start-btn" onClick={onStartClick}>
        <StartIcon />
        <span style={{ marginLeft: 4 }}>Start</span>
      </div>
      <div
        style={{
          flex: 1,
          padding: '0 6px',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
        }}
      >
        {titles[currentApp] ?? currentApp}
      </div>
      {/* System tray */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingRight: 4 }}>
        <SignalBars bars={3} />
        <BatteryIcon pct={72} />
        <span style={{ fontSize: 11, paddingRight: 2 }}>{time}</span>
      </div>
    </div>
  );
}

function StartIcon() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 1,
        width: 12,
        height: 12,
      }}
    >
      <div style={{ background: '#f35325', width: 5, height: 5 }} />
      <div style={{ background: '#81bc06', width: 5, height: 5 }} />
      <div style={{ background: '#05a6f0', width: 5, height: 5 }} />
      <div style={{ background: '#ffba08', width: 5, height: 5 }} />
    </div>
  );
}

function SignalBars({ bars }: { bars: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 12 }}>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            width: 2,
            height: i * 3,
            background: i <= bars ? '#fff' : 'rgba(255,255,255,0.3)',
            borderRadius: 1,
          }}
        />
      ))}
    </div>
  );
}

function BatteryIcon({ pct }: { pct: number }) {
  return (
    <div
      style={{
        position: 'relative',
        width: 18,
        height: 10,
        border: '1px solid rgba(255,255,255,0.8)',
        borderRadius: 2,
      }}
    >
      <div
        style={{
          position: 'absolute',
          right: -3,
          top: '25%',
          width: 2,
          height: '50%',
          background: 'rgba(255,255,255,0.8)',
          borderRadius: 1,
        }}
      />
      <div
        style={{
          margin: 1,
          height: 'calc(100% - 2px)',
          width: `${pct}%`,
          background: pct > 20 ? '#5c5' : '#e55',
          borderRadius: 1,
        }}
      />
    </div>
  );
}

// ---- Start Menu ----
// ---- Windows flag logo ----
function WinFlag() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 1.5,
        width: 20,
        height: 20,
        flexShrink: 0,
      }}
    >
      <div style={{ background: '#ff3300' }} />
      <div style={{ background: '#33aa00' }} />
      <div style={{ background: '#3366ff' }} />
      <div style={{ background: '#ffaa00' }} />
    </div>
  );
}

function StartMenu({
  onOpenApp,
  onClose,
}: {
  onOpenApp: (id: string) => void;
  onClose: () => void;
}) {
  const mainItems = [
    { id: 'today', name: 'Today', icon: '🏠' },
    { id: 'calendar', name: 'Calendar', icon: '📅' },
    { id: 'contacts', name: 'Contacts', icon: '👤' },
    { id: 'inbox', name: 'Inbox', icon: '✉️' },
    { id: 'ie', name: 'Internet Explorer', icon: '🌐' },
    { id: 'notes', name: 'Notes', icon: '📝' },
    { id: 'tasks', name: 'Tasks', icon: '✅' },
    { id: 'calculator', name: 'Calculator', icon: '🧮' },
  ];

  const row: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '5px 10px',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    cursor: 'pointer',
    userSelect: 'none',
  };

  return (
    <>
      <div
        data-testid="start-backdrop"
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, zIndex: 999 }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 162,
          bottom: 0,
          background: '#3a7cc8',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '3px 0 10px rgba(0,0,0,0.45)',
        }}
      >
        {/* Header */}
        <div
          style={{
            background: '#1a4c96',
            padding: '5px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderBottom: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          <WinFlag />
          <span style={{ color: '#fff', fontWeight: 'bold', fontSize: 14, letterSpacing: 0.3 }}>
            Start
          </span>
        </div>

        {/* Recent apps row */}
        <div
          style={{
            background: '#2460a8',
            padding: '3px 8px',
            display: 'flex',
            gap: 5,
            alignItems: 'center',
            borderBottom: '1px solid rgba(0,0,0,0.2)',
          }}
        >
          {['🌐', '📅', '✉️', '📝', '🧮'].map((icon, i) => (
            <span key={i} style={{ fontSize: 16, cursor: 'pointer', lineHeight: 1 }}>
              {icon}
            </span>
          ))}
        </div>

        {/* Scrollable list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {mainItems.map((item) => (
            <div key={item.id} style={row} onClick={() => onOpenApp(item.id)}>
              <span style={{ fontSize: 14, width: 20, textAlign: 'center', lineHeight: 1 }}>
                {item.icon}
              </span>
              <span>{item.name}</span>
            </div>
          ))}

          <div style={{ height: 1, background: 'rgba(255,255,255,0.22)', margin: '2px 0' }} />

          {/* Programs — opens full Programs screen */}
          <div
            style={{ ...row, justifyContent: 'space-between' }}
            onClick={() => onOpenApp('programs')}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>📂</span>
              <span>Programs</span>
            </span>
            <span style={{ fontSize: 8, marginRight: 2 }}>▶</span>
          </div>

          {/* Settings */}
          <div style={row} onClick={() => onOpenApp('settings')}>
            <span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>📂</span>
            <span>Settings</span>
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.22)', margin: '2px 0' }} />

          <div style={row} onClick={onClose}>
            <span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>🔍</span>
            <span>Find</span>
          </div>
          <div style={row} onClick={onClose}>
            <span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>❓</span>
            <span>Help</span>
          </div>
        </div>
      </div>
    </>
  );
}

// ---- Programs App ----
function ProgramsApp({ onOpenApp }: { onOpenApp: (id: string) => void }) {
  const apps = [
    { id: 'calculator', name: 'Calculator', icon: '🧮', color: '#c8e0f8' },
    { id: 'file-explorer', name: 'File Explorer', icon: '📁', color: '#fde8a0' },
    { id: 'notes', name: 'Notes', icon: '📝', color: '#fffacd' },
    { id: null, name: 'Games', icon: '🎮', color: '#d0f0d0' },
    { id: null, name: 'MSN Messenger', icon: '💬', color: '#cce8ff' },
    { id: null, name: 'Pictures', icon: '🖼️', color: '#ffd8e8' },
    { id: null, name: 'Pocket Excel', icon: '📊', color: '#d8f0d0' },
    { id: null, name: 'Pocket Word', icon: '📄', color: '#d0d8ff' },
    { id: null, name: 'Microsoft Reader', icon: '📖', color: '#ffe0c0' },
    { id: null, name: 'Pocket MSN', icon: '🦋', color: '#e8d8ff' },
    { id: null, name: 'Windows Media', icon: '▶️', color: '#c8f0e0' },
    { id: null, name: 'Data Backup', icon: '💾', color: '#e0e0e0' },
  ];

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#daeef8', padding: '6px 4px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
        {apps.map((app, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '8px 4px',
              cursor: app.id ? 'pointer' : 'default',
            }}
            onClick={() => app.id && onOpenApp(app.id)}
          >
            <div
              style={{
                width: 46,
                height: 46,
                background: app.color,
                border: '1px solid rgba(0,0,0,0.15)',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
              }}
            >
              {app.icon}
            </div>
            <span
              style={{
                fontSize: 10,
                textAlign: 'center',
                marginTop: 3,
                color: '#000',
                lineHeight: 1.2,
                maxWidth: 72,
              }}
            >
              {app.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Today Screen ----
function TodayScreen({
  date,
  unreadCount,
  activeTaskCount,
  onOpenApp,
}: {
  date: string;
  unreadCount: number;
  activeTaskCount: number;
  onOpenApp: (id: string) => void;
}) {
  return (
    <div className="winmo-today">
      <div className="winmo-today-header">
        <div className="winmo-today-date">{date}</div>
      </div>
      <div className="winmo-today-item" onClick={() => {}}>
        <div className="winmo-today-icon">👤</div>
        <span>Tap here to set owner information</span>
      </div>
      <div className="winmo-today-item" onClick={() => onOpenApp('calendar')}>
        <div className="winmo-today-icon">📅</div>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: 11 }}>No upcoming appointments</div>
          <div style={{ fontSize: 10, color: '#555' }}>Tap to open Calendar</div>
        </div>
      </div>
      <div className="winmo-today-item" onClick={() => onOpenApp('inbox')}>
        <div className="winmo-today-icon">✉️</div>
        <div>
          {unreadCount > 0 ? (
            <>
              <div style={{ fontWeight: 'bold', fontSize: 11 }}>
                {unreadCount} unread message{unreadCount > 1 ? 's' : ''}
              </div>
              <div style={{ fontSize: 10, color: '#555' }}>Inbox</div>
            </>
          ) : (
            <span>No unread messages</span>
          )}
        </div>
      </div>
      <div className="winmo-today-item" onClick={() => onOpenApp('tasks')}>
        <div className="winmo-today-icon">&#9745;</div>
        <div>
          {activeTaskCount > 0 ? (
            <>
              <div style={{ fontWeight: 'bold', fontSize: 11 }}>
                {activeTaskCount} active task{activeTaskCount > 1 ? 's' : ''}
              </div>
              <div style={{ fontSize: 10, color: '#555' }}>Tasks</div>
            </>
          ) : (
            <span>No active tasks</span>
          )}
        </div>
      </div>
      <div className="winmo-today-item" onClick={() => onOpenApp('notes')}>
        <div className="winmo-today-icon">📝</div>
        <span>
          {MOCK_NOTES.length} note{MOCK_NOTES.length !== 1 ? 's' : ''}
        </span>
      </div>
      {/* ActiveSync status row */}
      <div className="winmo-today-item" style={{ opacity: 0.7 }} onClick={() => {}}>
        <div className="winmo-today-icon" style={{ fontSize: 12 }}>
          🔄
        </div>
        <div>
          <div style={{ fontSize: 10 }}>ActiveSync</div>
          <div style={{ fontSize: 9, color: '#555' }}>Last sync: Today 9:14 AM</div>
        </div>
      </div>
    </div>
  );
}

// ---- Calendar App ----
function CalendarApp({ now }: { now: Date }) {
  const [viewDate, setViewDate] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const isCurrentMonth = now.getMonth() === month && now.getFullYear() === year;
  const today = isCurrentMonth ? now.getDate() : -1;

  const monthNames = [
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
  const dayLabels = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>
      {/* Month navigator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--pocketpc-gradient)',
          color: '#fff',
          padding: '4px 6px',
          fontSize: 12,
          fontWeight: 'bold',
        }}
      >
        <button
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: 14,
            cursor: 'pointer',
            padding: '0 6px',
          }}
        >
          &#9664;
        </button>
        <span style={{ flex: 1, textAlign: 'center' }}>
          {monthNames[month]} {year}
        </span>
        <button
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: 14,
            cursor: 'pointer',
            padding: '0 6px',
          }}
        >
          &#9654;
        </button>
      </div>
      {/* Day headers */}
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: '#3a6ea5' }}
      >
        {dayLabels.map((d) => (
          <div
            key={d}
            style={{
              textAlign: 'center',
              color: '#fff',
              fontSize: 10,
              fontWeight: 'bold',
              padding: '2px 0',
            }}
          >
            {d}
          </div>
        ))}
      </div>
      {/* Calendar grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          border: '1px solid #ddd',
          borderTop: 'none',
        }}
      >
        {cells.map((day, i) => {
          const isToday = day === today;
          const isSelected = day === selectedDay;
          return (
            <div
              key={i}
              onClick={() => day && setSelectedDay(day === selectedDay ? null : day)}
              style={{
                height: 26,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                borderRight: '1px solid #eee',
                borderBottom: '1px solid #eee',
                background: isSelected ? '#244976' : isToday ? '#3a6ea5' : day ? '#fff' : '#f8f8f8',
                color: isSelected || isToday ? '#fff' : day ? '#000' : '#ccc',
                fontWeight: isToday ? 'bold' : 'normal',
                cursor: day ? 'pointer' : 'default',
              }}
            >
              {day ?? ''}
            </div>
          );
        })}
      </div>
      {/* Day detail */}
      <div
        style={{
          flex: 1,
          padding: '8px 10px',
          fontSize: 11,
          color: '#555',
          background: '#f9f9f9',
          borderTop: '1px solid #ddd',
        }}
      >
        {selectedDay
          ? `${monthNames[month]} ${selectedDay} — No appointments`
          : 'Tap a day to view appointments'}
      </div>
    </div>
  );
}

// ---- Contacts App ----
function ContactsApp() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<(typeof MOCK_CONTACTS)[0] | null>(null);

  const filtered = MOCK_CONTACTS.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  if (selected) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>
        <div
          style={{
            padding: '6px 10px',
            background: '#f0f0f0',
            borderBottom: '1px solid #ccc',
            cursor: 'pointer',
          }}
          onClick={() => setSelected(null)}
        >
          <span style={{ fontSize: 10, color: '#3a6ea5' }}>&#9664; Contacts</span>
        </div>
        <div
          style={{
            padding: '12px 12px 8px',
            borderBottom: '1px solid #eee',
            background: 'var(--pocketpc-gradient)',
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 'bold', color: '#fff' }}>{selected.name}</div>
        </div>
        <div style={{ flex: 1, padding: '8px 10px', fontSize: 11 }}>
          <ContactRow label="Mobile" value={selected.phone} />
          <ContactRow label="Email" value={selected.email} />
        </div>
      </div>
    );
  }

  // Group by first letter
  const letters = [...new Set(filtered.map((c) => c.name[0]))];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '4px 6px',
          borderBottom: '1px solid #ccc',
          background: '#f0f0f0',
          gap: 4,
        }}
      >
        <span style={{ fontSize: 10, color: '#666' }}>&#128269;</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Type a name or number"
          style={{
            flex: 1,
            border: '1px solid #aaa',
            fontSize: 10,
            padding: '2px 4px',
            outline: 'none',
          }}
        />
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {letters.map((letter) => (
          <React.Fragment key={letter}>
            <div
              style={{
                padding: '2px 8px',
                background: '#3a6ea5',
                color: '#fff',
                fontSize: 10,
                fontWeight: 'bold',
              }}
            >
              {letter}
            </div>
            {filtered
              .filter((c) => c.name[0] === letter)
              .map((c) => (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '6px 12px',
                    borderBottom: '1px solid #eee',
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelected(c)}
                >
                  <div style={{ fontSize: 12, fontWeight: 'bold' }}>{c.name}</div>
                  <div style={{ fontSize: 10, color: '#666' }}>m {c.phone}</div>
                </div>
              ))}
          </React.Fragment>
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: 16, fontSize: 11, color: '#888', textAlign: 'center' }}>
            No contacts found
          </div>
        )}
      </div>
    </div>
  );
}

function ContactRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div
        style={{ fontSize: 9, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}
      >
        {label}
      </div>
      <div style={{ fontSize: 12, color: '#3a6ea5' }}>{value}</div>
    </div>
  );
}

// ---- Inbox App ----
type Email = (typeof MOCK_EMAILS)[0];

function InboxApp({ emails, onRead }: { emails: Email[]; onRead: (id: number) => void }) {
  const [selected, setSelected] = useState<Email | null>(null);

  if (selected) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>
        <div
          style={{
            padding: '6px 10px',
            background: '#f0f0f0',
            borderBottom: '1px solid #ccc',
            cursor: 'pointer',
          }}
          onClick={() => setSelected(null)}
        >
          <span style={{ fontSize: 10, color: '#3a6ea5' }}>&#9664; Inbox</span>
        </div>
        <div style={{ padding: '8px 10px', borderBottom: '1px solid #eee' }}>
          <div style={{ fontWeight: 'bold', fontSize: 12 }}>{selected.subject}</div>
          <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>From: {selected.from}</div>
          <div style={{ fontSize: 10, color: '#999' }}>{selected.date}</div>
        </div>
        <div style={{ flex: 1, padding: '8px 10px', fontSize: 11, lineHeight: 1.6 }}>
          {selected.body}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>
      <div
        style={{
          padding: '4px 8px',
          background: '#f0f0f0',
          borderBottom: '1px solid #ccc',
          fontSize: 10,
          color: '#666',
        }}
      >
        Inbox ({emails.filter((e) => !e.read).length} unread)
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {emails.map((e) => (
          <div
            key={e.id}
            style={{
              padding: '6px 10px',
              borderBottom: '1px solid #eee',
              cursor: 'pointer',
              background: e.read ? '#fff' : '#e8f0ff',
            }}
            onClick={() => {
              setSelected(e);
              onRead(e.id);
            }}
          >
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}
            >
              <span style={{ fontWeight: e.read ? 'normal' : 'bold', fontSize: 11 }}>{e.from}</span>
              <span style={{ fontSize: 9, color: '#999' }}>{e.date}</span>
            </div>
            <div
              style={{
                fontSize: 10,
                color: '#555',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {e.subject}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Tasks App ----
type Task = (typeof INITIAL_TASKS)[0];

function TasksApp({ tasks, onToggle }: { tasks: Task[]; onToggle: (id: number) => void }) {
  const active = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>
      <div
        style={{
          padding: '4px 8px',
          background: '#f0f0f0',
          borderBottom: '1px solid #ccc',
          fontSize: 10,
          color: '#666',
        }}
      >
        Active Tasks ({active.length})
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {active.map((t) => (
          <TaskRow key={t.id} task={t} onToggle={onToggle} />
        ))}
        {done.length > 0 && (
          <>
            <div
              style={{
                padding: '4px 8px',
                background: '#f0f0f0',
                borderBottom: '1px solid #ccc',
                fontSize: 10,
                color: '#888',
                marginTop: 4,
              }}
            >
              Completed ({done.length})
            </div>
            {done.map((t) => (
              <TaskRow key={t.id} task={t} onToggle={onToggle} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

function TaskRow({ task, onToggle }: { task: Task; onToggle: (id: number) => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '8px 10px',
        borderBottom: '1px solid #eee',
        gap: 8,
        cursor: 'pointer',
      }}
      onClick={() => onToggle(task.id)}
    >
      <div
        style={{
          width: 14,
          height: 14,
          border: `2px solid ${task.done ? '#aaa' : '#3a6ea5'}`,
          borderRadius: 2,
          background: task.done ? '#aaa' : '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {task.done && <span style={{ color: '#fff', fontSize: 9 }}>&#10003;</span>}
      </div>
      <span
        style={{
          fontSize: 11,
          textDecoration: task.done ? 'line-through' : 'none',
          color: task.done ? '#999' : '#000',
        }}
      >
        {task.text}
      </span>
    </div>
  );
}

// ---- Notes App ----
function NotesApp() {
  const [selected, setSelected] = useState<(typeof MOCK_NOTES)[0] | null>(null);

  if (selected) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>
        <div
          style={{
            padding: '6px 10px',
            background: '#f0f0f0',
            borderBottom: '1px solid #ccc',
            cursor: 'pointer',
          }}
          onClick={() => setSelected(null)}
        >
          <span style={{ fontSize: 10, color: '#3a6ea5' }}>&#9664; Notes</span>
        </div>
        <div
          style={{
            padding: '6px 10px',
            borderBottom: '1px solid #eee',
            fontWeight: 'bold',
            fontSize: 12,
          }}
        >
          {selected.title}
        </div>
        <div
          style={{
            flex: 1,
            padding: '8px 10px',
            fontSize: 11,
            lineHeight: 1.7,
            fontFamily: 'Tahoma, sans-serif',
            background: '#fefefe',
            backgroundImage: 'repeating-linear-gradient(transparent, transparent 19px, #dde 20px)',
          }}
        >
          {selected.id === 1
            ? 'Milk\nEggs\nBread\nJuice\nCoffee\nButter'
            : selected.id === 2
              ? 'Q2 targets discussed:\n- Improve response time\n- Launch new feature\n- Hire 2 engineers'
              : 'Pizza: 555-9999\nDoctor: 555-1111\nDentist: 555-2222'}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>
      <div
        style={{
          padding: '4px 8px',
          background: '#f0f0f0',
          borderBottom: '1px solid #ccc',
          fontSize: 10,
          color: '#666',
        }}
      >
        All Notes ({MOCK_NOTES.length})
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {MOCK_NOTES.map((n) => (
          <div
            key={n.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '7px 10px',
              borderBottom: '1px solid #eee',
              gap: 8,
              cursor: 'pointer',
            }}
            onClick={() => setSelected(n)}
          >
            <span style={{ fontSize: 18 }}>&#128221;</span>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontWeight: 'bold', fontSize: 11 }}>{n.title}</div>
              <div
                style={{
                  fontSize: 10,
                  color: '#888',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {n.preview}
              </div>
            </div>
            <span style={{ fontSize: 9, color: '#aaa', flexShrink: 0 }}>{n.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Settings App ----
function SettingsApp() {
  const [volume, setVolume] = useState(3);
  const [brightness, setBrightness] = useState(4);

  const items = [
    {
      icon: '&#128266;',
      label: 'Sounds & Notifications',
      desc: 'Ring type and volume',
      action: null,
    },
    { icon: '&#128261;', label: 'Display', desc: 'Brightness and orientation', action: null },
    { icon: '&#128225;', label: 'Connections', desc: 'Wi-Fi, Bluetooth, GPRS', action: null },
    { icon: '&#9000;', label: 'Input', desc: 'SIP and character recognition', action: null },
    { icon: '&#128204;', label: 'Regional Settings', desc: 'Language, date, time', action: null },
    { icon: '&#128222;', label: 'Phone', desc: 'Ring tone and call settings', action: null },
    { icon: '&#128274;', label: 'Lock', desc: 'Password and device lock', action: null },
    { icon: '&#128190;', label: 'Memory', desc: 'Storage and program memory', action: null },
    { icon: '&#128267;', label: 'Power', desc: 'Battery and suspend settings', action: null },
    { icon: '&#8505;', label: 'About', desc: 'Windows Mobile 2003 SE', action: null },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>
      <div
        style={{
          padding: '4px 8px',
          background: '#f0f0f0',
          borderBottom: '1px solid #ccc',
          fontSize: 10,
          color: '#666',
        }}
      >
        Settings
      </div>
      {/* Quick controls */}
      <div
        style={{
          padding: '8px 10px',
          borderBottom: '1px solid #ddd',
          background: '#f8f8f8',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <SliderRow label="Volume" value={volume} max={5} onChange={setVolume} icon="&#128266;" />
        <SliderRow
          label="Brightness"
          value={brightness}
          max={5}
          onChange={setBrightness}
          icon="&#9728;"
        />
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '7px 10px',
              borderBottom: '1px solid #eee',
              gap: 10,
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 16, width: 22, textAlign: 'center' }}>{item.icon}</span>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: 11 }}>{item.label}</div>
              <div style={{ fontSize: 9, color: '#888' }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SliderRow({
  label,
  value,
  max,
  onChange,
  icon,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (v: number) => void;
  icon: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 12 }}>{icon}</span>
      <span style={{ fontSize: 10, width: 60 }}>{label}</span>
      <div style={{ display: 'flex', gap: 3 }}>
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            onClick={() => onChange(i + 1)}
            style={{
              width: 18,
              height: 12,
              background: i < value ? '#3a6ea5' : '#ccc',
              borderRadius: 2,
              cursor: 'pointer',
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ---- File Explorer ----
const FILE_TREE: Record<string, { name: string; type: 'folder' | 'file'; size?: string }[]> = {
  'My Device': [
    { name: 'My Documents', type: 'folder' },
    { name: 'My Pictures', type: 'folder' },
    { name: 'Program Files', type: 'folder' },
    { name: 'Storage Card', type: 'folder' },
    { name: 'Windows', type: 'folder' },
  ],
  'My Documents': [
    { name: 'shopping.txt', type: 'file', size: '1 KB' },
    { name: 'notes.pwi', type: 'file', size: '2 KB' },
    { name: 'budget.xls', type: 'file', size: '8 KB' },
  ],
  'My Pictures': [
    { name: 'photo001.jpg', type: 'file', size: '128 KB' },
    { name: 'photo002.jpg', type: 'file', size: '132 KB' },
  ],
  'Program Files': [
    { name: 'Calculator', type: 'folder' },
    { name: 'Pocket IE', type: 'folder' },
    { name: 'ActiveSync', type: 'folder' },
  ],
};

function FileExplorerApp() {
  const [pathStack, setPathStack] = useState(['My Device']);
  const path = pathStack[pathStack.length - 1];
  const items = FILE_TREE[path] ?? [];

  const navigate = (name: string) => setPathStack((s) => [...s, name]);
  const goUp = () => setPathStack((s) => s.slice(0, -1));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '4px 6px',
          borderBottom: '1px solid #ccc',
          background: '#f0f0f0',
          gap: 4,
        }}
      >
        {pathStack.length > 1 && (
          <button
            onClick={goUp}
            style={{
              fontSize: 10,
              border: '1px solid #aaa',
              background: '#fff',
              cursor: 'pointer',
              padding: '1px 4px',
              borderRadius: 2,
            }}
          >
            &#9650; Up
          </button>
        )}
        <span style={{ fontSize: 10, color: '#333', fontWeight: 'bold' }}>&#128193; {path}</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '6px 10px',
              borderBottom: '1px solid #eee',
              gap: 8,
              cursor: item.type === 'folder' ? 'pointer' : 'default',
            }}
            onClick={() =>
              item.type === 'folder' && FILE_TREE[item.name] ? navigate(item.name) : undefined
            }
          >
            <span style={{ fontSize: 16 }}>
              {item.type === 'folder' ? '&#128193;' : '&#128196;'}
            </span>
            <span style={{ flex: 1, fontSize: 11 }}>{item.name}</span>
            {item.size && <span style={{ fontSize: 9, color: '#aaa' }}>{item.size}</span>}
          </div>
        ))}
      </div>
      <div
        style={{
          padding: '3px 8px',
          background: '#f0f0f0',
          borderTop: '1px solid #ccc',
          fontSize: 9,
          color: '#888',
        }}
      >
        {items.length} object{items.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

// ---- Internet Explorer Mobile ----
function IEApp() {
  const [url, setUrl] = useState('http://www.microsoft.com/windowsmobile');
  const [viewing, setViewing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleGo = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setViewing(true);
    }, 800);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '3px 4px',
          borderBottom: '1px solid #ccc',
          background: '#f0f0f0',
          gap: 4,
        }}
      >
        <button
          onClick={() => setViewing(false)}
          disabled={!viewing}
          style={{
            fontSize: 11,
            border: '1px solid #aaa',
            background: viewing ? '#fff' : '#e8e8e8',
            cursor: viewing ? 'pointer' : 'default',
            padding: '1px 5px',
            color: viewing ? '#000' : '#aaa',
          }}
        >
          &#9664;
        </button>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleGo()}
          style={{
            flex: 1,
            border: '1px solid #aaa',
            fontSize: 9,
            padding: '2px 4px',
            outline: 'none',
          }}
        />
        <button
          onClick={handleGo}
          style={{
            fontSize: 10,
            border: '1px solid #aaa',
            background: '#e0e0e0',
            cursor: 'pointer',
            padding: '2px 5px',
          }}
        >
          Go
        </button>
      </div>
      {/* Page */}
      {loading ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 6,
            color: '#888',
            fontSize: 11,
          }}
        >
          <div>&#9203;</div>
          <div>Loading...</div>
        </div>
      ) : !viewing ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            gap: 8,
          }}
        >
          <div style={{ fontSize: 24 }}>&#127758;</div>
          <div style={{ fontSize: 11, color: '#555', fontWeight: 'bold' }}>Internet Explorer</div>
          <div style={{ fontSize: 10, color: '#999', textAlign: 'center' }}>
            Enter an address and tap Go
          </div>
        </div>
      ) : (
        <div
          style={{ flex: 1, overflowY: 'auto', padding: '8px 10px', fontSize: 11, lineHeight: 1.5 }}
        >
          <div style={{ color: '#3a6ea5', fontWeight: 'bold', marginBottom: 4, fontSize: 13 }}>
            Windows Mobile
          </div>
          <div style={{ color: '#333', marginBottom: 8, fontSize: 11 }}>
            Windows Mobile 2003 — Pocket PC Edition
          </div>
          <div
            style={{
              color: '#555',
              fontSize: 10,
              borderTop: '1px solid #eee',
              paddingTop: 6,
              marginBottom: 8,
            }}
          >
            Experience the mobile internet with Internet Explorer Mobile. Browse the web on your
            Dell Axim X3i.
          </div>
          {['MSN Mobile', 'Hotmail', 'Windows Update', 'Microsoft Mobile'].map((link) => (
            <div
              key={link}
              style={{
                color: '#3a6ea5',
                fontSize: 11,
                textDecoration: 'underline',
                cursor: 'pointer',
                marginBottom: 4,
              }}
            >
              &bull; {link}
            </div>
          ))}
        </div>
      )}
      {/* Status bar */}
      <div
        style={{
          padding: '2px 6px',
          background: '#f0f0f0',
          borderTop: '1px solid #ccc',
          fontSize: 9,
          color: '#888',
        }}
      >
        {loading ? 'Connecting...' : viewing ? url : 'Ready'}
      </div>
    </div>
  );
}
