/**
 * Factory for Windows-style virtual filesystems (backslash paths, C:/A:/D: drives).
 *
 * Each Windows OS (Win98, WinXP) calls createWindowsFileSystem() with its own
 * storage key and change-event name, then provides a buildDefaultTree function
 * to init(). All CRUD operations are identical across OSes — only the default
 * folder structure and extension-to-app mapping differ.
 */

import type { AppConfig } from '../types/app-config';

// ── Shared types ──────────────────────────────────────────────────────────────

export type FolderNode = { type: 'folder'; children: string[] };
export type FileNode = { type: 'file'; content?: string; contentKey?: string };
export type AppNode = { type: 'app'; appId: string; label: string };
export type FsNode = FolderNode | FileNode | AppNode;
export type FsTree = Record<string, FsNode>;

export interface DirEntry {
  name: string;
  path: string;
  type: 'folder' | 'file' | 'app';
  node: FsNode;
  appId?: string;
}

// ── Options ───────────────────────────────────────────────────────────────────

export interface WindowsFsOptions {
  /** localStorage key for persisting the tree (e.g. 'win98-filesystem'). */
  storageKey: string;
  /** CustomEvent name dispatched on every save (e.g. 'win98-fs-change'). */
  changeEvent: string;
  /** Maps file extensions → icon paths. Falls back to defaultIcon. */
  defaultIconByExt?: Record<string, string>;
  /** Fallback icon path when no extension match is found. */
  defaultIcon?: string;
}

// ── Factory ───────────────────────────────────────────────────────────────────

export function createWindowsFileSystem(options: WindowsFsOptions) {
  const {
    storageKey,
    changeEvent,
    defaultIconByExt = {},
    defaultIcon = 'shell/icons/notepad_file.png',
  } = options;

  let cachedTree: FsTree | null = null;
  let defaultTreeFn: (() => FsTree) | null = null;

  /**
   * Call once at startup (via initFileSystem) to provide the OS-specific
   * default tree builder and reset the in-memory cache.
   */
  function init(getDefaultTree: () => FsTree): void {
    defaultTreeFn = getDefaultTree;
    cachedTree = null;
  }

  // ── Path helpers ─────────────────────────────────────────────────────────

  function normalizePath(p: string): string {
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

  function joinPath(parent: string, name: string): string {
    const p = normalizePath(parent);
    if (!p) return name;
    return p + '\\' + name;
  }

  function getParentPath(path: string): string {
    const normalized = normalizePath(path);
    if (!normalized) return '';
    const parts = normalized.split('\\').filter(Boolean);
    if (parts.length <= 1) return '';
    return parts.slice(0, -1).join('\\');
  }

  function getExtension(name: string): string | null {
    const m = name.match(/\.([a-zA-Z0-9]+)$/);
    return m ? m[1].toLowerCase() : null;
  }

  // ── Storage ──────────────────────────────────────────────────────────────

  function loadTree(): FsTree {
    if (cachedTree) return cachedTree;
    const defaultTree = defaultTreeFn?.() ?? {};
    try {
      const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(storageKey) : null;
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
      localStorage.setItem(storageKey, JSON.stringify(tree));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event(changeEvent));
      }
    } catch {
      /* ignore quota errors */
    }
  }

  // ── Read operations ──────────────────────────────────────────────────────

  function getFsTree(): FsTree {
    return loadTree();
  }

  function getNode(path: string): FsNode | null {
    return loadTree()[normalizePath(path)] ?? null;
  }

  function listDir(path: string): DirEntry[] {
    const normalized = normalizePath(path);
    const node = getNode(normalized);
    if (!node || node.type !== 'folder') return [];
    const entries: DirEntry[] = [];
    for (const name of node.children) {
      const childPath = joinPath(normalized, name);
      const child = getNode(childPath);
      if (!child) continue;
      entries.push({
        name: child.type === 'app' ? child.label : name,
        path: childPath,
        type: child.type === 'app' ? 'app' : child.type,
        node: child,
        appId: child.type === 'app' ? child.appId : undefined,
      });
    }
    return entries;
  }

  function getDrives(): DirEntry[] {
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
        node: getNode('C:') ?? { type: 'folder', children: [] },
      },
      {
        name: 'CD-ROM Drive (D:)',
        path: 'D:\\',
        type: 'folder',
        node: { type: 'folder', children: [] },
      },
    ];
  }

  function getFileIconPath(name: string, _path?: string): string {
    const ext = getExtension(name);
    return (ext && defaultIconByExt[ext]) || defaultIcon;
  }

  // ── Write operations ─────────────────────────────────────────────────────

  function writeFile(path: string, content: string): void {
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

  function createFolder(path: string): void {
    const normalized = normalizePath(path);
    if (getNode(normalized)) return;
    const name = normalized.split('\\').pop() ?? '';
    const parent = normalized.slice(0, -(name.length + 1));

    const tree = loadTree();
    const parentNode = tree[parent];
    if (!parentNode || parentNode.type !== 'folder') return;

    tree[parent] = { type: 'folder', children: [...parentNode.children, name] };
    tree[normalized] = { type: 'folder', children: [] };
    saveTree(tree);
  }

  function deletePath(path: string): void {
    const normalized = normalizePath(path);
    const node = getNode(normalized);
    if (!node) return;

    const tree = loadTree();
    const name = normalized.split('\\').pop() ?? '';
    const parent = normalized.slice(0, -(name.length + 1));

    if (parent && tree[parent]?.type === 'folder') {
      const parentNode = tree[parent] as FolderNode;
      tree[parent] = { type: 'folder', children: parentNode.children.filter((c) => c !== name) };
    }
    delete tree[normalized];
    if (node.type === 'folder') {
      for (const child of node.children) {
        deletePath(joinPath(normalized, child));
      }
    }
    saveTree(tree);
  }

  return {
    init,
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
  };
}

// ── Shared helper: build Program Files subtree from app registry ───────────────

/**
 * Builds the Program Files portion of the FsTree from the app registry.
 * Both Win98 and WinXP use this to populate C:\Program Files from startMenu paths.
 */
export function buildProgramFilesTree(registry: AppConfig[], programFilesBase: string): FsTree {
  const result: FsTree = {
    [programFilesBase]: { type: 'folder', children: [] },
  };

  for (const app of registry) {
    const menu = app.startMenu && typeof app.startMenu === 'object' ? app.startMenu : null;
    if (!menu || !Array.isArray(menu.path) || menu.path[0] !== 'Programs') continue;

    const subPath = menu.path.slice(1);
    let current = programFilesBase;
    for (const segment of subPath) {
      const next = current + '\\' + segment;
      if (!result[next]) result[next] = { type: 'folder', children: [] };
      const folder = result[current] as FolderNode;
      if (!folder.children.includes(segment)) folder.children.push(segment);
      current = next;
    }

    const appPath = current + '\\' + app.id;
    result[appPath] = { type: 'app', appId: app.id, label: menu.label ?? app.label };
    const folder = result[current] as FolderNode;
    if (!folder.children.includes(app.id)) folder.children.push(app.id);
  }

  return result;
}
