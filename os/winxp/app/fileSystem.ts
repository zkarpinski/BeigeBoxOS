/**
 * WinXP virtual filesystem — CRUD via @retro-web/core/fs, XP-specific
 * default tree and extension handling kept here.
 *
 * Desktop is under the per-user profile (XP style):
 *   C:\Documents and Settings\<user>\Desktop
 */

import type { AppConfig } from './types/app-config';
import { NOTEPAD_PENDING_KEY } from '@retro-web/core/apps/notepad';
import { createFileSystem } from '@retro-web/core/fs';

export { NOTEPAD_PENDING_KEY };
export const WORD_PENDING_KEY = 'word-pending-document';

// Re-export shared types so OS components can import from this module as before
export type { FolderNode, FileNode, AppNode, FsNode, FsTree, DirEntry } from '@retro-web/core/fs';

/** Bump suffix when default tree layout changes (forces fresh tree for existing users). */
const STORAGE_KEY = 'winxp-filesystem-v3';

export const USER_PROFILE_NAME = 'zKarpinski';
export const DOCUMENTS_AND_SETTINGS_PATH = 'C:\\Documents and Settings';
export const USER_PROFILE_PATH = `${DOCUMENTS_AND_SETTINGS_PATH}\\${USER_PROFILE_NAME}`;
export const DESKTOP_PATH = `${USER_PROFILE_PATH}\\Desktop`;
export const MY_DOCUMENTS_PATH = `${USER_PROFILE_PATH}\\My Documents`;

const PROGRAM_FILES_BASE = 'C:\\Program Files';

/** Extension → app id for opening files. */
export const EXTENSION_TO_APP: Record<string, string> = {
  txt: 'notepad',
};

// ── Factory instance ──────────────────────────────────────────────────────────

const fs = createFileSystem({
  storageKey: STORAGE_KEY,
  changeEvent: 'winxp-fs-change',
  pathStyle: 'windows',
  volumes: [
    { name: '3½ Floppy (A:)', rootKey: 'A:', placeholder: true },
    { name: 'Local Disk (C:)', rootKey: 'C:' },
    { name: 'CD-ROM Drive (D:)', rootKey: 'D:', placeholder: true },
  ],
  defaultIconByExt: {
    txt: 'shell/icons/notepad_file.png',
  },
  defaultIcon: 'shell/icons/notepad_file.png',
});

export const {
  normalizePath,
  joinPath,
  getParentPath,
  getFsTree,
  getNode,
  listDir,
  getDrives,
  getFileIconPath,
  writeFile,
  createFolder,
  deletePath,
} = fs;

// ── Registry reference (set by initFileSystem) ────────────────────────────────

let registryRef: AppConfig[] = [];

const DEFAULT_TODO_CONTENT = `Zach's Todo List:
- Support creating folders and new files that save locally via cookies
- Fully Functional Recreation of 3D Space Cadet Pinball Game`;

function buildDefaultTree() {
  return {
    'C:': {
      type: 'folder' as const,
      children: ['Documents and Settings', 'Program Files', 'Windows'],
    },
    'C:\\Documents and Settings': {
      type: 'folder' as const,
      children: [USER_PROFILE_NAME],
    },
    [USER_PROFILE_PATH]: {
      type: 'folder' as const,
      children: ['Desktop', 'My Documents'],
    },
    [DESKTOP_PATH]: {
      type: 'folder' as const,
      children: ['TODO.txt'],
    },
    [`${DESKTOP_PATH}\\TODO.txt`]: {
      type: 'file' as const,
      content: DEFAULT_TODO_CONTENT,
    },
    [MY_DOCUMENTS_PATH]: {
      type: 'folder' as const,
      children: [],
    },
    'C:\\Windows': {
      type: 'folder' as const,
      children: ['System32', 'Temp', 'Fonts'],
    },
    'C:\\Windows\\System32': { type: 'folder' as const, children: [] },
    'C:\\Windows\\Temp': { type: 'folder' as const, children: [] },
    'C:\\Windows\\Fonts': { type: 'folder' as const, children: [] },
    ...fs.buildAppEntries(registryRef, { basePath: PROGRAM_FILES_BASE, layout: 'startMenu' }),
  };
}

/**
 * Call once at app load so Program Files and app shortcuts are built from the registry.
 */
export function initFileSystem(registry: AppConfig[]): void {
  registryRef = registry;
  fs.init(buildDefaultTree);
}

/** Icon for an app shortcut in the filesystem (from registry). */
export function getAppIcon(appId: string): string {
  const app = registryRef.find((a) => a.id === appId);
  return app?.icon ?? 'shell/icons/executable-0.png';
}

/**
 * Open a file or app by path: app nodes launch the app; files open by extension via sessionStorage.
 */
export function openFileByPath(path: string, showApp: (appId: string) => void): void {
  const node = getNode(path);
  if (!node) return;
  if (node.type === 'app') {
    showApp(node.appId);
    return;
  }
  if (node.type !== 'file') return;
  const name = path.split('\\').pop() ?? path;
  const ext = name.match(/\.([a-zA-Z0-9]+)$/)?.[1]?.toLowerCase();
  if (!ext) return;
  const appId = EXTENSION_TO_APP[ext];
  if (!appId) return;
  try {
    switch (appId) {
      case 'notepad':
        sessionStorage.setItem(
          NOTEPAD_PENDING_KEY,
          JSON.stringify({ filename: name, content: node.content ?? '', path }),
        );
        break;
      default:
        return;
    }
    showApp(appId);
  } catch {
    /* ignore */
  }
}
