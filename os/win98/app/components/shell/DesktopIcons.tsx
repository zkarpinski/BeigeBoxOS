'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { AppConfig } from '../../types/app-config';
import { useWindowManager } from '@retro-web/core/context';
import {
  DESKTOP_PATH,
  listDir,
  openFileByPath,
  getFileIconPath,
  type DirEntry,
} from '../../fileSystem';

const FOLDER_ICON = 'shell/icons/directory.png';
const MYCOMPUTER_PENDING_PATH_KEY = 'mycomputer-pending-path';

function DesktopAppIcon({
  app,
  selected,
  onSelect,
  onDeselect,
}: {
  app: AppConfig;
  selected: boolean;
  onSelect: () => void;
  onDeselect: () => void;
}) {
  const { showApp } = useWindowManager();
  const clickCount = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const desktopLabel =
    typeof app.desktop === 'object' ? (app.desktop?.label ?? app.label) : app.label;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    clickCount.current++;
    if (clickCount.current === 1) {
      timer.current = setTimeout(() => {
        clickCount.current = 0;
      }, 350);
    } else {
      if (timer.current) clearTimeout(timer.current);
      clickCount.current = 0;
      showApp(app.id);
      onDeselect();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect();
    clickCount.current++;
    if (clickCount.current === 1) {
      timer.current = setTimeout(() => {
        clickCount.current = 0;
      }, 350);
    } else {
      if (timer.current) clearTimeout(timer.current);
      clickCount.current = 0;
      showApp(app.id);
      onDeselect();
    }
  };

  return (
    <div
      className={`desktop-icon${selected ? ' selected' : ''}`}
      id={`${app.id}-desktop-icon`}
      title={desktopLabel}
      onClick={handleClick}
      onTouchEnd={handleTouchEnd}
    >
      <img src={app.icon} alt={desktopLabel} />
      <span>{desktopLabel}</span>
    </div>
  );
}

function DesktopFsEntryIcon({
  entry,
  selected,
  onSelect,
  onDeselect,
}: {
  entry: DirEntry;
  selected: boolean;
  onSelect: () => void;
  onDeselect: () => void;
}) {
  const { showApp } = useWindowManager();
  const clickCount = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const open = () => {
    if (entry.type === 'file') {
      openFileByPath(entry.path, showApp);
    } else {
      try {
        sessionStorage.setItem(MYCOMPUTER_PENDING_PATH_KEY, entry.path);
      } catch (_) {}
      showApp('mycomputer');
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    clickCount.current++;
    if (clickCount.current === 1) {
      timer.current = setTimeout(() => {
        clickCount.current = 0;
      }, 350);
    } else {
      if (timer.current) clearTimeout(timer.current);
      clickCount.current = 0;
      open();
      onDeselect();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect();
    clickCount.current++;
    if (clickCount.current === 1) {
      timer.current = setTimeout(() => {
        clickCount.current = 0;
      }, 350);
    } else {
      if (timer.current) clearTimeout(timer.current);
      clickCount.current = 0;
      open();
      onDeselect();
    }
  };

  const icon = entry.type === 'folder' ? FOLDER_ICON : getFileIconPath(entry.name, entry.path);

  return (
    <div
      className={`desktop-icon${selected ? ' selected' : ''}`}
      id={`desktop-fs-${entry.path.replace(/\\/g, '-')}`}
      title={entry.name}
      onClick={handleClick}
      onTouchEnd={handleTouchEnd}
    >
      <img src={icon} alt={entry.name} />
      <span>{entry.name}</span>
    </div>
  );
}

type DesktopItem = { type: 'app'; app: AppConfig } | { type: 'fs'; entry: DirEntry };

export function DesktopIcons({ registry }: { registry: AppConfig[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [, setFsVersion] = useState(0);

  useEffect(() => {
    const clearIfOutside = (target: EventTarget | null) => {
      if (!(target as HTMLElement)?.closest?.('.desktop-icon')) {
        setSelectedId(null);
      }
    };
    const onClick = (e: MouseEvent) => clearIfOutside(e.target);
    const onTouchEnd = (e: TouchEvent) => clearIfOutside(e.target);
    document.addEventListener('click', onClick);
    document.addEventListener('touchend', onTouchEnd);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  useEffect(() => {
    const onFsChange = () => setFsVersion((v) => v + 1);
    window.addEventListener('win98-fs-change', onFsChange);
    return () => window.removeEventListener('win98-fs-change', onFsChange);
  }, []);

  const apps = registry.filter((a) => a.desktop !== false && a.desktop !== undefined && a.desktop);
  const myComputer = apps.find((a) => a.id === 'mycomputer');
  const otherApps = apps.filter((a) => a.id !== 'mycomputer');
  const desktopEntries = listDir(DESKTOP_PATH);

  const items: DesktopItem[] = [
    ...(myComputer ? [{ type: 'app' as const, app: myComputer }] : []),
    ...desktopEntries.map((entry) => ({ type: 'fs' as const, entry })),
    ...otherApps.map((app) => ({ type: 'app' as const, app })),
  ];

  return (
    <div id="desktop-icons">
      {items.map((item) =>
        item.type === 'app' ? (
          <DesktopAppIcon
            key={item.app.id}
            app={item.app}
            selected={selectedId === item.app.id}
            onSelect={() => setSelectedId(item.app.id)}
            onDeselect={() => setSelectedId(null)}
          />
        ) : (
          <DesktopFsEntryIcon
            key={item.entry.path}
            entry={item.entry}
            selected={selectedId === item.entry.path}
            onSelect={() => setSelectedId(item.entry.path)}
            onDeselect={() => setSelectedId(null)}
          />
        ),
      )}
    </div>
  );
}
