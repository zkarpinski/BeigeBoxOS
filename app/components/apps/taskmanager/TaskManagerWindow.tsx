'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppWindow, TitleBar } from '../../win98';
import type { AppConfig } from '@/app/types/app-config';
import { useWindowManager } from '../../../context/WindowManagerContext';

const ICON = 'shell/icons/computer_taskmgr.png';

type Tab = 'Applications' | 'Processes' | 'Performance' | 'Networking' | 'Users';
type SortKey = 'name' | 'pid' | 'user' | 'cpu' | 'mem';

interface ProcessEntry {
  name: string;
  pid: number;
  user: string;
  cpu: number;
  mem: number;
  appId?: string; // set for app-backed processes so End Process can close the window
}

// Static OS background processes — always present
const STATIC_PROCESSES: ProcessEntry[] = [
  { name: 'System Idle Process', pid: 0, user: 'SYSTEM', cpu: 97, mem: 16 },
  { name: 'System', pid: 4, user: 'SYSTEM', cpu: 0, mem: 124 },
  { name: 'smss.exe', pid: 412, user: 'SYSTEM', cpu: 0, mem: 288 },
  { name: 'csrss.exe', pid: 460, user: 'SYSTEM', cpu: 0, mem: 1408 },
  { name: 'winlogon.exe', pid: 484, user: 'SYSTEM', cpu: 0, mem: 1960 },
  { name: 'services.exe', pid: 528, user: 'SYSTEM', cpu: 0, mem: 1896 },
  { name: 'lsass.exe', pid: 540, user: 'SYSTEM', cpu: 0, mem: 916 },
  { name: 'svchost.exe', pid: 716, user: 'SYSTEM', cpu: 0, mem: 17128 },
  { name: 'svchost.exe', pid: 760, user: 'NETWORK SERVICE', cpu: 0, mem: 1800 },
  { name: 'svchost.exe', pid: 832, user: 'NETWORK SERVICE', cpu: 0, mem: 2468 },
  { name: 'svchost.exe', pid: 844, user: 'LOCAL SERVICE', cpu: 0, mem: 3108 },
  { name: 'spoolsv.exe', pid: 984, user: 'SYSTEM', cpu: 0, mem: 3108 },
  { name: 'explorer.exe', pid: 1472, user: 'ZKarpinski', cpu: 0, mem: 11888 },
  { name: 'ctfmon.exe', pid: 1596, user: 'ZKarpinski', cpu: 0, mem: 664 },
  { name: 'msmsgs.exe', pid: 1644, user: 'ZKarpinski', cpu: 0, mem: 1644 },
  { name: 'taskmgr.exe', pid: 2580, user: 'ZKarpinski', cpu: 2, mem: 3160 },
];

// Maps each app ID to its fake process metadata.
// PIDs are stable (won't collide with static range 0–2580).
const APP_PROCESS_MAP: Record<string, { exe: string; mem: number; pid: number }> = {
  word: { exe: 'winword.exe', mem: 28648, pid: 3100 },
  notepad: { exe: 'notepad.exe', mem: 1832, pid: 3200 },
  aim: { exe: 'aim.exe', mem: 8420, pid: 3300 },
  minesweeper: { exe: 'winmine.exe', mem: 2244, pid: 3400 },
  calculator: { exe: 'calc.exe', mem: 1428, pid: 3500 },
  paint: { exe: 'mspaint.exe', mem: 6144, pid: 3600 },
  msdos: { exe: 'command.com', mem: 1024, pid: 3700 },
  winamp: { exe: 'winamp.exe', mem: 7680, pid: 3800 },
  ie5: { exe: 'iexplore.exe', mem: 22016, pid: 3900 },
  napster: { exe: 'napster.exe', mem: 9216, pid: 4000 },
  navigator: { exe: 'netscape.exe', mem: 18432, pid: 4100 },
  defrag: { exe: 'defrag.exe', mem: 3072, pid: 4200 },
  vb6: { exe: 'vb6.exe', mem: 14336, pid: 4300 },
  controlpanel: { exe: 'control.exe', mem: 2560, pid: 4400 },
  mycomputer: { exe: 'mycomp.exe', mem: 5120, pid: 4500 },
  thps2: { exe: 'thps2.exe', mem: 32768, pid: 4600 },
  tim: { exe: 'machine.exe', mem: 6144, pid: 4700 },
  photoshop: { exe: 'photoshp.exe', mem: 40960, pid: 4800 },
  reporter: { exe: 'reporter.exe', mem: 2048, pid: 4900 },
  zonealarm: { exe: 'zlclient.exe', mem: 5632, pid: 5000 },
};

export const taskmanagerAppConfig: AppConfig = {
  id: 'taskmanager',
  label: 'Task Manager',
  icon: ICON,
  desktop: false,
  startMenu: { path: ['Programs', 'System Tools'] },
  taskbarLabel: 'Windows Task Manager',
};

export function TaskManagerWindow({ registry }: { registry: AppConfig[] }) {
  const [tab, setTab] = useState<Tab>('Processes');
  const [selectedPid, setSelectedPid] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortAsc, setSortAsc] = useState(true);
  // Animated CPU values for the two fluctuating processes
  const [idleCpu, setIdleCpu] = useState(97);
  const [taskmgrCpu, setTaskmgrCpu] = useState(2);
  const cpuCanvasRef = useRef<HTMLCanvasElement>(null);
  const memCanvasRef = useRef<HTMLCanvasElement>(null);
  const cpuHistoryRef = useRef<number[]>(new Array(60).fill(3));
  const ctx = useWindowManager();

  // ── Derive app processes live from context ──────────────────────────────
  const appProcesses = useMemo<ProcessEntry[]>(() => {
    if (!ctx) return [];
    return registry
      .filter((a) => ctx.apps[a.id]?.visible)
      .flatMap((a) => {
        const meta = APP_PROCESS_MAP[a.id];
        if (!meta) return [];
        return [
          { name: meta.exe, pid: meta.pid, user: 'ZKarpinski', cpu: 0, mem: meta.mem, appId: a.id },
        ];
      });
  }, [registry, ctx?.apps]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Merge static + live app processes ──────────────────────────────────
  const allProcesses = useMemo<ProcessEntry[]>(() => {
    const statics = STATIC_PROCESSES.map((p) => {
      if (p.name === 'System Idle Process') return { ...p, cpu: idleCpu };
      if (p.name === 'taskmgr.exe') return { ...p, cpu: taskmgrCpu };
      return p;
    });
    return [...statics, ...appProcesses];
  }, [idleCpu, taskmgrCpu, appProcesses]);

  // ── CPU animation ───────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setIdleCpu((v) => Math.max(90, Math.min(99, v + Math.floor(Math.random() * 5) - 2)));
      setTaskmgrCpu((v) => Math.max(0, Math.min(5, v + Math.floor(Math.random() * 3) - 1)));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Performance graph animation ─────────────────────────────────────────
  useEffect(() => {
    if (tab !== 'Performance') return;

    const drawGraph = (canvas: HTMLCanvasElement | null, history: number[], color: string) => {
      if (!canvas) return;
      const c = canvas.getContext('2d');
      if (!c) return;
      const W = canvas.width,
        H = canvas.height;
      c.fillStyle = '#000';
      c.fillRect(0, 0, W, H);
      c.strokeStyle = '#004400';
      c.lineWidth = 0.5;
      for (let i = 1; i < 4; i++) {
        c.beginPath();
        c.moveTo(0, (H / 4) * i);
        c.lineTo(W, (H / 4) * i);
        c.stroke();
      }
      for (let i = 1; i < 8; i++) {
        c.beginPath();
        c.moveTo((W / 8) * i, 0);
        c.lineTo((W / 8) * i, H);
        c.stroke();
      }
      c.strokeStyle = color;
      c.lineWidth = 1;
      c.beginPath();
      history.forEach((val, i) => {
        const x = (i / (history.length - 1)) * W;
        const y = H - (val / 100) * H;
        i === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
      });
      c.stroke();
    };

    const draw = () => {
      const cpuUsage = 100 - idleCpu;
      cpuHistoryRef.current.push(cpuUsage);
      if (cpuHistoryRef.current.length > 60) cpuHistoryRef.current.shift();
      drawGraph(cpuCanvasRef.current, cpuHistoryRef.current, '#00ff00');
      const memHistory = Array.from({ length: 60 }, (_, i) => 27 + Math.sin(i * 0.3) * 1.5);
      drawGraph(memCanvasRef.current, memHistory, '#ffff00');
    };

    draw();
    const interval = setInterval(draw, 1000);
    return () => clearInterval(interval);
  }, [tab, idleCpu]);

  // ── Sort ────────────────────────────────────────────────────────────────
  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((a) => !a);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const sortedProcesses = useMemo(
    () =>
      [...allProcesses].sort((a, b) => {
        let cmp = 0;
        if (sortKey === 'name') cmp = a.name.localeCompare(b.name);
        else if (sortKey === 'pid') cmp = a.pid - b.pid;
        else if (sortKey === 'user') cmp = a.user.localeCompare(b.user);
        else if (sortKey === 'cpu') cmp = a.cpu - b.cpu;
        else if (sortKey === 'mem') cmp = a.mem - b.mem;
        return sortAsc ? cmp : -cmp;
      }),
    [allProcesses, sortKey, sortAsc],
  );

  // ── End Process ─────────────────────────────────────────────────────────
  const handleEndProcess = () => {
    if (selectedPid === null || !ctx) return;
    const proc = allProcesses.find((p) => p.pid === selectedPid);
    if (!proc) return;
    if (proc.appId) {
      if (
        confirm(
          `WARNING: Terminating a process can cause undesired results including loss of data and system instability.\n\nAre you sure you want to terminate the process "${proc.name}"?`,
        )
      ) {
        ctx.hideApp(proc.appId);
        setSelectedPid(null);
      }
    } else {
      alert(`Unable to terminate process "${proc.name}".\n\nAccess is denied.`);
    }
  };

  // ── Derived stats ───────────────────────────────────────────────────────
  const cpuUsage = 100 - idleCpu;
  const totalMem = allProcesses.reduce((s, p) => s + p.mem, 0);
  const visibleApps = registry.filter(
    (a) => ctx?.apps[a.id]?.visible && !ctx?.apps[a.id]?.minimized,
  );

  const colHeader = (label: string, key: SortKey) => (
    <span className={`tm-col-${key}`} onClick={() => handleSort(key)}>
      {label}
      {sortKey === key ? (sortAsc ? ' ▲' : ' ▼') : ''}
    </span>
  );

  return (
    <AppWindow
      id="taskmanager-window"
      appId="taskmanager"
      allowResize
      className="taskmanager-window app-window app-window-hidden"
      titleBar={
        <TitleBar
          title="Windows Task Manager"
          icon={<img src={ICON} alt="" style={{ width: 16, height: 16, marginRight: 4 }} />}
          showMin
          showMax
          showClose
        />
      }
    >
      <div className="tm-menu-bar">
        {['File', 'Options', 'View', 'Shut Down', 'Help'].map((m) => (
          <div key={m} className="tm-menu-item">
            {m}
          </div>
        ))}
      </div>

      <div className="tm-tabs">
        {(['Applications', 'Processes', 'Performance', 'Networking', 'Users'] as Tab[]).map((t) => (
          <div key={t} className={`tm-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t}
          </div>
        ))}
      </div>

      <div className="tm-content">
        {/* ── Applications ── */}
        {tab === 'Applications' && (
          <div className="tm-applications">
            <div className="tm-app-table">
              <div className="tm-app-header">
                <span className="tm-app-col-task">Task</span>
                <span className="tm-app-col-status">Status</span>
              </div>
              {visibleApps.length === 0 ? (
                <div className="tm-app-empty">No applications running</div>
              ) : (
                visibleApps.map((a) => (
                  <div key={a.id} className="tm-app-row">
                    <span className="tm-app-col-task">{a.taskbarLabel ?? a.label}</span>
                    <span className="tm-app-col-status">Running</span>
                  </div>
                ))
              )}
            </div>
            <div className="tm-app-buttons">
              <button className="tm-btn" disabled>
                End Task
              </button>
              <button className="tm-btn" disabled>
                Switch To
              </button>
              <button className="tm-btn" disabled>
                New Task...
              </button>
            </div>
          </div>
        )}

        {/* ── Processes ── */}
        {tab === 'Processes' && (
          <div className="tm-processes">
            <div className="tm-proc-table">
              <div className="tm-proc-header">
                {colHeader('Image Name', 'name')}
                {colHeader('PID', 'pid')}
                {colHeader('User Name', 'user')}
                {colHeader('CPU', 'cpu')}
                {colHeader('Mem Usage', 'mem')}
              </div>
              {sortedProcesses.map((proc) => (
                <div
                  key={proc.pid}
                  className={`tm-proc-row${selectedPid === proc.pid ? ' selected' : ''}`}
                  onClick={() => setSelectedPid(proc.pid)}
                >
                  <span className="tm-col-name">{proc.name}</span>
                  <span className="tm-col-pid">{proc.pid}</span>
                  <span className="tm-col-user">{proc.user}</span>
                  <span className="tm-col-cpu">{String(proc.cpu).padStart(2, '0')}</span>
                  <span className="tm-col-mem">{proc.mem.toLocaleString()} K</span>
                </div>
              ))}
            </div>
            <div className="tm-proc-footer">
              <label className="tm-checkbox">
                <input type="checkbox" defaultChecked readOnly /> Show processes from all users
              </label>
              <button className="tm-btn" onClick={handleEndProcess} disabled={selectedPid === null}>
                End Process
              </button>
            </div>
          </div>
        )}

        {/* ── Performance ── */}
        {tab === 'Performance' && (
          <div className="tm-performance">
            <div className="tm-perf-top" style={{ display: 'flex', gap: 8 }}>
              <div className="tm-perf-section">
                <div className="tm-perf-label">CPU Usage</div>
                <div className="tm-perf-bar-container">
                  <div className="tm-perf-bar-fill" style={{ height: `${cpuUsage}%` }} />
                </div>
                <div className="tm-perf-label" style={{ marginTop: 4 }}>
                  CPU Usage History
                </div>
                <div className="tm-perf-graph-wrap">
                  <canvas ref={cpuCanvasRef} className="tm-perf-canvas" width={180} height={70} />
                </div>
              </div>
              <div className="tm-perf-section">
                <div className="tm-perf-label">PF Usage</div>
                <div className="tm-perf-bar-container">
                  <div className="tm-perf-bar-fill tm-mem-bar" style={{ height: '27%' }} />
                </div>
                <div className="tm-perf-label" style={{ marginTop: 4 }}>
                  Page File Usage History
                </div>
                <div className="tm-perf-graph-wrap">
                  <canvas ref={memCanvasRef} className="tm-perf-canvas" width={180} height={70} />
                </div>
              </div>
            </div>
            <div className="tm-perf-stats">
              <div className="tm-perf-stat-group">
                <div className="tm-perf-stat-title">Totals</div>
                <div className="tm-perf-stat-row">
                  <span>Handles</span>
                  <span>14,382</span>
                </div>
                <div className="tm-perf-stat-row">
                  <span>Threads</span>
                  <span>410</span>
                </div>
                <div className="tm-perf-stat-row">
                  <span>Processes</span>
                  <span>{allProcesses.length}</span>
                </div>
              </div>
              <div className="tm-perf-stat-group">
                <div className="tm-perf-stat-title">Physical Memory (K)</div>
                <div className="tm-perf-stat-row">
                  <span>Total</span>
                  <span>1,047,536</span>
                </div>
                <div className="tm-perf-stat-row">
                  <span>Available</span>
                  <span>762,512</span>
                </div>
                <div className="tm-perf-stat-row">
                  <span>System Cache</span>
                  <span>342,816</span>
                </div>
              </div>
              <div className="tm-perf-stat-group">
                <div className="tm-perf-stat-title">Kernel Memory (K)</div>
                <div className="tm-perf-stat-row">
                  <span>Total</span>
                  <span>84,588</span>
                </div>
                <div className="tm-perf-stat-row">
                  <span>Paged</span>
                  <span>62,172</span>
                </div>
                <div className="tm-perf-stat-row">
                  <span>Nonpaged</span>
                  <span>22,416</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Networking ── */}
        {tab === 'Networking' && (
          <div className="tm-networking">
            <div className="tm-net-header-row">
              <span className="tm-net-col">Adapter Name</span>
              <span className="tm-net-col">Network Utilization</span>
              <span className="tm-net-col">Link Speed</span>
              <span className="tm-net-col">State</span>
            </div>
            <div className="tm-net-body">
              <div className="tm-net-row">
                <span className="tm-net-col">Local Area Connection</span>
                <span className="tm-net-col">0 %</span>
                <span className="tm-net-col">100 Mbps</span>
                <span className="tm-net-col">Connected</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Users ── */}
        {tab === 'Users' && (
          <div className="tm-users">
            <div className="tm-user-header-row">
              <span className="tm-user-col">User</span>
              <span className="tm-user-col">ID</span>
              <span className="tm-user-col">Status</span>
              <span className="tm-user-col">Client Name</span>
              <span className="tm-user-col">Session</span>
            </div>
            <div className="tm-user-body">
              <div className="tm-user-row">
                <span className="tm-user-col">ZKarpinski</span>
                <span className="tm-user-col">0</span>
                <span className="tm-user-col">Active</span>
                <span className="tm-user-col"></span>
                <span className="tm-user-col">Console</span>
              </div>
            </div>
            <div className="tm-user-buttons">
              <button className="tm-btn" disabled>
                Disconnect
              </button>
              <button className="tm-btn" disabled>
                Logoff
              </button>
              <button className="tm-btn" disabled>
                Send Message...
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="tm-status-bar">
        <span>Processes: {allProcesses.length}</span>
        <span>CPU Usage: {cpuUsage}%</span>
        <span>Commit Charge: {totalMem.toLocaleString()} K / 315,024 K</span>
      </div>
    </AppWindow>
  );
}
