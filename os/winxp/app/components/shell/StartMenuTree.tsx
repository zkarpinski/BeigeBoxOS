'use client';

import React, { useState } from 'react';
import type { AppConfig } from '../../types/app-config';
import { useWindowManager } from '@retro-web/core/context';
import { MY_DOCUMENTS_PATH } from '../../fileSystem';

function hasStartMenu(sm: AppConfig['startMenu']): sm is { path: string[]; label?: string } {
  return !!sm && typeof sm === 'object';
}

function itemsFor(registry: AppConfig[], ...path: string[]) {
  return registry.filter(
    (a) => hasStartMenu(a.startMenu) && JSON.stringify(a.startMenu.path) === JSON.stringify(path),
  );
}

/** Pinned item at the top of the left panel (Internet / E-mail slots) */
function PinnedItem({ app, onClick }: { app: AppConfig; onClick: (id: string) => void }) {
  return (
    <div className="xp-sm-pinned" onClick={() => onClick(app.id)}>
      <img src={app.icon} className="xp-sm-icon-lg" alt="" width={32} height={32} />
      <div className="xp-sm-pinned-text">
        <span className="xp-sm-pinned-name">{app.label}</span>
      </div>
    </div>
  );
}

/** Regular MFU / program item */
function AppItem({
  app,
  onClick,
  small,
}: {
  app: AppConfig;
  onClick: (id: string) => void;
  small?: boolean;
}) {
  const smLabel = hasStartMenu(app.startMenu) ? (app.startMenu.label ?? app.label) : app.label;
  return (
    <div
      className={`xp-sm-item${small ? ' xp-sm-item-sm' : ''}`}
      id={`start-menu-${app.id}`}
      onClick={() => onClick(app.id)}
    >
      <img
        src={app.icon}
        className={small ? 'xp-sm-icon-sm' : 'xp-sm-icon'}
        alt=""
        width={small ? 16 : 24}
        height={small ? 16 : 24}
      />
      <span className="xp-sm-label">{smLabel}</span>
    </div>
  );
}

/** Folder item with submenu (for All Programs tree) */
function FolderItem({
  label,
  icon,
  children,
}: {
  label: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="xp-sm-item xp-sm-item-sm xp-sm-has-sub">
      <img src={icon} className="xp-sm-icon-sm" alt="" width={16} height={16} />
      <span className="xp-sm-label">{label}</span>
      <span className="xp-sm-arrow">▶</span>
      <div className="xp-sm-submenu">{children}</div>
    </div>
  );
}

/** Right-panel link row */
function RightItem({
  icon,
  label,
  id,
  arrow,
}: {
  icon: string;
  label: string;
  id?: string;
  arrow?: boolean;
}) {
  return (
    <div className="xp-sm-right-item" id={id}>
      <img src={icon} className="xp-sm-icon-sm" alt="" width={16} height={16} />
      <span className="xp-sm-label">{label}</span>
      {arrow && <span className="xp-sm-arrow">▶</span>}
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
  const [allPrograms, setAllPrograms] = useState(false);

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
    setAllPrograms(false);
  };

  // Reset All Programs when menu closes
  React.useEffect(() => {
    if (!menuOpen) setAllPrograms(false);
  }, [menuOpen]);

  // Pinned slots (Internet = IE6, E-mail = AIM)
  const internetApp = registry.find((a) => a.id === 'ie6') ?? registry.find((a) => a.id === 'ie5');
  const emailApp = registry.find((a) => a.id === 'aim');

  // MFU: apps with startMenu defined, excluding pinned + right-panel system apps
  const systemIds = new Set(['mycomputer', 'controlpanel', 'taskmanager']);
  const pinnedIds = new Set([internetApp?.id, emailApp?.id].filter(Boolean) as string[]);
  const mfuApps = registry
    .filter((a) => hasStartMenu(a.startMenu) && !systemIds.has(a.id) && !pinnedIds.has(a.id))
    .slice(0, 8);

  // Right panel click handler
  const handleRightClick = (e: React.MouseEvent) => {
    const item = (e.target as HTMLElement).closest('.xp-sm-right-item') as HTMLElement | null;
    if (!item?.id) return;
    if (item.id === 'xp-right-mycomputer') {
      openApp('mycomputer');
      return;
    }
    if (item.id === 'xp-right-mydocs') {
      try {
        sessionStorage.setItem('mycomputer-pending-path', MY_DOCUMENTS_PATH);
      } catch {
        /* ignore */
      }
      openApp('mycomputer');
      return;
    }
    if (item.id === 'xp-right-mymusic') {
      openApp('winamp');
      return;
    }
    if (item.id === 'xp-right-controlpanel') {
      openApp('controlpanel');
      return;
    }
    if (item.id === 'xp-right-run') {
      setMenuOpen(false);
      setRunDialogOpen(true);
      return;
    }
    if (item.id === 'xp-right-shutdown') {
      setMenuOpen(false);
      setShutdownOpen(true);
      return;
    }
  };

  if (!menuOpen) return null;

  return (
    <div id="xp-start-menu" onClick={(e) => e.stopPropagation()}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="xp-sm-header">
        <div className="xp-sm-avatar" aria-hidden="true">
          <svg width="36" height="36" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="18" fill="rgba(255,255,255,0.15)" />
            <circle cx="18" cy="13" r="7" fill="#bfd2e8" />
            <ellipse cx="18" cy="32" rx="12" ry="9" fill="#bfd2e8" />
          </svg>
        </div>
        <span className="xp-sm-username">User</span>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="xp-sm-body">
        {/* Left panel — always visible; All Programs opens a fly-out (XP-style) */}
        <div className="xp-sm-left">
          {(internetApp || emailApp) && (
            <div className="xp-sm-pinned-zone">
              {internetApp && <PinnedItem app={internetApp} onClick={openApp} />}
              {emailApp && <PinnedItem app={emailApp} onClick={openApp} />}
            </div>
          )}

          {mfuApps.length > 0 && <div className="xp-sm-separator" />}

          <div className="xp-sm-mfu">
            {mfuApps.map((app) => (
              <AppItem key={app.id} app={app} onClick={openApp} />
            ))}
          </div>

          <div
            className={`xp-sm-all-programs-btn${allPrograms ? ' is-open' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              queueMicrotask(() => setAllPrograms((v) => !v));
            }}
          >
            <img src="shell/icons/directory.png" alt="" width={16} height={16} />
            <span>All Programs</span>
            <span className="xp-sm-arrow" style={{ marginLeft: 'auto' }}>
              ▶
            </span>
          </div>
        </div>

        {/* Right panel */}
        <div className="xp-sm-right" onClick={handleRightClick}>
          <RightItem
            id="xp-right-mydocs"
            icon="shell/icons/my_documents.png"
            label="My Documents"
          />
          <RightItem icon="shell/icons/my_documents.png" label="My Recent Documents" arrow />
          <RightItem icon="shell/icons/my_documents.png" label="My Pictures" />
          <RightItem id="xp-right-mymusic" icon="shell/icons/my_documents.png" label="My Music" />
          <RightItem
            id="xp-right-mycomputer"
            icon="apps/mycomputer/mycomputer-icon.png"
            label="My Computer"
          />
          <RightItem icon="shell/icons/network_neighborhood.png" label="My Network Places" />
          <div className="xp-sm-right-separator" />
          <RightItem
            id="xp-right-controlpanel"
            icon="apps/controlpanel/controlpanel-icon.png"
            label="Control Panel"
          />
          <RightItem icon="shell/icons/my_documents.png" label="Printers and Faxes" />
          <div className="xp-sm-right-separator" />
          <RightItem icon="shell/icons/help.png" label="Help and Support" />
          <RightItem id="xp-right-search" icon="shell/icons/search.png" label="Search" />
          <RightItem id="xp-right-run" icon="shell/icons/run.png" label="Run..." />
        </div>

        {/* All Programs fly-out — cascades to the right of the white column (real XP) */}
        {allPrograms && (
          <div
            id="xp-sm-all-programs-flyout"
            className="xp-sm-all-programs-flyout"
            role="menu"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="xp-sm-programs-tree">
              {itemsFor(registry, 'Programs', 'Accessories').length > 0 && (
                <FolderItem label="Accessories" icon="shell/icons/directory.png">
                  {itemsFor(registry, 'Programs', 'Accessories').map((a) => (
                    <AppItem key={a.id} app={a} onClick={openApp} small />
                  ))}
                </FolderItem>
              )}
              {itemsFor(registry, 'Programs', 'Entertainment').length > 0 && (
                <FolderItem label="Entertainment" icon="shell/icons/directory.png">
                  {itemsFor(registry, 'Programs', 'Entertainment').map((a) => (
                    <AppItem key={a.id} app={a} onClick={openApp} small />
                  ))}
                </FolderItem>
              )}
              {itemsFor(registry, 'Programs', 'Games').length > 0 && (
                <FolderItem label="Games" icon="shell/icons/directory.png">
                  {itemsFor(registry, 'Programs', 'Games').map((a) => (
                    <AppItem key={a.id} app={a} onClick={openApp} small />
                  ))}
                </FolderItem>
              )}
              {itemsFor(registry, 'Programs', 'Internet').length > 0 && (
                <FolderItem label="Internet" icon="shell/icons/ie.png">
                  {itemsFor(registry, 'Programs', 'Internet').map((a) => (
                    <AppItem key={a.id} app={a} onClick={openApp} small />
                  ))}
                </FolderItem>
              )}
              {itemsFor(registry, 'Programs', 'System Tools').length > 0 && (
                <FolderItem label="System Tools" icon="shell/icons/system_tools.png">
                  {itemsFor(registry, 'Programs', 'System Tools').map((a) => (
                    <AppItem key={a.id} app={a} onClick={openApp} small />
                  ))}
                </FolderItem>
              )}
              {itemsFor(registry, 'Programs').map((a) => (
                <AppItem key={a.id} app={a} onClick={openApp} small />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <div className="xp-sm-footer">
        <button className="xp-sm-footer-btn" onClick={() => setMenuOpen(false)}>
          <img src="shell/icons/shut_down.png" alt="" width={22} height={22} />
          <span>Log Off</span>
        </button>
        <button
          className="xp-sm-footer-btn"
          onClick={() => {
            setMenuOpen(false);
            setShutdownOpen(true);
          }}
        >
          <img src="shell/icons/shut_down.png" alt="" width={22} height={22} />
          <span>Turn Off Computer</span>
        </button>
      </div>
    </div>
  );
}
