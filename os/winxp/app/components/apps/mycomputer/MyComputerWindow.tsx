'use client';

import React, { useState, useEffect } from 'react';
import type { AppConfig } from '@/app/types/app-config';
import { useWindowManager, useOsShell } from '@retro-web/core/context';
import {
  getDrives,
  listDir,
  getParentPath,
  openFileByPath,
  getFileIconPath,
  getAppIcon,
  DESKTOP_PATH,
  MY_DOCUMENTS_PATH,
  USER_PROFILE_PATH,
  DOCUMENTS_AND_SETTINGS_PATH,
  type DirEntry,
} from '../../../fileSystem';

const ICON = 'apps/mycomputer/mycomputer-icon.png';
const FOLDER_ICON = 'shell/icons/directory.png';
const HARD_DRIVE_ICON = 'apps/mycomputer/hard_drive.png';
const FLOPPY_ICON = 'apps/mycomputer/floppy.png';
const CD_ICON = 'apps/mycomputer/cd_drive.png';
const MY_DOCS_ICON = 'shell/icons/my_documents.png';
const WINDOWS_ICON = 'apps/mycomputer/program_manager.png';
const DESKTOP_FOLDER_ICON = 'shell/icons/desktop_mini.png';

const MYCOMPUTER_PENDING_PATH_KEY = 'mycomputer-pending-path';

function getEntryIcon(entry: DirEntry, path: string): string {
  if (entry.type === 'folder') {
    if (path === 'C:\\') return HARD_DRIVE_ICON;
    if (path === DOCUMENTS_AND_SETTINGS_PATH) return FOLDER_ICON;
    if (path === USER_PROFILE_PATH) return FOLDER_ICON;
    if (path === DESKTOP_PATH) return DESKTOP_FOLDER_ICON;
    if (path === MY_DOCUMENTS_PATH) return MY_DOCS_ICON;
    if (path === 'C:\\Windows') return WINDOWS_ICON;
    return FOLDER_ICON;
  }
  if (entry.type === 'app' && entry.appId) return getAppIcon(entry.appId);
  return getFileIconPath(entry.name, entry.path);
}

function getTitle(path: string): string {
  if (!path) return 'My Computer';
  if (path === 'C:\\') return 'Local Disk (C:)';
  if (path === 'A:\\') return '3½ Floppy (A:)';
  if (path === 'D:\\') return 'CD-ROM Drive (D:)';
  const name = path.split('\\').pop();
  return name ?? path;
}

export const mycomputerAppConfig: AppConfig = {
  id: 'mycomputer',
  label: 'My Computer',
  icon: ICON,
  desktop: true,
  startMenu: false,
  taskbarLabel: 'My Computer',
};

export function MyComputerWindow() {
  const [pathHistory, setPathHistory] = useState<string[]>(['']);
  const [histPos, setHistPos] = useState(0);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const ctx = useWindowManager();
  const { AppWindow, TitleBar } = useOsShell();

  const currentPath = pathHistory[histPos];
  const isRoot = currentPath === '';
  const items: DirEntry[] = isRoot ? getDrives() : listDir(currentPath);

  const canBack = histPos > 0;
  const canFwd = histPos < pathHistory.length - 1;
  const canUp = currentPath !== '';

  const displayTitle = isRoot ? 'My Computer' : getTitle(currentPath);

  useEffect(() => {
    if (!ctx.apps.mycomputer?.visible) return;
    try {
      const pending = sessionStorage.getItem(MYCOMPUTER_PENDING_PATH_KEY);
      if (!pending) return;
      sessionStorage.removeItem(MYCOMPUTER_PENDING_PATH_KEY);
      setPathHistory((prev) => [...prev.slice(0, histPos + 1), pending]);
      setHistPos((p) => p + 1);
      setSelectedPath(null);
    } catch (_) {}
  }, [ctx.apps.mycomputer?.visible]);

  function navigateToPath(path: string) {
    setPathHistory((prev) => [...prev.slice(0, histPos + 1), path]);
    setHistPos((p) => p + 1);
    setSelectedPath(null);
  }

  function goUp() {
    if (currentPath === 'C:\\' || currentPath === 'A:\\' || currentPath === 'D:\\') {
      navigateToPath('');
    } else {
      const parent = getParentPath(currentPath);
      navigateToPath(parent);
    }
  }

  function openItem(entry: DirEntry) {
    if (entry.type === 'file' || entry.type === 'app') {
      openFileByPath(entry.path, ctx!.showApp);
      return;
    }
    if (entry.type === 'folder') {
      if (entry.path === 'A:\\' || entry.path === 'D:\\') {
        const drive = entry.path[0];
        void ctx?.openDialog({
          type: 'error',
          title: 'My Computer',
          message: `There is no disk in drive ${drive}.\n\nInsert a disk, and then try again.`,
          buttons: ['OK'],
        });
        return;
      }
      navigateToPath(entry.path);
    }
  }

  return (
    <AppWindow
      id="mycomputer-window"
      appId="mycomputer"
      allowResize
      className="mycomputer-window app-window app-window-hidden"
      titleBar={
        <TitleBar
          title={displayTitle}
          icon={
            <img
              src={ICON}
              alt=""
              style={{ width: 16, height: 16, marginRight: 4, imageRendering: 'pixelated' }}
            />
          }
          showMin
          showMax
          showClose
        />
      }
    >
      <div className="mc-menu-bar">
        <span className="mc-menu-item">
          <u>F</u>ile
        </span>
        <span className="mc-menu-item">
          <u>E</u>dit
        </span>
        <span className="mc-menu-item">
          <u>V</u>iew
        </span>
        <span className="mc-menu-item">
          <u>G</u>o
        </span>
        <span className="mc-menu-item">
          F<u>a</u>vorites
        </span>
        <span className="mc-menu-item">
          <u>H</u>elp
        </span>
      </div>
      <div className="mc-toolbar">
        <button
          className="mc-tb-btn"
          disabled={!canBack}
          onClick={() => {
            setHistPos((p) => p - 1);
            setSelectedPath(null);
          }}
          title="Back"
        >
          <span className="mc-tb-icon">←</span>
          <span className="mc-tb-label">Back</span>
        </button>
        <button
          className="mc-tb-btn"
          disabled={!canFwd}
          onClick={() => {
            setHistPos((p) => p + 1);
            setSelectedPath(null);
          }}
          title="Forward"
        >
          <span className="mc-tb-icon">→</span>
          <span className="mc-tb-label">Forward</span>
        </button>
        <div className="mc-tb-sep" />
        <button className="mc-tb-btn" disabled={!canUp} onClick={goUp} title="Up">
          <span className="mc-tb-icon">↑</span>
          <span className="mc-tb-label">Up</span>
        </button>
      </div>
      <div className="mc-address-bar">
        <span className="mc-address-label">Address</span>
        <div className="mc-address-field">{isRoot ? 'My Computer' : currentPath}</div>
      </div>
      <div className="mc-content" onClick={() => setSelectedPath(null)}>
        {items.length === 0 ? (
          <div style={{ padding: '12px', fontSize: '11px', color: '#666' }}>
            This folder is empty.
          </div>
        ) : (
          items.map((entry) => (
            <div
              key={entry.path}
              className={`mc-icon${selectedPath === entry.path ? ' selected' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPath(entry.path);
              }}
              onDoubleClick={() => openItem(entry)}
            >
              <img src={getEntryIcon(entry, entry.path)} alt={entry.name} />
              <div className="mc-icon-label">{entry.name}</div>
            </div>
          ))
        )}
      </div>
      <div className="mc-status-bar">
        <div className="mc-status-text">
          {selectedPath
            ? (items.find((e) => e.path === selectedPath)?.name ?? '')
            : `${items.length} object(s)`}
        </div>
      </div>
    </AppWindow>
  );
}
