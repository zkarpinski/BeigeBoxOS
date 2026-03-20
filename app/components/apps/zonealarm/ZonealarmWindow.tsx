'use client';

import React, { useState } from 'react';
import { AppWindow, TitleBar } from '../../win98';
import type { AppConfig } from '@/app/types/app-config';

export const zonealarmAppConfig: AppConfig = {
  id: 'zonealarm',
  label: 'ZoneAlarm',
  icon: 'apps/zonealarm/zonealarm-icon.svg',
  openByDefault: false,
  desktop: false,
  startMenu: { path: ['Programs', 'Internet'] },
  taskbarLabel: 'ZoneAlarm',
  tray: true,
};

type NavSection = 'overview' | 'firewall' | 'programs' | 'alerts' | 'email';
type FirewallTab = 'main' | 'zones';
type SecurityLevel = 'high' | 'medium' | 'low';

// Thumb top offset (px) for each level — center of thumb lands on the tick mark
const THUMB_TOP: Record<SecurityLevel, number> = { high: 4, medium: 28, low: 52 };

const LEVEL_LABEL: Record<SecurityLevel, string> = { high: '– High', medium: 'Med.', low: '– Low' };

const INTERNET_DESC: Record<SecurityLevel, JSX.Element> = {
  high: (
    <>
      <strong>High:</strong> Your computer is invisible to other Internet computers. All unsolicited
      incoming traffic is blocked. Recommended for maximum security.
    </>
  ),
  medium: (
    <>
      <strong>Medium:</strong> Visible but protected mode: Computers can see your computer but
      cannot share its resources. Incoming NetBIOS is blocked. This setting is recommended for
      temporary use in the Internet Zone.
    </>
  ),
  low: (
    <>
      <strong>Low:</strong> Minimum security. Your computer can be accessed and most resources
      shared. Not recommended for public Internet use.
    </>
  ),
};

const TRUSTED_DESC: Record<SecurityLevel, JSX.Element> = {
  high: (
    <>
      <strong>High:</strong> Even trusted computers have restricted access to your resources.
      Incoming shares are blocked.
    </>
  ),
  medium: (
    <>
      <strong>Medium:</strong> Sharing mode: Computers can see your computer and share its
      resources. This setting is recommended for the Trusted Zone only.
    </>
  ),
  low: (
    <>
      <strong>Low:</strong> Open access for all Trusted Zone computers. All resource sharing is
      permitted.
    </>
  ),
};

// ── Slider widget ─────────────────────────────────────────────────────────────
function ZoneSlider({
  level,
  onChange,
}: {
  level: SecurityLevel;
  onChange: (l: SecurityLevel) => void;
}) {
  const levels: SecurityLevel[] = ['high', 'medium', 'low'];
  return (
    <div className="za-slider-widget">
      <div className="za-slider-labels">
        {levels.map((l) => (
          <button
            key={l}
            className={`za-slider-lbl${level === l ? ' za-lbl-active' : ' za-lbl-dim'}`}
            onClick={() => onChange(l)}
          >
            {LEVEL_LABEL[l]}
          </button>
        ))}
      </div>
      <div
        className="za-slider-track-area"
        onClick={(e) => {
          // Allow clicking anywhere on the track to set level
          const rect = e.currentTarget.getBoundingClientRect();
          const y = e.clientY - rect.top;
          const h = rect.height;
          onChange(y < h / 3 ? 'high' : y < (2 * h) / 3 ? 'medium' : 'low');
        }}
      >
        <div className="za-track-line" />
        <div className="za-tick za-tick-high" />
        <div className="za-tick za-tick-mid" />
        <div className="za-tick za-tick-low" />
        <div className="za-slider-thumb" style={{ top: THUMB_TOP[level] }} />
      </div>
    </div>
  );
}

// ── Zone security box ─────────────────────────────────────────────────────────
function ZoneBox({
  title,
  level,
  onChange,
  descriptions,
}: {
  title: string;
  level: SecurityLevel;
  onChange: (l: SecurityLevel) => void;
  descriptions: Record<SecurityLevel, JSX.Element>;
}) {
  return (
    <div className="za-zone-box">
      <div className="za-zone-box-title">{title} ──────────</div>
      <div className="za-zone-box-content">
        <ZoneSlider level={level} onChange={onChange} />
        <div className="za-zone-desc">{descriptions[level]}</div>
      </div>
    </div>
  );
}

// ── Section: Firewall ─────────────────────────────────────────────────────────
function FirewallMain({
  internetLevel,
  onInternetLevel,
  trustedLevel,
  onTrustedLevel,
  onAdvanced,
}: {
  internetLevel: SecurityLevel;
  onInternetLevel: (l: SecurityLevel) => void;
  trustedLevel: SecurityLevel;
  onTrustedLevel: (l: SecurityLevel) => void;
  onAdvanced: () => void;
}) {
  return (
    <div className="za-fw-layout">
      <div className="za-fw-text">
        <p>The firewall protects you from dangerous traffic. It has two Zones.</p>
        <p>Internet Zone: For protection from unknown computers.</p>
        <p>Trusted Zone: For sharing with trusted computers.</p>
        <p>
          The Internet Zone contains all of the computers on the Web by default. Use the Zones tab
          to add computers to the Trusted Zone.
        </p>
        <p>
          For more advanced control of Zones, including networking, privacy controls, and creation
          of a Blocked Zone, choose ZoneAlarm Pro.
        </p>
      </div>
      <div className="za-fw-zones">
        <ZoneBox
          title="Internet Zone Security"
          level={internetLevel}
          onChange={onInternetLevel}
          descriptions={INTERNET_DESC}
        />
        <ZoneBox
          title="Trusted Zone Security"
          level={trustedLevel}
          onChange={onTrustedLevel}
          descriptions={TRUSTED_DESC}
        />
        <div className="za-fw-footer">
          <button className="za-advanced-btn" onClick={onAdvanced}>
            Advanced
          </button>
        </div>
      </div>
    </div>
  );
}

function FirewallZones() {
  return (
    <div>
      <p style={{ fontSize: 9.5, marginBottom: 8 }}>
        Use this tab to specify which computers are in the Trusted Zone. Computers not listed here
        are in the Internet Zone.
      </p>
      <table className="za-zones-table">
        <thead>
          <tr>
            <th>Zone</th>
            <th>Address / Subnet</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Trusted</td>
            <td>192.168.1.0/24</td>
            <td>Local Network</td>
          </tr>
          <tr>
            <td>Trusted</td>
            <td>127.0.0.1</td>
            <td>Loopback</td>
          </tr>
          <tr>
            <td>Blocked</td>
            <td>(none)</td>
            <td>—</td>
          </tr>
        </tbody>
      </table>
      <div className="za-zones-btn-row">
        <button className="za-zones-btn">Add</button>
        <button className="za-zones-btn">Remove</button>
        <button className="za-zones-btn">Edit</button>
      </div>
    </div>
  );
}

// ── Section: Overview ─────────────────────────────────────────────────────────
function OverviewSection({
  active,
  internetLevel,
  trustedLevel,
}: {
  active: boolean;
  internetLevel: SecurityLevel;
  trustedLevel: SecurityLevel;
}) {
  return (
    <div>
      <div className="za-ov-headline">{active ? 'All Systems Active' : 'Firewall Stopped'}</div>
      <div className="za-ov-items">
        <div className="za-ov-item">
          <div className={`za-ov-dot${active ? '' : ' za-dot-red'}`} />
          <span>
            Firewall: <strong>{active ? 'ACTIVE' : 'STOPPED'}</strong>
          </span>
        </div>
        <div className="za-ov-item">
          <div className={`za-ov-dot${active ? '' : ' za-dot-red'}`} />
          <span>
            Internet Zone Security: <strong>{internetLevel.toUpperCase()}</strong>
          </span>
        </div>
        <div className="za-ov-item">
          <div className={`za-ov-dot${active ? '' : ' za-dot-red'}`} />
          <span>
            Trusted Zone Security: <strong>{trustedLevel.toUpperCase()}</strong>
          </span>
        </div>
        <div className="za-ov-item">
          <div className="za-ov-dot" />
          <span>
            Program Control: <strong>ENABLED</strong>
          </span>
        </div>
        <div className="za-ov-item">
          <div className="za-ov-dot" />
          <span>
            E-mail Protection: <strong>ON</strong>
          </span>
        </div>
      </div>
      <div className="za-ov-stat-row">
        <div className="za-ov-stat">
          <span className="za-ov-stat-num">1,247</span>
          <span className="za-ov-stat-lbl">Sessions Protected</span>
        </div>
        <div className="za-ov-stat">
          <span className="za-ov-stat-num">16</span>
          <span className="za-ov-stat-lbl">Intrusions Blocked</span>
        </div>
        <div className="za-ov-stat">
          <span className="za-ov-stat-num">0</span>
          <span className="za-ov-stat-lbl">High Alerts</span>
        </div>
      </div>
    </div>
  );
}

// ── Section: Program Control ──────────────────────────────────────────────────
function ProgramsSection() {
  const programs = [
    { name: 'Internet Explorer', internet: 'Allow', trusted: 'Allow' },
    { name: 'Windows System', internet: 'Allow', trusted: 'Allow' },
    { name: 'Outlook Express', internet: 'Ask', trusted: 'Allow' },
    { name: 'Napster', internet: 'Block', trusted: 'Block' },
    { name: 'Winamp', internet: 'Allow', trusted: 'Allow' },
    { name: 'mIRC', internet: 'Ask', trusted: 'Ask' },
  ];
  const cls = (v: string) =>
    v === 'Allow' ? 'za-pc-allow' : v === 'Block' ? 'za-pc-block' : 'za-pc-ask';
  return (
    <div>
      <table className="za-pc-table">
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Program</th>
            <th>Internet</th>
            <th>Trusted</th>
          </tr>
        </thead>
        <tbody>
          {programs.map((p) => (
            <tr key={p.name}>
              <td>{p.name}</td>
              <td style={{ textAlign: 'center' }}>
                <span className={cls(p.internet)}>{p.internet}</span>
              </td>
              <td style={{ textAlign: 'center' }}>
                <span className={cls(p.trusted)}>{p.trusted}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="za-pc-btn-row">
        <button className="za-pc-btn">Add</button>
        <button className="za-pc-btn">Remove</button>
        <button className="za-pc-btn">Custom...</button>
      </div>
    </div>
  );
}

// ── Section: Alerts & Logs ────────────────────────────────────────────────────
function AlertsSection() {
  const alerts = [
    { time: '4:12 PM', type: 'Blocked', from: '66.249.72.14', prog: 'svchost.exe' },
    { time: '4:08 PM', type: 'Blocked', from: '207.46.230.219', prog: 'iexplore.exe' },
    { time: '3:55 PM', type: 'Blocked', from: '24.17.14.2', prog: 'iexplore.exe' },
    { time: '3:42 PM', type: 'Blocked', from: '64.4.23.145', prog: 'iexplore.exe' },
    { time: '3:39 PM', type: 'Allowed', from: '192.168.1.1', prog: 'msn.exe' },
  ];
  return (
    <div>
      <div className="za-al-summary">
        <div className="za-al-count">
          <span className="za-al-count-num">0</span>
          <span className="za-al-count-lbl">High Alerts</span>
        </div>
        <div className="za-al-count">
          <span className="za-al-count-num">2</span>
          <span className="za-al-count-lbl">Med. Alerts</span>
        </div>
        <div className="za-al-count">
          <span className="za-al-count-num">14</span>
          <span className="za-al-count-lbl">Low Alerts</span>
        </div>
      </div>
      <table className="za-al-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Alert</th>
            <th>Source IP</th>
            <th>Program</th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((a, i) => (
            <tr key={i}>
              <td>{a.time}</td>
              <td
                style={{ color: a.type === 'Blocked' ? '#cc0000' : '#007700', fontWeight: 'bold' }}
              >
                {a.type}
              </td>
              <td>{a.from}</td>
              <td>{a.prog}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Section: E-mail Protection ────────────────────────────────────────────────
function EmailSection() {
  const [opts, setOpts] = useState({ scan: true, scripts: true, alert: true, lock: false });
  const toggle = (k: keyof typeof opts) => setOpts((o) => ({ ...o, [k]: !o[k] }));
  return (
    <div className="za-em-section">
      <div className="za-em-desc">
        ZoneAlarm scans your e-mail for dangerous attachments and scripts that could harm your
        computer.
      </div>
      <div className="za-em-group">
        <label>
          <input type="checkbox" checked={opts.scan} onChange={() => toggle('scan')} /> Scan
          incoming mail attachments
        </label>
        <label>
          <input type="checkbox" checked={opts.scripts} onChange={() => toggle('scripts')} /> Block
          scripts in e-mail
        </label>
        <label>
          <input type="checkbox" checked={opts.alert} onChange={() => toggle('alert')} /> Alert me
          when new e-mail contains suspicious attachments
        </label>
        <label>
          <input type="checkbox" checked={opts.lock} onChange={() => toggle('lock')} /> Lock
          attachments after they are opened
        </label>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function ZonealarmWindow() {
  const [section, setSection] = useState<NavSection>('firewall');
  const [fwTab, setFwTab] = useState<FirewallTab>('main');
  const [active, setActive] = useState(true);
  const [internetLevel, setInternetLevel] = useState<SecurityLevel>('medium');
  const [trustedLevel, setTrustedLevel] = useState<SecurityLevel>('medium');
  const [statusMsg, setStatusMsg] = useState('Microsoft QMgr connecting to Internet.');

  function toggleFirewall() {
    const next = !active;
    setActive(next);
    setStatusMsg(
      next ? 'Microsoft QMgr connecting to Internet.' : 'ZoneAlarm Firewall is disabled.',
    );
  }

  function handleAdvanced() {
    setStatusMsg('Advanced settings require ZoneAlarm Pro.');
    setTimeout(
      () =>
        setStatusMsg(
          active ? 'Microsoft QMgr connecting to Internet.' : 'ZoneAlarm Firewall is disabled.',
        ),
      3000,
    );
  }

  const navItems: { id: NavSection; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'firewall', label: 'Firewall' },
    { id: 'programs', label: 'Program\nControl' },
    { id: 'alerts', label: 'Alerts &\nLogs' },
    { id: 'email', label: 'E-mail\nProtection' },
  ];

  const showTabs = section === 'firewall';

  return (
    <AppWindow
      id="zonealarm-window"
      appId="zonealarm"
      className="zonealarm-window app-window app-window-hidden"
      titleBar={
        <TitleBar
          title="ZoneAlarm"
          icon={
            <img
              src={zonealarmAppConfig.icon}
              alt=""
              style={{ width: 16, height: 16, marginRight: 4 }}
            />
          }
          showMin
          showMax={false}
          showClose
        />
      }
    >
      {/* ── Header banner ── */}
      <div className="za-header">
        <div className="za-logo">
          <div className="za-logo-circle">ZONE</div>
          <div className="za-logo-labs">LABS</div>
        </div>

        <div className="za-traffic">
          <span className="za-internet-label">INTERNET</span>
          <div className="za-traffic-bars">
            <div className="za-traffic-row">
              <span className="za-traffic-lbl">IN</span>
              <div className="za-bar-track">
                <div
                  className={`za-bar-fill${active ? ' active-in' : ''}`}
                  style={active ? undefined : { width: '0%' }}
                />
              </div>
            </div>
            <div className="za-traffic-row">
              <span className="za-traffic-lbl">OUT</span>
              <div className="za-bar-track">
                <div
                  className={`za-bar-fill${active ? ' active-out' : ''}`}
                  style={active ? undefined : { width: '0%' }}
                />
              </div>
            </div>
          </div>
          <button
            className={`za-stop-btn${active ? '' : ' za-btn-start'}`}
            onClick={toggleFirewall}
            title={active ? 'Stop Firewall' : 'Start Firewall'}
          >
            {active ? 'STOP' : 'START'}
          </button>
        </div>

        <div className="za-header-right">
          <div className="za-header-icons">
            <span className="za-hdr-icon" title="Security">
              🔒
            </span>
            <span className="za-hdr-icon" title="Network">
              🖥
            </span>
            <span className="za-hdr-icon" title="Programs">
              📋
            </span>
          </div>
          <span className="za-programs-lbl">PROGRAMS</span>
          <span className={active ? 'za-all-active' : 'za-all-stopped'}>
            {active ? 'All Systems Active' : 'Firewall Stopped'}
          </span>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="za-body">
        <div className="za-nav">
          {navItems.map(({ id, label }) => (
            <button
              key={id}
              className={`za-nav-btn${section === id ? ' za-nav-active' : ''}`}
              onClick={() => setSection(id)}
              style={{ whiteSpace: 'pre-line' }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="za-content">
          <div className="za-content-top">
            <a className="za-help-link" onClick={(e) => e.preventDefault()}>
              ❓ Help
            </a>
            {showTabs && (
              <div className="za-tabs">
                <button
                  className={`za-tab${fwTab === 'main' ? ' za-tab-active' : ''}`}
                  onClick={() => setFwTab('main')}
                >
                  Main
                </button>
                <button
                  className={`za-tab${fwTab === 'zones' ? ' za-tab-active' : ''}`}
                  onClick={() => setFwTab('zones')}
                >
                  Zones
                </button>
              </div>
            )}
          </div>

          <div className="za-content-body">
            {section !== 'overview' && (
              <div className="za-section-title">
                {section === 'firewall'
                  ? 'Firewall'
                  : section === 'programs'
                    ? 'Program Control'
                    : section === 'alerts'
                      ? 'Alerts & Logs'
                      : 'E-mail Protection'}
              </div>
            )}

            {section === 'overview' && (
              <OverviewSection
                active={active}
                internetLevel={internetLevel}
                trustedLevel={trustedLevel}
              />
            )}
            {section === 'firewall' && fwTab === 'main' && (
              <FirewallMain
                internetLevel={internetLevel}
                onInternetLevel={setInternetLevel}
                trustedLevel={trustedLevel}
                onTrustedLevel={setTrustedLevel}
                onAdvanced={handleAdvanced}
              />
            )}
            {section === 'firewall' && fwTab === 'zones' && <FirewallZones />}
            {section === 'programs' && <ProgramsSection />}
            {section === 'alerts' && <AlertsSection />}
            {section === 'email' && <EmailSection />}
          </div>
        </div>
      </div>

      {/* ── Status bar ── */}
      <div className="za-statusbar">
        <span className="za-statusbar-text">{statusMsg}</span>
        <button className="za-statusbar-btn">▸ Hide Text</button>
        <button className="za-statusbar-btn">◀ Reset to Default</button>
      </div>
    </AppWindow>
  );
}
