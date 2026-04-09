/**
 * Mac OS X virtual filesystem (`macosx-filesystem` in localStorage).
 * macOS-style paths; desktop at `/Users/zkarpinski/Desktop`.
 * Applications live under `/Applications`.
 */

import { NOTEPAD_PENDING_KEY } from '@retro-web/core/apps/notepad';
import {
  PDF_READER_PENDING_KEY,
  PDF_CONTENT_KEY_TO_URL,
} from '@retro-web/core/apps/pdf-reader/constants';
import type { AppConfig } from '@retro-web/core/types/app-config';

export { NOTEPAD_PENDING_KEY };
export { PDF_READER_PENDING_KEY };

const STORAGE_KEY = 'macosx-tiger-filesystem';

export const HOME_PATH = '/Users/zkarpinski';
export const DESKTOP_PATH = '/Users/zkarpinski/Desktop';
const APPLICATIONS_PATH = '/Applications';

export const FINDER_PENDING_PATH_KEY = 'finder-pending-path';

export const EXTENSION_TO_APP: Record<string, string> = {
  txt: 'notepad',
  pdf: 'pdf-reader',
};

const DEFAULT_ICON_BY_EXT: Record<string, string> = {
  txt: 'shell/icons/text_file.png',
  pdf: 'shell/icons/pdf_file.png',
  rtf: 'shell/icons/rtf_file.png',
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

let registryRef: AppConfig[] = [];
let cachedTree: FsTree | null = null;

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

export function getParentPath(path: string): string {
  const normalized = normalizePath(path);
  if (!normalized || normalized === '/') return '';
  const parts = normalized.split('/').filter(Boolean);
  if (parts.length <= 1) return '/';
  return '/' + parts.slice(0, -1).join('/');
}

export function initFileSystem(registry: AppConfig[]): void {
  registryRef = registry;
  cachedTree = null;
}

const DEFAULT_README = `Welcome to Mac OS X!

This is your home folder. You can store files here,
on your Desktop, or in your Documents folder.

Mac OS X 10.4 "Tiger" — April 2005
`;

function buildDefaultTree(): FsTree {
  const tree: FsTree = {
    '/': { type: 'folder', children: ['Users', 'Applications'] },
    '/Users': { type: 'folder', children: ['zkarpinski'] },
    '/Users/zkarpinski': { type: 'folder', children: ['Desktop', 'Documents'] },
    '/Users/zkarpinski/Desktop': { type: 'folder', children: ['ReadMe.txt'] },
    '/Users/zkarpinski/Desktop/ReadMe.txt': {
      type: 'file',
      content: DEFAULT_README,
    },
    '/Users/zkarpinski/Documents': { type: 'folder', children: [] },
    [APPLICATIONS_PATH]: { type: 'folder', children: [] },
  };

  // Populate /Applications from the registry (skip finder itself)
  for (const app of registryRef) {
    if (app.id === 'finder') continue;
    const appPath = joinPath(APPLICATIONS_PATH, app.label);
    tree[appPath] = { type: 'app', appId: app.id, label: app.label };
    const folder = tree[APPLICATIONS_PATH] as FolderNode;
    if (!folder.children.includes(app.label)) folder.children.push(app.label);
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
      window.dispatchEvent(new Event('macosx-fs-change'));
    }
  } catch (_) {
    /* ignore */
  }
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

/** Volumes shown at Finder "Computer" level. */
export function getDrives(): DirEntry[] {
  return [
    {
      name: 'Macintosh HD',
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

export function getFileIconPath(name: string): string {
  const ext = getExtension(name);
  return (ext && DEFAULT_ICON_BY_EXT[ext]) || 'shell/icons/generic_file.png';
}

export function getAppIcon(appId: string): string {
  const app = registryRef.find((a) => a.id === appId);
  return app?.icon ?? 'shell/icons/generic_file.png';
}

export async function openFileByPath(
  path: string,
  showApp: (appId: string) => void,
): Promise<void> {
  const node = getNode(path);
  if (!node) return;
  if (node.type === 'app') {
    showApp(node.appId);
    return;
  }
  if (node.type !== 'file') return;
  const name = path.split('/').pop() ?? path;
  const ext = getExtension(name);
  if (!ext) return;
  const appId = EXTENSION_TO_APP[ext];
  if (!appId) return;

  try {
    const fileNode = node as FileNode;
    switch (appId) {
      case 'notepad':
        sessionStorage.setItem(
          NOTEPAD_PENDING_KEY,
          JSON.stringify({ filename: name, content: fileNode.content ?? '', path }),
        );
        break;
      case 'pdf-reader':
        sessionStorage.setItem(
          PDF_READER_PENDING_KEY,
          JSON.stringify({
            filename: name,
            path,
            pdfUrl: fileNode.contentKey
              ? PDF_CONTENT_KEY_TO_URL[fileNode.contentKey]
              : fileNode.sourcePath,
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

  tree[parent] = { type: 'folder', children: [...(parentNode as FolderNode).children, name] };
  tree[normalized] = { type: 'folder', children: [] };
  saveTree(tree);
}

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
