'use client';

import React, { useEffect, useState } from 'react';
import type { AppConfig } from '@retro-web/core/types/app-config';
import { useWindowManager } from '@retro-web/core/context';
import {
  DESKTOP_PATH,
  listDir,
  openFileByPath,
  getFileIconPath,
  getAppIcon,
  createFolder,
  writeFile,
  renamePath,
  getNode,
  type DirEntry,
} from '../../fileSystem';
import { karposNeoTileColor } from './karposNeoTileColors';
import { KARPOS_DESKTOP_LINKS, type KarposDesktopLink } from './karposDesktopLinks';

const FOLDER_ICON = '/karpos/folder-icon.png';
const MYCOMPUTER_PENDING_PATH_KEY = 'mycomputer-pending-path';
type OpenHandler = () => void;
type ShowContextMenu = (e: React.MouseEvent, itemId: string, onOpen: OpenHandler) => void;
type SelectHandler = () => void;

type DesktopTileProps = {
  id: string;
  label: string;
  icon: string;
  selected: boolean;
  tileKey: string;
  onSelect: SelectHandler;
  onOpen: OpenHandler;
  onShowContextMenu: ShowContextMenu;
  contextItemId: string;
  isRenaming?: boolean;
  onRenameCommit?: (newName: string) => void;
  onRenameCancel?: () => void;
};

function DesktopTile({
  id,
  label,
  icon,
  selected,
  tileKey,
  onSelect,
  onOpen,
  onShowContextMenu,
  contextItemId,
  isRenaming,
  onRenameCommit,
  onRenameCancel,
}: DesktopTileProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    onOpen();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect();
    onOpen();
  };

  const [editValue, setEditValue] = useState(label);

  useEffect(() => {
    if (isRenaming) {
      setEditValue(label);
    }
  }, [isRenaming, label]);

  const handleContextMenu = (e: React.MouseEvent) => {
    onShowContextMenu(e, contextItemId, onOpen);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onRenameCommit?.(editValue);
    } else if (e.key === 'Escape') {
      onRenameCancel?.();
    }
  };

  return (
    <div
      className={`desktop-icon karpos-desktop-tile${selected ? ' selected' : ''}`}
      id={id}
      style={{ backgroundColor: karposNeoTileColor(tileKey) }}
      title={label}
      onClick={handleClick}
      onTouchEnd={handleTouchEnd}
      onContextMenu={handleContextMenu}
    >
      <div className="karpos-desktop-tile__img-wrap">
        <img
          className="karpos-desktop-tile__img"
          src={icon}
          alt=""
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
        />
      </div>
      {isRenaming ? (
        <input
          className="karpos-desktop-tile__label karpos-desktop-tile__rename-input"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => onRenameCommit?.(editValue)}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          autoFocus
        />
      ) : (
        <span className="karpos-desktop-tile__label">{label}</span>
      )}
    </div>
  );
}

function DesktopAppIcon({
  app,
  selected,
  onSelect,
  onShowContextMenu,
}: {
  app: AppConfig;
  selected: boolean;
  onSelect: () => void;
  onShowContextMenu: ShowContextMenu;
}) {
  const { showApp } = useWindowManager();

  const desktopLabel =
    typeof app.desktop === 'object' ? (app.desktop?.label ?? app.label) : app.label;
  const onOpen = () => showApp(app.id);

  const tileKey = `desktop:app:${app.id}`;

  return (
    <DesktopTile
      id={`${app.id}-desktop-icon`}
      label={desktopLabel}
      icon={app.icon}
      selected={selected}
      tileKey={tileKey}
      onSelect={onSelect}
      onOpen={onOpen}
      onShowContextMenu={onShowContextMenu}
      contextItemId={app.id}
    />
  );
}

function DesktopUrlIcon({
  link,
  selected,
  onSelect,
  onShowContextMenu,
}: {
  link: KarposDesktopLink;
  selected: boolean;
  onSelect: () => void;
  onShowContextMenu: ShowContextMenu;
}) {
  const onOpen = () => {
    window.open(link.url, '_blank', 'noopener,noreferrer');
  };

  const tileKey = `desktop:link:${link.id}`;

  return (
    <DesktopTile
      id={`desktop-link-${link.id}`}
      label={link.label}
      icon={link.icon}
      selected={selected}
      tileKey={tileKey}
      onSelect={onSelect}
      onOpen={onOpen}
      onShowContextMenu={onShowContextMenu}
      contextItemId={`link:${link.id}`}
    />
  );
}

function DesktopFsEntryIcon({
  entry,
  selected,
  onSelect,
  onShowContextMenu,
  isRenaming,
  onRenameCommit,
  onRenameCancel,
}: {
  entry: DirEntry;
  selected: boolean;
  onSelect: () => void;
  onShowContextMenu: ShowContextMenu;
  isRenaming?: boolean;
  onRenameCommit?: (newName: string) => void;
  onRenameCancel?: () => void;
}) {
  const { showApp } = useWindowManager();

  const onOpen = () => {
    if (entry.type === 'file') {
      void openFileByPath(entry.path, showApp);
    } else if (entry.type === 'app' && entry.appId) {
      showApp(entry.appId);
    } else {
      try {
        sessionStorage.setItem(MYCOMPUTER_PENDING_PATH_KEY, entry.path);
      } catch (_) {}
      showApp('mycomputer');
    }
  };

  const icon =
    entry.type === 'folder'
      ? FOLDER_ICON
      : entry.type === 'app' && entry.appId
        ? getAppIcon(entry.appId)
        : getFileIconPath(entry.name, entry.path);
  const tileKey = `desktop:fs:${entry.path}`;

  return (
    <DesktopTile
      id={`desktop-fs-${entry.path.replace(/[/\\]/g, '-')}`}
      label={entry.name}
      icon={icon}
      selected={selected}
      tileKey={tileKey}
      onSelect={onSelect}
      onOpen={onOpen}
      onShowContextMenu={onShowContextMenu}
      contextItemId={entry.path}
      isRenaming={isRenaming}
      onRenameCommit={onRenameCommit}
      onRenameCancel={onRenameCancel}
    />
  );
}

type DesktopItem =
  | { type: 'app'; app: AppConfig }
  | { type: 'fs'; entry: DirEntry }
  | { type: 'link'; link: KarposDesktopLink };

export function DesktopIcons({ registry }: { registry: AppConfig[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    itemId: string;
    onOpen: OpenHandler;
  } | null>(null);
  const [desktopContextMenu, setDesktopContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [, setFsVersion] = useState(0);

  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.id === 'desktop-icons' ||
        target.closest('.seo-intro') ||
        target === document.body
      ) {
        e.preventDefault();
        setDesktopContextMenu({
          x: Math.min(e.clientX, window.innerWidth - 170),
          y: Math.min(e.clientY, window.innerHeight - 70),
        });
      }
    };
    document.addEventListener('contextmenu', onContextMenu);
    return () => document.removeEventListener('contextmenu', onContextMenu);
  }, []);

  useEffect(() => {
    const clearIfOutside = (target: EventTarget | null) => {
      const el = target as HTMLElement;
      if (!el?.closest?.('.desktop-icon') && !el?.closest?.('.karpos-desktop-context-menu')) {
        // Only clear selection if we are not renaming, or if we clicked outside
        // renaming handles its own blur to commit
        if (!renamingId) {
          setSelectedId(null);
        }
      }
      if (!el?.closest?.('.karpos-desktop-context-menu')) {
        setContextMenu(null);
        setDesktopContextMenu(null);
      }
    };
    const onClick = (e: MouseEvent) => clearIfOutside(e.target);
    const onTouchStart = (e: TouchEvent) => clearIfOutside(e.target);
    document.addEventListener('click', onClick);
    document.addEventListener('touchstart', onTouchStart);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('touchstart', onTouchStart);
    };
  }, [renamingId]);

  useEffect(() => {
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu(null);
        setDesktopContextMenu(null);
      }
    };
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, []);

  useEffect(() => {
    const onFsChange = () => setFsVersion((v) => v + 1);
    window.addEventListener('karpos-fs-change', onFsChange);
    return () => window.removeEventListener('karpos-fs-change', onFsChange);
  }, []);

  /** Virtual Desktop folder contents (files, folders, app shortcuts) plus configured URL tiles. */
  const desktopEntries = listDir(DESKTOP_PATH);

  const items: DesktopItem[] = [
    ...desktopEntries.map((entry) => ({ type: 'fs' as const, entry })),
    ...KARPOS_DESKTOP_LINKS.map((link) => ({ type: 'link' as const, link })),
  ];
  const showContextMenu: ShowContextMenu = (e, itemId, onOpen) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(itemId);
    setContextMenu({
      x: Math.min(e.clientX, window.innerWidth - 170),
      y: Math.min(e.clientY, window.innerHeight - 70),
      itemId,
      onOpen,
    });
  };
  const handleContextOpen = () => {
    if (!contextMenu) return;
    contextMenu.onOpen();
    setContextMenu(null);
  };

  const getUniqueName = (baseName: string, isFolder: boolean) => {
    let newName = baseName;
    let counter = 1;
    while (getNode(`${DESKTOP_PATH}/${newName}`)) {
      if (isFolder) {
        newName = `${baseName} (${counter})`;
      } else {
        const extIdx = baseName.lastIndexOf('.');
        if (extIdx !== -1) {
          newName = `${baseName.slice(0, extIdx)} (${counter})${baseName.slice(extIdx)}`;
        } else {
          newName = `${baseName} (${counter})`;
        }
      }
      counter++;
    }
    return newName;
  };

  const handleNewFolder = () => {
    setDesktopContextMenu(null);
    const folderName = getUniqueName('New Folder', true);
    const newPath = `${DESKTOP_PATH}/${folderName}`;
    createFolder(newPath);
    setFsVersion((v) => v + 1);
    setSelectedId(newPath);
    setRenamingId(newPath);
  };

  const handleNewFile = () => {
    setDesktopContextMenu(null);
    const fileName = getUniqueName('New File.txt', false);
    const newPath = `${DESKTOP_PATH}/${fileName}`;
    writeFile(newPath, '');
    setFsVersion((v) => v + 1);
    setSelectedId(newPath);
    setRenamingId(newPath);
  };

  const handleRenameCommit = (oldPath: string, newName: string) => {
    if (newName && newName.trim() !== '') {
      const parentPath = oldPath.substring(0, oldPath.lastIndexOf('/'));
      const newPath = `${parentPath}/${newName}`;
      if (oldPath !== newPath) {
        renamePath(oldPath, newPath);
        setSelectedId(newPath);
      }
    }
    setRenamingId(null);
    setFsVersion((v) => v + 1);
  };

  const handleRenameCancel = () => {
    setRenamingId(null);
  };

  return (
    <div id="desktop-icons">
      {items.map((item) =>
        item.type === 'app' ? (
          <DesktopAppIcon
            key={item.app.id}
            app={item.app}
            selected={selectedId === item.app.id}
            onSelect={() => setSelectedId(item.app.id)}
            onShowContextMenu={showContextMenu}
          />
        ) : item.type === 'link' ? (
          <DesktopUrlIcon
            key={item.link.id}
            link={item.link}
            selected={selectedId === `link:${item.link.id}`}
            onSelect={() => setSelectedId(`link:${item.link.id}`)}
            onShowContextMenu={showContextMenu}
          />
        ) : (
          <DesktopFsEntryIcon
            key={item.entry.path}
            entry={item.entry}
            selected={selectedId === item.entry.path}
            onSelect={() => setSelectedId(item.entry.path)}
            onShowContextMenu={showContextMenu}
            isRenaming={renamingId === item.entry.path}
            onRenameCommit={(newName) => handleRenameCommit(item.entry.path, newName)}
            onRenameCancel={handleRenameCancel}
          />
        ),
      )}
      {contextMenu ? (
        <div
          className="karpos-desktop-context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          <button
            type="button"
            className="karpos-desktop-context-menu__item"
            onClick={handleContextOpen}
          >
            Open
          </button>
        </div>
      ) : null}
      {desktopContextMenu ? (
        <div
          className="karpos-desktop-context-menu"
          style={{ left: desktopContextMenu.x, top: desktopContextMenu.y }}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          <button
            type="button"
            className="karpos-desktop-context-menu__item"
            onClick={handleNewFolder}
          >
            New Folder
          </button>
          <button
            type="button"
            className="karpos-desktop-context-menu__item"
            onClick={handleNewFile}
          >
            New File
          </button>
        </div>
      ) : null}
    </div>
  );
}
