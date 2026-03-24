'use client';

import { useEffect, useMemo, useState } from 'react';
import type { AppConfig } from '@retro-web/core/types/app-config';
import { useWindowManager } from '@retro-web/core/context';
const FOLDER_ICON = '/karpos/folder-icon.png';

export type KarposApplicationsMenuProps = {
  registry: AppConfig[];
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
};

function hasStartMenu(sm: AppConfig['startMenu']): sm is { path: string[]; label?: string } {
  return !!sm && typeof sm === 'object';
}

function displayLabel(app: AppConfig): string {
  if (hasStartMenu(app.startMenu)) {
    return app.startMenu.label ?? app.label;
  }
  return app.label;
}

/**
 * Root grid: `startMenu.path` has a single segment (e.g. ['Programs'], ['Settings']).
 * Folder groups: path has 2+ segments — grouped by path.slice(1).join(' / ').
 */
export function groupKarposApplications(registry: AppConfig[]) {
  const root: AppConfig[] = [];
  const folders = new Map<string, AppConfig[]>();

  for (const app of registry) {
    if (app.startMenu === false) continue;
    if (!hasStartMenu(app.startMenu)) continue;
    const p = app.startMenu.path;
    if (p.length === 1) {
      root.push(app);
    } else {
      const key = p.slice(1).join(' / ');
      if (!folders.has(key)) folders.set(key, []);
      folders.get(key)!.push(app);
    }
  }

  const sortByLabel = (a: AppConfig, b: AppConfig) =>
    displayLabel(a).localeCompare(displayLabel(b), undefined, { sensitivity: 'base' });

  root.sort(sortByLabel);
  folders.forEach((apps) => apps.sort(sortByLabel));
  const folderKeys = Array.from(folders.keys()).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' }),
  );

  return { root, folders, folderKeys };
}

export function KarposApplicationsMenu({
  registry,
  menuOpen,
  setMenuOpen,
}: KarposApplicationsMenuProps) {
  const { showApp, setRunDialogOpen, setShutdownOpen } = useWindowManager();
  const [openFolder, setOpenFolder] = useState<string | null>(null);

  const { root, folders, folderKeys } = useMemo(
    () => groupKarposApplications(registry),
    [registry],
  );

  useEffect(() => {
    if (!menuOpen) setOpenFolder(null);
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (openFolder) setOpenFolder(null);
        else setMenuOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen, openFolder, setMenuOpen]);

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

  const folderApps = openFolder ? (folders.get(openFolder) ?? []) : [];

  return (
    <div
      id="start-menu"
      className={`karpos-applications-menu ${menuOpen ? '' : 'hidden'}`}
      role="presentation"
      aria-hidden={!menuOpen}
    >
      <div className="karpos-apps-backdrop" aria-hidden="true" onClick={() => setMenuOpen(false)} />
      <div
        className="karpos-apps-panel"
        role="dialog"
        aria-modal="true"
        aria-label={openFolder ? `Folder: ${openFolder}` : 'Applications'}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="karpos-apps-panel-tail" aria-hidden="true" />

        <div className={`karpos-apps-header ${openFolder ? 'karpos-apps-header--folder' : ''}`}>
          {openFolder ? (
            <button type="button" className="karpos-apps-back" onClick={() => setOpenFolder(null)}>
              ‹ Applications
            </button>
          ) : null}
          <h2 className="karpos-apps-title">{openFolder ?? 'Applications'}</h2>
        </div>

        <div className="karpos-apps-scroll">
          {!openFolder ? (
            <div className="karpos-apps-grid">
              {folderKeys.map((key) => (
                <button
                  key={key}
                  type="button"
                  className="karpos-app-tile karpos-app-tile-folder"
                  onClick={() => setOpenFolder(key)}
                >
                  <span className="karpos-app-squircle karpos-app-squircle-folder">
                    <img src={FOLDER_ICON} alt="" className="karpos-app-icon-img" />
                  </span>
                  <span className="karpos-app-label">{key}</span>
                </button>
              ))}
              {root.map((app) => (
                <button
                  key={app.id}
                  type="button"
                  id={`start-menu-${app.id}`}
                  className="karpos-app-tile"
                  onClick={() => openApp(app.id)}
                >
                  <span className="karpos-app-squircle">
                    <img src={app.icon} alt="" className="karpos-app-icon-img" />
                  </span>
                  <span className="karpos-app-label">{displayLabel(app)}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="karpos-apps-grid">
              {folderApps.map((app) => (
                <button
                  key={app.id}
                  type="button"
                  id={`start-menu-${app.id}`}
                  className="karpos-app-tile"
                  onClick={() => openApp(app.id)}
                >
                  <span className="karpos-app-squircle">
                    <img src={app.icon} alt="" className="karpos-app-icon-img" />
                  </span>
                  <span className="karpos-app-label">{displayLabel(app)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="karpos-apps-footer">
          <button
            type="button"
            className="karpos-apps-footer-btn"
            id="start-run"
            onClick={() => {
              setMenuOpen(false);
              setRunDialogOpen(true);
            }}
          >
            Run…
          </button>
          <button
            type="button"
            className="karpos-apps-footer-btn"
            id="start-shutdown"
            onClick={() => {
              setMenuOpen(false);
              setShutdownOpen(true);
            }}
          >
            Shut Down…
          </button>
        </div>
      </div>
    </div>
  );
}
