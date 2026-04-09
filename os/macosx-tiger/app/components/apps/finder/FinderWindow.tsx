'use client';

import React, { useEffect, useState } from 'react';
import { useWindowManager, useOsShell } from '@retro-web/core/context';
import {
  getDrives,
  listDir,
  getParentPath,
  openFileByPath,
  getFileIconPath,
  getAppIcon,
  FINDER_PENDING_PATH_KEY,
  type DirEntry,
} from '../../../fileSystem';
import type { AppConfig } from '@retro-web/core/types/app-config';

const FINDER_ICON = 'apps/finder/finder-icon.png';
const FOLDER_ICON = 'shell/icons/directory.png';
const HD_ICON = 'shell/icons/hard_drive.png';
const DOCS_ICON = 'shell/icons/my_documents.png';
const HOME_PATH = '/Users/zkarpinski';
const DESKTOP_PATH = '/Users/zkarpinski/Desktop';
const DOCS_PATH = '/Users/zkarpinski/Documents';
const APPS_PATH = '/Applications';

export const finderAppConfig: AppConfig = {
  id: 'finder',
  label: 'Finder',
  icon: FINDER_ICON,
  desktop: false,
  taskbarLabel: 'Finder',
};

// ── Sidebar item ─────────────────────────────────────────────────────────────

type SidebarItem = { label: string; path: string; icon: string };

const SIDEBAR_ITEMS: SidebarItem[] = [
  { label: 'Computer', path: '', icon: HD_ICON },
  { label: 'Macintosh HD', path: '/', icon: HD_ICON },
  { label: 'Desktop', path: DESKTOP_PATH, icon: 'shell/icons/desktop_mini.png' },
  { label: 'Home', path: HOME_PATH, icon: DOCS_ICON },
  { label: 'Documents', path: DOCS_PATH, icon: FOLDER_ICON },
  { label: 'Applications', path: APPS_PATH, icon: FOLDER_ICON },
];

// ── Entry icon ────────────────────────────────────────────────────────────────

function getEntryIcon(entry: DirEntry): string {
  if (entry.type === 'app' && entry.appId) return getAppIcon(entry.appId);
  if (entry.type === 'folder') {
    if (entry.path === '/') return HD_ICON;
    if (entry.path === HOME_PATH || entry.path === DOCS_PATH) return DOCS_ICON;
    return FOLDER_ICON;
  }
  return getFileIconPath(entry.name);
}

function getTitle(path: string): string {
  if (path === '') return 'Computer';
  if (path === '/') return 'Macintosh HD';
  const parts = path.split('/').filter(Boolean);
  return parts.pop() ?? path;
}

// ── FinderWindow ──────────────────────────────────────────────────────────────

export function FinderWindow() {
  const [pathHistory, setPathHistory] = useState<string[]>([DESKTOP_PATH]);
  const [histPos, setHistPos] = useState(0);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const { apps, showApp } = useWindowManager();
  const { AppWindow, TitleBar } = useOsShell();
  const [, setFsVersion] = useState(0);

  const currentPath = pathHistory[histPos];
  const isComputer = currentPath === '';
  const items: DirEntry[] = isComputer ? getDrives() : listDir(currentPath);

  const canBack = histPos > 0;
  const canFwd = histPos < pathHistory.length - 1;
  const canUp = currentPath !== '' && currentPath !== '/';

  const displayTitle = getTitle(currentPath);

  // Open to a pending path when the window becomes visible
  useEffect(() => {
    if (!apps.finder?.visible) return;
    try {
      const pending = sessionStorage.getItem(FINDER_PENDING_PATH_KEY);
      if (!pending) return;
      sessionStorage.removeItem(FINDER_PENDING_PATH_KEY);
      setPathHistory([pending]);
      setHistPos(0);
      setSelectedPath(null);
    } catch (_) {}
  }, [apps.finder?.visible]);

  // Listen for FS changes (file created/deleted)
  useEffect(() => {
    const onFsChange = () => setFsVersion((v) => v + 1);
    window.addEventListener('macosx-fs-change', onFsChange);
    return () => window.removeEventListener('macosx-fs-change', onFsChange);
  }, []);

  function navigateTo(path: string) {
    setPathHistory((prev) => [...prev.slice(0, histPos + 1), path]);
    setHistPos((p) => p + 1);
    setSelectedPath(null);
  }

  function goBack() {
    if (!canBack) return;
    setHistPos((p) => p - 1);
    setSelectedPath(null);
  }

  function goForward() {
    if (!canFwd) return;
    setHistPos((p) => p + 1);
    setSelectedPath(null);
  }

  function goUp() {
    if (!canUp) return;
    const parent = getParentPath(currentPath);
    navigateTo(parent || '/');
  }

  function openItem(entry: DirEntry) {
    if (entry.type === 'folder') {
      navigateTo(entry.path);
      return;
    }
    void openFileByPath(entry.path, showApp);
  }

  return (
    <AppWindow
      id="finder-window"
      appId="finder"
      allowResize
      className="finder-window app-window app-window-hidden"
      titleBar={
        <TitleBar
          title={displayTitle}
          icon={<img src={FINDER_ICON} alt="" style={{ width: 16, height: 16 }} />}
          showMin
          showMax
          showClose
        />
      }
    >
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="finder-toolbar">
        <div className="finder-nav-btns">
          <button
            type="button"
            className="finder-nav-btn"
            disabled={!canBack}
            onClick={goBack}
            title="Back"
          >
            ‹
          </button>
          <button
            type="button"
            className="finder-nav-btn"
            disabled={!canFwd}
            onClick={goForward}
            title="Forward"
          >
            ›
          </button>
        </div>
        <button
          type="button"
          className="finder-nav-btn finder-nav-btn--up"
          disabled={!canUp}
          onClick={goUp}
          title="Up"
        >
          ↑
        </button>
        <div className="finder-path-bar">{isComputer ? 'Computer' : currentPath}</div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────── */}
      <div className="finder-body">
        {/* Sidebar */}
        <div className="finder-sidebar">
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.path}
              type="button"
              className={`finder-sidebar-item${currentPath === item.path ? ' active' : ''}`}
              onClick={() => navigateTo(item.path)}
            >
              <img src={item.icon} alt="" className="finder-sidebar-icon" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Content area */}
        <div className="finder-content" onClick={() => setSelectedPath(null)}>
          {items.length === 0 ? (
            <div className="finder-empty">This folder is empty.</div>
          ) : (
            items.map((entry) => (
              <div
                key={entry.path}
                className={`finder-icon${selectedPath === entry.path ? ' selected' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPath(entry.path);
                }}
                onDoubleClick={() => openItem(entry)}
              >
                <img src={getEntryIcon(entry)} alt={entry.name} className="finder-icon__img" />
                <span className="finder-icon__label">{entry.name}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Status bar ──────────────────────────────────────────────────── */}
      <div className="finder-statusbar">
        {selectedPath
          ? (items.find((e) => e.path === selectedPath)?.name ?? '')
          : `${items.length} item${items.length !== 1 ? 's' : ''}`}
      </div>
    </AppWindow>
  );
}
