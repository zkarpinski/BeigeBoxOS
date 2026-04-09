'use client';

import React, { useEffect, useState } from 'react';
import { useWindowManager } from '@retro-web/core/context';
import {
  DESKTOP_PATH,
  listDir,
  openFileByPath,
  getFileIconPath,
  getAppIcon,
  FINDER_PENDING_PATH_KEY,
  type DirEntry,
} from '../../fileSystem';

const FOLDER_ICON = 'shell/icons/directory.png';

export function MacDesktopIcons() {
  const { showApp, focusApp, isAppVisible, isMinimized } = useWindowManager();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [, setFsVersion] = useState(0);

  // Re-render when the FS changes
  useEffect(() => {
    const onFsChange = () => setFsVersion((v) => v + 1);
    window.addEventListener('macosx-fs-change', onFsChange);
    return () => window.removeEventListener('macosx-fs-change', onFsChange);
  }, []);

  // Deselect on click outside
  useEffect(() => {
    const onClear = (e: MouseEvent) => {
      if (!(e.target as HTMLElement)?.closest?.('.mac-desktop-icon')) setSelectedId(null);
    };
    document.addEventListener('click', onClear);
    return () => document.removeEventListener('click', onClear);
  }, []);

  const desktopEntries = listDir(DESKTOP_PATH);

  function openEntry(entry: DirEntry) {
    if (entry.type === 'file') {
      void openFileByPath(entry.path, showApp);
      return;
    }
    if (entry.type === 'app' && entry.appId) {
      if (isAppVisible(entry.appId) && !isMinimized(entry.appId)) {
        focusApp(entry.appId);
      } else {
        showApp(entry.appId);
      }
      return;
    }
    // Folder → open Finder at that path
    try {
      sessionStorage.setItem(FINDER_PENDING_PATH_KEY, entry.path);
    } catch (_) {}
    if (isAppVisible('finder') && !isMinimized('finder')) {
      focusApp('finder');
    } else {
      showApp('finder');
    }
  }

  function getIcon(entry: DirEntry): string {
    if (entry.type === 'app' && entry.appId) return getAppIcon(entry.appId);
    if (entry.type === 'folder') return FOLDER_ICON;
    return getFileIconPath(entry.name);
  }

  return (
    <div id="desktop-icons">
      {desktopEntries.map((entry) => (
        <div
          key={entry.path}
          className={`mac-desktop-icon${selectedId === entry.path ? ' selected' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedId(entry.path);
          }}
          onDoubleClick={() => openEntry(entry)}
          title={entry.name}
        >
          <img src={getIcon(entry)} alt="" draggable={false} />
          <span className="mac-desktop-icon__label">{entry.name}</span>
        </div>
      ))}
    </div>
  );
}
