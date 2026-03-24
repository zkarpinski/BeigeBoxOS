'use client';

import React, { useState } from 'react';
import type { AppConfig } from '@/app/types/app-config';
import { useOsShell } from '@retro-web/core/context';
import { DisplayApplet, DateTimeApplet, SoundsApplet, MouseApplet, SystemApplet } from './applets';

const ICON = 'apps/controlpanel/controlpanel-icon.png';

export const controlpanelAppConfig: AppConfig = {
  id: 'controlpanel',
  label: 'Control Panel',
  icon: ICON,
  desktop: false,
  startMenu: { path: ['Settings'] },
  taskbarLabel: 'Control Panel',
};

const APPLETS = [
  { id: 'display', label: 'Display', icon: 'apps/controlpanel/display.png' },
  { id: 'datetime', label: 'Date/Time', icon: 'apps/controlpanel/datetime.png' },
  { id: 'sounds', label: 'Sounds', icon: 'apps/controlpanel/sounds.png' },
  { id: 'mouse', label: 'Mouse', icon: 'apps/controlpanel/mouse.png' },
  { id: 'system', label: 'System', icon: 'apps/controlpanel/system.png' },
] as const;

const WALLPAPERS = [
  { id: 'none', label: '(None)', src: null as string | null },
  { id: 'clouds', label: 'Clouds', src: 'shell/images/clouds.png' },
];

type DialogType = 'display' | 'datetime' | 'sounds' | 'mouse' | 'system' | null;

export function ControlPanelWindow() {
  const { AppWindow, TitleBar } = useOsShell();
  const [openDialog, setOpenDialog] = useState<DialogType>(null);
  const [selectedIconId, setSelectedIconId] = useState<string | null>(null);
  const [appliedWallpaper, setAppliedWallpaper] = useState('none');

  function applyWallpaper(id: string) {
    const wp = WALLPAPERS.find((w) => w.id === id);
    if (!wp) return;
    const desktop = document.getElementById('desktop') || document.body;
    if (wp.src) {
      desktop.style.backgroundImage = `url("${wp.src}")`;
      desktop.style.backgroundSize = 'cover';
      desktop.style.backgroundRepeat = 'no-repeat';
      desktop.style.backgroundPosition = 'center';
    } else {
      desktop.style.backgroundImage = '';
      desktop.style.backgroundSize = '';
      desktop.style.backgroundRepeat = '';
      desktop.style.backgroundPosition = '';
    }
    setAppliedWallpaper(id);
  }

  return (
    <>
      <AppWindow
        id="controlpanel-window"
        appId="controlpanel"
        allowResize
        className="controlpanel-window app-window app-window-hidden"
        titleBar={
          <TitleBar
            title="Control Panel"
            icon={
              <img
                src={ICON}
                alt="Settings"
                style={{
                  width: 14,
                  height: 14,
                  marginRight: 4,
                  verticalAlign: 'middle',
                  imageRendering: 'pixelated',
                }}
              />
            }
            showMin
            showMax
            showClose
          />
        }
      >
        <div className="cp-menu-bar">
          <span className="cp-menu-item">
            <u>F</u>ile
          </span>
          <span className="cp-menu-item">
            <u>E</u>dit
          </span>
          <span className="cp-menu-item">
            <u>V</u>iew
          </span>
          <span className="cp-menu-item">
            <u>G</u>o
          </span>
          <span className="cp-menu-item">
            <u>F</u>avorites
          </span>
          <span className="cp-menu-item">
            <u>H</u>elp
          </span>
        </div>
        <div className="cp-toolbar">
          <button className="cp-toolbar-btn" disabled title="Back">
            ◀
          </button>
          <button className="cp-toolbar-btn" disabled title="Forward">
            ▶
          </button>
          <div className="cp-toolbar-sep" />
          <button className="cp-toolbar-btn" disabled title="Up">
            ↑
          </button>
        </div>
        <div className="cp-address-bar">
          <span className="cp-address-label">Address</span>
          <div className="cp-address-field">Control Panel</div>
        </div>
        <div className="cp-icons-area">
          {APPLETS.map((applet) => (
            <div
              key={applet.id}
              className={`cp-applet-icon${selectedIconId === applet.id ? ' selected' : ''}`}
              title={applet.label}
              onClick={() => setSelectedIconId(applet.id)}
              onDoubleClick={() => setOpenDialog(applet.id)}
            >
              <img src={applet.icon} alt={applet.label} className="cp-applet-img" />
              <span className="cp-applet-label">{applet.label}</span>
            </div>
          ))}
        </div>
        <div className="cp-status-bar">
          <div className="cp-status-text">5 object(s)</div>
        </div>
      </AppWindow>

      {openDialog === 'display' && (
        <DisplayApplet
          appliedWallpaper={appliedWallpaper}
          onApply={applyWallpaper}
          onClose={() => setOpenDialog(null)}
        />
      )}
      {openDialog === 'datetime' && <DateTimeApplet onClose={() => setOpenDialog(null)} />}
      {openDialog === 'sounds' && <SoundsApplet onClose={() => setOpenDialog(null)} />}
      {openDialog === 'mouse' && <MouseApplet onClose={() => setOpenDialog(null)} />}
      {openDialog === 'system' && <SystemApplet onClose={() => setOpenDialog(null)} />}
    </>
  );
}
