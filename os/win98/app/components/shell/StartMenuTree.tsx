'use client';

import React from 'react';
import type { AppConfig } from '../../types/app-config';
import { useWindowManager } from '@retro-web/core/context';

function hasStartMenu(sm: AppConfig['startMenu']): sm is { path: string[]; label?: string } {
  return !!sm && typeof sm === 'object';
}

function itemsFor(registry: AppConfig[], ...path: string[]) {
  return registry.filter(
    (a) => hasStartMenu(a.startMenu) && JSON.stringify(a.startMenu.path) === JSON.stringify(path),
  );
}

function AppItem({ app, onClick }: { app: AppConfig; onClick: (id: string) => void }) {
  const smLabel = hasStartMenu(app.startMenu) ? (app.startMenu.label ?? app.label) : app.label;
  return (
    <div className="start-menu-item" id={`start-menu-${app.id}`} onClick={() => onClick(app.id)}>
      <img src={app.icon} className="sm-icon" alt="" width={24} height={24} />
      <span className="sm-label">{smLabel}</span>
    </div>
  );
}

export function StartMenuTree({
  registry,
  menuOpen,
  setMenuOpen,
}: {
  registry: AppConfig[];
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
}) {
  const { showApp, setRunDialogOpen, setShutdownOpen } = useWindowManager();

  const openApp = (id: string) => {
    if (id === 'word') {
      try {
        sessionStorage.setItem('word-open-new-doc', '1');
      } catch {
        /* ignore */
      }
    }
    showApp(id);
    setMenuOpen(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    const item = (e.target as HTMLElement).closest('.start-menu-item') as HTMLElement | null;
    if (!item || !item.id) return;

    if (item.id === 'start-run') {
      setMenuOpen(false);
      setRunDialogOpen(true);
      return;
    }
    if (item.id === 'start-windows-update') {
      setMenuOpen(false);
      (window as unknown as { WindowsUpdate97?: { open: () => void } }).WindowsUpdate97?.open();
      return;
    }
    if (item.id === 'start-shutdown') {
      setMenuOpen(false);
      setShutdownOpen(true);
      return;
    }
    // Registry app items
    const appId = item.id.replace(/^start-menu-/, '');
    if (registry.find((a) => a.id === appId)) {
      openApp(appId);
    }
  };

  return (
    <div id="start-menu" className={menuOpen ? '' : 'hidden'} onClick={handleClick}>
      <div className="start-menu-sidebar">
        <span className="start-menu-title">
          <span className="sm-windows">Windows</span>
          <span className="sm-version">98</span>
        </span>
      </div>
      <div className="start-menu-items">
        {/* Windows Update — static shell item */}
        <div className="start-menu-item" id="start-windows-update">
          <img src="shell/icons/windows_update.png" className="sm-icon" alt="" />
          <span className="sm-label">Windows Update</span>
        </div>

        <div className="start-menu-divider" />

        {/* Programs */}
        <div className="start-menu-item has-submenu">
          <img src="shell/icons/directory.png" className="sm-icon" alt="" />
          <span className="sm-label">Programs</span>
          <span className="sm-arrow">▶</span>
          <div className="submenu">
            {/* Accessories */}
            <div className="start-menu-item has-submenu">
              <img src="shell/icons/directory.png" className="sm-icon" alt="" />
              <span className="sm-label">Accessories</span>
              <span className="sm-arrow">▶</span>
              <div className="submenu">
                {itemsFor(registry, 'Programs', 'Accessories').map((a) => (
                  <AppItem key={a.id} app={a} onClick={openApp} />
                ))}
              </div>
            </div>

            {/* Entertainment */}
            <div className="start-menu-item has-submenu">
              <img src="shell/icons/directory.png" className="sm-icon" alt="" />
              <span className="sm-label">Entertainment</span>
              <span className="sm-arrow">▶</span>
              <div className="submenu">
                {itemsFor(registry, 'Programs', 'Entertainment').map((a) => (
                  <AppItem key={a.id} app={a} onClick={openApp} />
                ))}
              </div>
            </div>

            {/* Games */}
            <div className="start-menu-item has-submenu">
              <img src="shell/icons/directory.png" className="sm-icon" alt="" />
              <span className="sm-label">Games</span>
              <span className="sm-arrow">▶</span>
              <div className="submenu">
                {itemsFor(registry, 'Programs', 'Games').map((a) => (
                  <AppItem key={a.id} app={a} onClick={openApp} />
                ))}
              </div>
            </div>

            {/* Internet */}
            <div className="start-menu-item has-submenu">
              <img src="shell/icons/ie.png" className="sm-icon" alt="" />
              <span className="sm-label">Internet</span>
              <span className="sm-arrow">▶</span>
              <div className="submenu">
                {itemsFor(registry, 'Programs', 'Internet').map((a) => (
                  <AppItem key={a.id} app={a} onClick={openApp} />
                ))}
              </div>
            </div>

            {/* System Tools */}
            <div className="start-menu-item has-submenu">
              <img src="shell/icons/system_tools.png" className="sm-icon" alt="" />
              <span className="sm-label">System Tools</span>
              <span className="sm-arrow">▶</span>
              <div className="submenu">
                {itemsFor(registry, 'Programs', 'System Tools').map((a) => (
                  <AppItem key={a.id} app={a} onClick={openApp} />
                ))}
              </div>
            </div>

            <div className="start-menu-divider" />

            {/* Direct Programs items */}
            {itemsFor(registry, 'Programs').map((a) => (
              <AppItem key={a.id} app={a} onClick={openApp} />
            ))}
          </div>
        </div>

        {/* Documents — static shell item */}
        <div className="start-menu-item">
          <img src="shell/icons/my_documents.png" className="sm-icon" alt="" />
          <span className="sm-label">Documents</span>
          <span className="sm-arrow">▶</span>
        </div>

        {/* Settings */}
        <div className="start-menu-item has-submenu">
          <img src="apps/controlpanel/controlpanel-icon.png" className="sm-icon" alt="" />
          <span className="sm-label">Settings</span>
          <span className="sm-arrow">▶</span>
          <div className="submenu">
            {itemsFor(registry, 'Settings').map((a) => (
              <AppItem key={a.id} app={a} onClick={openApp} />
            ))}
          </div>
        </div>

        {/* Find — static shell item */}
        <div className="start-menu-item">
          <img src="shell/icons/search.png" className="sm-icon" alt="" />
          <span className="sm-label">Find</span>
          <span className="sm-arrow">▶</span>
        </div>

        {/* Help — static shell item */}
        <div className="start-menu-item">
          <img src="shell/icons/help.png" className="sm-icon" alt="" />
          <span className="sm-label">Help</span>
        </div>

        {/* Run — static shell item */}
        <div className="start-menu-item" id="start-run">
          <img src="shell/icons/run.png" className="sm-icon" alt="" />
          <span className="sm-label">Run...</span>
        </div>

        <div className="start-menu-divider" />

        {/* Shut Down — static shell item */}
        <div className="start-menu-item" id="start-shutdown">
          <img src="shell/icons/shut_down.png" className="sm-icon" alt="" />
          <span className="sm-label">Shut Down...</span>
        </div>
      </div>
    </div>
  );
}
