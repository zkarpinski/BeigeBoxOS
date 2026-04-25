/**
 * Virtual Windows XP–style filesystem (paths use backslashes).
 * Desktop is the per-user profile folder: C:\Documents and Settings\<user>\Desktop
 * (not Win9x C:\Windows\Desktop). Program Files is built from the app registry.
 * Persisted to localStorage; call initFileSystem(registry) once at app load.
 */

import type { AppConfig } from './types/app-config';
import { NOTEPAD_PENDING_KEY } from '@retro-web/core/apps/notepad';

export { NOTEPAD_PENDING_KEY };
export const WORD_PENDING_KEY = 'word-pending-document';

/** Bump when default tree layout changes so users get the new structure without stale merges. */
const STORAGE_KEY = 'winxp-filesystem-v3';

/** Logon name shown in Documents and Settings (Windows XP profile). */
export const USER_PROFILE_NAME = 'zKarpinski';

export const DOCUMENTS_AND_SETTINGS_PATH = 'C:\\Documents and Settings';
export const USER_PROFILE_PATH = `${DOCUMENTS_AND_SETTINGS_PATH}\\${USER_PROFILE_NAME}`;
/** Virtual desktop: shell icons + listDir read this path. */
export const DESKTOP_PATH = `${USER_PROFILE_PATH}\\Desktop`;
/** XP "My Documents" under the user profile (not C:\My Documents). */
export const MY_DOCUMENTS_PATH = `${USER_PROFILE_PATH}\\My Documents`;

const PROGRAM_FILES_BASE = 'C:\\Program Files';

/** Extension → app id for opening files. */
export const EXTENSION_TO_APP: Record<string, string> = {
  txt: 'notepad',
  doc: 'word',
};

const DEFAULT_ICON_BY_EXT: Record<string, string> = {
  txt: 'shell/icons/notepad_file.png',
  doc: 'apps/word/word-icon.png',
};

export type FolderNode = { type: 'folder'; children: string[] };
export type FileNode = { type: 'file'; content?: string; contentKey?: string };
export type AppNode = { type: 'app'; appId: string; label: string };
export type FsNode = FolderNode | FileNode | AppNode;

export type FsTree = Record<string, FsNode>;

export function normalizePath(p: string): string {
  const s = p.replace(/\//g, '\\').trim();
  if (!s) return s;
  const parts = s.split('\\').filter(Boolean);
  if (parts.length === 0) return s;
  const first = parts[0].toUpperCase();
  if (first.endsWith(':')) {
    parts[0] = first;
    return parts.join('\\');
  }
  return parts.join('\\');
}

export function joinPath(parent: string, name: string): string {
  const p = normalizePath(parent);
  if (!p) return name;
  return p + '\\' + name;
}

/** Parent path, or "" if at root (e.g. C:\ -> "" for "up" from C:\). */
export function getParentPath(path: string): string {
  const normalized = normalizePath(path);
  if (!normalized) return '';
  const parts = normalized.split('\\').filter(Boolean);
  if (parts.length <= 1) return ''; // C: or A: etc. -> root
  return parts.slice(0, -1).join('\\');
}

const DEFAULT_TODO_CONTENT = `Zach's Todo List:
- Support creating folders and new files that save locally via cookies
- Fully Functional Recreation of 3D Space Cadet Pinball Game`;

let registryRef: AppConfig[] = [];
let cachedTree: FsTree | null = null;

/**
 * Call once at app load (e.g. from page) so Program Files and app shortcuts are built from the registry.
 */
export function initFileSystem(registry: AppConfig[]): void {
  registryRef = registry;
  cachedTree = null;
}

function buildDefaultTree(): FsTree {
  const tree: FsTree = {
    'C:': {
      type: 'folder',
      children: ['Documents and Settings', 'Program Files', 'Windows'],
    },
    'C:\\Documents and Settings': {
      type: 'folder',
      children: [USER_PROFILE_NAME],
    },
    [USER_PROFILE_PATH]: {
      type: 'folder',
      children: ['Desktop', 'My Documents'],
    },
    [DESKTOP_PATH]: {
      type: 'folder',
      children: ['TODO.txt'],
    },
    [`${DESKTOP_PATH}\\TODO.txt`]: {
      type: 'file',
      content: DEFAULT_TODO_CONTENT,
    },
    [MY_DOCUMENTS_PATH]: {
      type: 'folder',
      children: [],
    },
    'C:\\Windows': {
      type: 'folder',
      children: ['System32', 'Temp', 'Fonts'],
    },
    'C:\\Windows\\System32': { type: 'folder', children: [] },
    'C:\\Windows\\Temp': { type: 'folder', children: [] },
    'C:\\Windows\\Fonts': { type: 'folder', children: [] },
  };

  const appsWithStart = registryRef.filter(
    (a) => a.startMenu && typeof a.startMenu === 'object' && Array.isArray(a.startMenu.path),
  );
  if (!tree['C:\\Program Files']) {
    tree['C:\\Program Files'] = { type: 'folder', children: [] };
  }
  for (const app of appsWithStart) {
    const menu = app.startMenu && typeof app.startMenu === 'object' ? app.startMenu : null;
    if (!menu || !Array.isArray(menu.path) || menu.path[0] !== 'Programs') continue;
    const subPath = menu.path.slice(1);
    let current = PROGRAM_FILES_BASE;
    for (const segment of subPath) {
      const next = current + '\\' + segment;
      if (!tree[next]) tree[next] = { type: 'folder', children: [] };
      const folder = tree[current] as FolderNode;
      if (!folder.children.includes(segment)) folder.children.push(segment);
      current = next;
    }
    const appChildName = app.id;
    const appPath = current + '\\' + appChildName;
    tree[appPath] = {
      type: 'app',
      appId: app.id,
      label: menu.label ?? app.label,
    };
    const folder = tree[current] as FolderNode;
    if (!folder.children.includes(appChildName)) folder.children.push(appChildName);
  }

  return tree;
}

function loadTree(): FsTree {
  if (cachedTree) return cachedTree;
  const defaultTree = buildDefaultTree();
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw) as FsTree;
      cachedTree = { ...defaultTree, ...parsed };
    } else {
      cachedTree = defaultTree;
    }
  } catch {
    cachedTree = defaultTree;
  }
  return cachedTree;
}

function saveTree(tree: FsTree): void {
  cachedTree = tree;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tree));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('winxp-fs-change'));
    }
  } catch (_) {
    /* ignore */
  }
}

export function getFsTree(): FsTree {
  return loadTree();
}

export function getNode(path: string): FsNode | null {
  const normalized = normalizePath(path);
  const tree = loadTree();
  return tree[normalized] ?? null;
}

export interface DirEntry {
  name: string;
  path: string;
  type: 'folder' | 'file' | 'app';
  node: FsNode;
  appId?: string;
}

export function listDir(path: string): DirEntry[] {
  const normalized = normalizePath(path);
  const node = getNode(normalized);
  if (!node || node.type !== 'folder') return [];
  const entries: DirEntry[] = [];
  for (const name of node.children) {
    const childPath = joinPath(normalized, name);
    const child = getNode(childPath);
    if (!child) continue;
    const displayName = child.type === 'app' ? child.label : name;
    entries.push({
      name: displayName,
      path: childPath,
      type: child.type === 'app' ? 'app' : child.type,
      node: child,
      appId: child.type === 'app' ? child.appId : undefined,
    });
  }
  return entries;
}

/** Drives shown at "My Computer" root. */
export function getDrives(): DirEntry[] {
  return [
    {
      name: '3½ Floppy (A:)',
      path: 'A:\\',
      type: 'folder',
      node: { type: 'folder', children: [] },
    },
    {
      name: 'Local Disk (C:)',
      path: 'C:\\',
      type: 'folder',
      node: getNode('C:\\') ?? { type: 'folder', children: [] },
    },
    {
      name: 'CD-ROM Drive (D:)',
      path: 'D:\\',
      type: 'folder',
      node: { type: 'folder', children: [] },
    },
  ];
}

function getExtension(name: string): string | null {
  const m = name.match(/\.([a-zA-Z0-9]+)$/);
  return m ? m[1].toLowerCase() : null;
}

export function getFileIconPath(name: string, _path?: string): string {
  const ext = getExtension(name);
  return (ext && DEFAULT_ICON_BY_EXT[ext]) || 'shell/icons/notepad_file.png';
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
  const ext = getExtension(name);
  if (!ext) return;
  const appId = EXTENSION_TO_APP[ext];
  if (!appId) return;

  try {
    switch (appId) {
      case 'notepad':
        sessionStorage.setItem(
          NOTEPAD_PENDING_KEY,
          JSON.stringify({ filename: name, content: node.content ?? '', path: path }),
        );
        break;
      case 'word':
        sessionStorage.setItem(
          WORD_PENDING_KEY,
          JSON.stringify({ documentKey: node.contentKey ?? 'resume' }),
        );
        break;
      default:
        return;
    }
    showApp(appId);
  } catch (_) {
    /* ignore */
  }
}

/**
 * Create or update a file. Persists to localStorage.
 */
export function writeFile(path: string, content: string): void {
  const normalized = normalizePath(path);
  const tree = loadTree();
  const name = normalized.split('\\').pop() ?? '';
  const parent = normalized.slice(0, -(name.length + 1));

  const parentNode = tree[parent];
  if (!parentNode || parentNode.type !== 'folder') return;

  const children = [...parentNode.children];
  if (!children.includes(name)) {
    children.push(name);
    tree[parent] = { type: 'folder', children };
  }
  tree[normalized] = { type: 'file', content };
  saveTree(tree);
}

/**
 * Create a folder. Persists to localStorage.
 */
export function createFolder(path: string): void {
  const normalized = normalizePath(path);
  if (getNode(normalized)) return;
  const name = normalized.split('\\').pop() ?? '';
  const parent = normalized.slice(0, -(name.length + 1));

  const tree = loadTree();
  const parentNode = tree[parent];
  if (!parentNode || parentNode.type !== 'folder') return;

  tree[parent] = {
    type: 'folder',
    children: [...parentNode.children, name],
  };
  tree[normalized] = { type: 'folder', children: [] };
  saveTree(tree);
}

/**
 * Delete a file or folder. Persists to localStorage.
 */
export function deletePath(path: string): void {
  const normalized = normalizePath(path);
  const node = getNode(normalized);
  if (!node) return;

  const tree = loadTree();
  const name = normalized.split('\\').pop() ?? '';
  const parent = normalized.slice(0, -(name.length + 1));

  if (parent && tree[parent]?.type === 'folder') {
    const parentNode = tree[parent];
    tree[parent] = {
      type: 'folder',
      children: parentNode.children.filter((c) => c !== name),
    };
  }
  delete tree[normalized];
  if (node.type === 'folder') {
    for (const child of node.children) {
      deletePath(joinPath(normalized, child));
    }
  }
  saveTree(tree);
}
