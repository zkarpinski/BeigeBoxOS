/**
 * KarpOS-only virtual filesystem (`karpos-filesystem-linux` in localStorage).
 * Linux-style paths (forward slashes); desktop lives under `/home/zkarpinski/Desktop`.
 * Independent from Win98 `os/win98/app/fileSystem.ts`.
 */

import type { AppConfig } from '@retro-web/core/types/app-config';
import { NOTEPAD_PENDING_KEY } from '@retro-web/core/apps/notepad';
import {
  PDF_READER_PENDING_KEY,
  PDF_CONTENT_KEY_TO_URL,
} from '@retro-web/core/apps/pdf-reader/constants';

export { NOTEPAD_PENDING_KEY };
export { PDF_READER_PENDING_KEY };
export const WORD_PENDING_KEY = 'word-pending-document';
export const PAD_PENDING_KEY = 'pad-pending-document';

const STORAGE_KEY = 'karpos-filesystem-linux';

/** User home (zkarpinski). */
export const HOME_PATH = '/home/zkarpinski';

/** Virtual Desktop — mirrors `~/Desktop`. */
export const DESKTOP_PATH = '/home/zkarpinski/Desktop';

/** Packaged app shortcuts (Start menu) live under `/opt`, FHS-style. */
const PROGRAM_FILES_BASE = '/opt';

/** Extension → app id for opening files. */
export const EXTENSION_TO_APP: Record<string, string> = {
  txt: 'notepad',
  md: 'pad',
  doc: 'word',
  pdf: 'pdf-reader',
};

const DEFAULT_ICON_BY_EXT: Record<string, string> = {
  txt: 'shell/icons/notepad_file.png',
  md: 'shell/icons/notepad_with_pencil.png',
  doc: 'apps/word/word-icon.png',
  pdf: 'shell/icons/adobe-pdf-modern-icon.png',
};

export type FolderNode = { type: 'folder'; children: string[] };
export type FileNode = {
  type: 'file';
  content?: string;
  contentKey?: string;
  sourcePath?: string;
  localOverride?: boolean;
};
export type AppNode = { type: 'app'; appId: string; label: string };
export type FsNode = FolderNode | FileNode | AppNode;

export type FsTree = Record<string, FsNode>;

/** Normalize to absolute POSIX-style path with a single leading `/`. */
function normalizePath(p: string): string {
  const s = p.replace(/\\/g, '/').trim();
  if (!s) return '';
  const parts = s.split('/').filter(Boolean);
  if (parts.length === 0) return '/';
  return '/' + parts.join('/');
}

function joinPath(parent: string, name: string): string {
  const p = normalizePath(parent);
  if (!p || p === '/') return '/' + name;
  return p + '/' + name;
}

/** Parent directory, or `""` when `path` is `/` (filesystem root). */
export function getParentPath(path: string): string {
  const normalized = normalizePath(path);
  if (!normalized || normalized === '/') return '';
  const parts = normalized.split('/').filter(Boolean);
  if (parts.length <= 1) return '/';
  return '/' + parts.slice(0, -1).join('/');
}

let registryRef: AppConfig[] = [];
let cachedTree: FsTree | null = null;
let publicFsHydrated = false;
let publicFsHydrating = false;

type PublicFsManifestEntry = {
  path: string;
  type: 'file' | 'folder';
};

type PublicFsManifest = {
  entries: PublicFsManifestEntry[];
};

/** Test helper: reset module state between Jest cases. */
export function __resetFileSystemStateForTests(): void {
  registryRef = [];
  cachedTree = null;
  publicFsHydrated = false;
  publicFsHydrating = false;
}

/**
 * Call once at app load (e.g. from page) so `/opt` app shortcuts are built from the registry.
 */
export function initFileSystem(registry: AppConfig[]): void {
  registryRef = registry;
  cachedTree = null;
  void hydrateFromPublicFsManifest();
}

function buildDefaultTree(): FsTree {
  const tree: FsTree = {
    '/': {
      type: 'folder',
      children: ['home', 'opt', 'tmp'],
    },
    '/home': {
      type: 'folder',
      children: ['zkarpinski'],
    },
    '/home/zkarpinski': {
      type: 'folder',
      children: ['Desktop', 'Documents'],
    },
    '/home/zkarpinski/Desktop': {
      type: 'folder',
      children: ['Projects', 'TODO.md', 'My Resume.pdf'],
    },
    '/home/zkarpinski/Desktop/TODO.md': {
      type: 'file',
      sourcePath: '/fs/home/zkarpinski/Desktop/TODO.md',
    },
    '/home/zkarpinski/Desktop/Projects': {
      type: 'app',
      appId: 'projects',
      label: 'Projects',
    },
    '/home/zkarpinski/Desktop/My Resume.pdf': {
      type: 'file',
      sourcePath: '/fs/home/zkarpinski/Desktop/My%20Resume.pdf',
    },
    '/home/zkarpinski/Documents': {
      type: 'folder',
      children: ['My Resume.pdf'],
    },
    '/home/zkarpinski/Documents/My Resume.pdf': {
      type: 'file',
      sourcePath: '/fs/home/zkarpinski/Desktop/My%20Resume.pdf',
    },
    '/tmp': { type: 'folder', children: [] },
  };

  const appsWithStart = registryRef.filter(
    (a) => a.startMenu && typeof a.startMenu === 'object' && Array.isArray(a.startMenu.path),
  );
  if (!tree['/opt']) {
    tree['/opt'] = { type: 'folder', children: [] };
  }
  for (const app of appsWithStart) {
    const menu = app.startMenu && typeof app.startMenu === 'object' ? app.startMenu : null;
    if (!menu || !Array.isArray(menu.path) || menu.path[0] !== 'Programs') continue;
    const subPath = menu.path.slice(1);
    let current = PROGRAM_FILES_BASE;
    for (const segment of subPath) {
      const next = joinPath(current, segment);
      if (!tree[next]) tree[next] = { type: 'folder', children: [] };
      const folder = tree[current] as FolderNode;
      if (!folder.children.includes(segment)) folder.children.push(segment);
      current = next;
    }
    const appChildName = app.id;
    const appPath = joinPath(current, appChildName);
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

function ensureFolder(tree: FsTree, folderPath: string): void {
  if (!folderPath || folderPath === '/') return;
  if (tree[folderPath]?.type === 'folder') return;
  tree[folderPath] = { type: 'folder', children: [] };
}

function pushChild(tree: FsTree, parentPath: string, childName: string): void {
  if (!parentPath || !childName) return;
  if (!tree[parentPath]) {
    tree[parentPath] = { type: 'folder', children: [] };
  }
  const parent = tree[parentPath];
  if (parent.type !== 'folder') return;
  if (!parent.children.includes(childName)) parent.children.push(childName);
}

function upsertPublicFsEntry(tree: FsTree, entry: PublicFsManifestEntry): void {
  const normalized = normalizePath(entry.path);
  if (!normalized || normalized === '/') return;
  const parentPath = getParentPath(normalized);
  const name = basename(normalized);
  if (!name) return;

  if (parentPath) ensureFolder(tree, parentPath);
  if (parentPath) pushChild(tree, parentPath, name);

  if (entry.type === 'folder') {
    ensureFolder(tree, normalized);
    return;
  }

  const existingNode = tree[normalized];
  const existingFile = existingNode && existingNode.type === 'file' ? existingNode : null;
  const localOverride = existingFile?.localOverride === true;

  tree[normalized] = {
    type: 'file',
    sourcePath: `/fs${normalized}`,
    localOverride,
    content: localOverride ? existingFile?.content : undefined,
  };
}

async function hydrateFromPublicFsManifest(): Promise<void> {
  if (publicFsHydrated || publicFsHydrating) return;
  if (typeof window === 'undefined') return;
  publicFsHydrating = true;
  try {
    const res = await fetch('/fs/index.json', { cache: 'no-store' });
    if (!res.ok) {
      publicFsHydrated = true;
      return;
    }
    const manifest = (await res.json()) as PublicFsManifest;
    const entries = Array.isArray(manifest.entries) ? manifest.entries : [];
    if (!entries.length) {
      publicFsHydrated = true;
      return;
    }

    const tree = { ...loadTree() };
    for (const entry of entries) {
      if (!entry || !entry.path || (entry.type !== 'file' && entry.type !== 'folder')) continue;
      upsertPublicFsEntry(tree, entry);
    }
    saveTree(tree);
    publicFsHydrated = true;
  } catch {
    publicFsHydrated = true;
  } finally {
    publicFsHydrating = false;
  }
}

async function loadFileContent(node: FileNode): Promise<string> {
  if (node.localOverride && typeof node.content === 'string') return node.content;
  if (!node.sourcePath || typeof window === 'undefined') return node.content ?? '';
  try {
    const res = await fetch(node.sourcePath, { cache: 'no-store' });
    if (!res.ok) return node.content ?? '';
    return await res.text();
  } catch {
    return node.content ?? '';
  }
}

function saveTree(tree: FsTree): void {
  cachedTree = tree;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tree));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('karpos-fs-change'));
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

/** Root entries for “My Computer” (single filesystem root on KarpOS). */
export function getDrives(): DirEntry[] {
  return [
    {
      name: 'File System',
      path: '/',
      type: 'folder',
      node: getNode('/') ?? { type: 'folder', children: [] },
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

function basename(path: string): string {
  const n = normalizePath(path);
  const parts = n.split('/').filter(Boolean);
  return parts.length ? parts[parts.length - 1]! : n;
}

/**
 * Open a file or app by path: app nodes launch the app; files open by extension via sessionStorage.
 */
export async function openFileByPath(
  path: string,
  showApp: (appId: string) => void,
): Promise<void> {
  await hydrateFromPublicFsManifest();
  const node = getNode(path);
  if (!node) return;
  if (node.type === 'app') {
    showApp(node.appId);
    return;
  }
  if (node.type !== 'file') return;
  const name = basename(path);
  const ext = getExtension(name);
  if (!ext) return;
  const appId = EXTENSION_TO_APP[ext];
  if (!appId) return;

  try {
    const content = await loadFileContent(node);

    switch (appId) {
      case 'notepad':
        sessionStorage.setItem(
          NOTEPAD_PENDING_KEY,
          JSON.stringify({ filename: name, content: content || node.content || '', path: path }),
        );
        break;
      case 'word':
        sessionStorage.setItem(
          WORD_PENDING_KEY,
          JSON.stringify({ documentKey: node.contentKey ?? 'resume' }),
        );
        break;
      case 'pad':
        sessionStorage.setItem(
          PAD_PENDING_KEY,
          JSON.stringify({ filename: name, content: content || node.content || '', path }),
        );
        break;
      case 'pdf-reader':
        sessionStorage.setItem(
          PDF_READER_PENDING_KEY,
          JSON.stringify({
            filename: name,
            path,
            pdfUrl: node.contentKey ? PDF_CONTENT_KEY_TO_URL[node.contentKey] : node.sourcePath,
          }),
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
  if (!normalized || normalized === '/') return;

  const parts = normalized.split('/').filter(Boolean);
  const name = parts.pop();
  if (!name) return;
  const parent = parts.length ? '/' + parts.join('/') : '/';

  const tree = loadTree();
  const parentNode = tree[parent];
  if (!parentNode || parentNode.type !== 'folder') return;

  const children = [...parentNode.children];
  if (!children.includes(name)) {
    children.push(name);
    tree[parent] = { type: 'folder', children };
  }
  const existing = tree[normalized];
  const sourcePath = existing && existing.type === 'file' ? existing.sourcePath : undefined;
  tree[normalized] = { type: 'file', content, sourcePath, localOverride: true };
  saveTree(tree);
}

/**
 * Create a folder. Persists to localStorage.
 */
export function createFolder(path: string): void {
  const normalized = normalizePath(path);
  if (!normalized || normalized === '/') return;
  if (getNode(normalized)) return;

  const parts = normalized.split('/').filter(Boolean);
  const name = parts.pop();
  if (!name) return;
  const parent = parts.length ? '/' + parts.join('/') : '/';

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
  if (!normalized || normalized === '/') return;

  const node = getNode(normalized);
  if (!node) return;

  const tree = loadTree();
  const parts = normalized.split('/').filter(Boolean);
  const name = parts.pop();
  if (!name) return;
  const parent = parts.length ? '/' + parts.join('/') : '/';

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
