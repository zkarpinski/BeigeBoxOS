/**
 * KarpOS virtual filesystem — CRUD via @retro-web/core/fs, KarpOS-specific
 * default tree and extension handling kept here.
 *
 * Linux-style paths (POSIX); desktop lives under `/home/zkarpinski/Desktop`.
 * Static files under `/fs/` in the public directory are hydrated automatically
 * via the manifest at `/fs/index.json`.
 */

import type { AppConfig } from '@retro-web/core/types/app-config';
import { NOTEPAD_PENDING_KEY } from '@retro-web/core/apps/notepad';
import {
  PDF_READER_PENDING_KEY,
  PDF_CONTENT_KEY_TO_URL,
} from '@retro-web/core/apps/pdf-reader/constants';
import { createFileSystem } from '@retro-web/core/fs';

export { NOTEPAD_PENDING_KEY };
export { PDF_READER_PENDING_KEY };
export const WORD_PENDING_KEY = 'word-pending-document';
export const PAD_PENDING_KEY = 'pad-pending-document';

// Re-export shared types so OS components can import from this module as before
export type { FolderNode, FileNode, AppNode, FsNode, FsTree, DirEntry } from '@retro-web/core/fs';

/** User home directory. */
export const HOME_PATH = '/home/zkarpinski';

/** Virtual Desktop — mirrors `~/Desktop`. */
export const DESKTOP_PATH = '/home/zkarpinski/Desktop';

/** Packaged app shortcuts live under `/opt`, FHS-style. */
const PROGRAM_FILES_BASE = '/opt';

/** Extension → app id for opening files. */
export const EXTENSION_TO_APP: Record<string, string> = {
  txt: 'notepad',
  md: 'pad',
  doc: 'word',
  pdf: 'pdf-reader',
};

// ── Factory instance ───────────────────────────────────────────────────────────

const fs = createFileSystem({
  storageKey: 'karpos-filesystem-linux',
  changeEvent: 'karpos-fs-change',
  pathStyle: 'posix',
  volumes: [{ name: 'File System', rootKey: '/' }],
  publicFsManifestUrl: '/fs/index.json',
  defaultIconByExt: {
    txt: 'shell/icons/notepad_file.png',
    md: 'shell/icons/notepad_with_pencil.png',
    doc: 'apps/word/word-icon.png',
    pdf: 'shell/icons/adobe-pdf-modern-icon.png',
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
  loadFileContent,
  writeFile,
  createFolder,
  deletePath,
  renamePath,
} = fs;

// ── Registry reference (set by initFileSystem) ────────────────────────────────

let registryRef: AppConfig[] = [];

function buildDefaultTree() {
  return {
    '/': {
      type: 'folder' as const,
      children: ['home', 'opt', 'tmp'],
    },
    '/home': {
      type: 'folder' as const,
      children: ['zkarpinski'],
    },
    '/home/zkarpinski': {
      type: 'folder' as const,
      children: ['Desktop', 'Documents'],
    },
    '/home/zkarpinski/Desktop': {
      type: 'folder' as const,
      children: ['Projects', 'TODO.md', 'My Resume.pdf'],
    },
    '/home/zkarpinski/Desktop/TODO.md': {
      type: 'file' as const,
      sourcePath: '/fs/home/zkarpinski/Desktop/TODO.md',
    },
    '/home/zkarpinski/Desktop/Projects': {
      type: 'app' as const,
      appId: 'projects',
      label: 'Projects',
    },
    '/home/zkarpinski/Desktop/My Resume.pdf': {
      type: 'file' as const,
      sourcePath: '/fs/home/zkarpinski/Desktop/My%20Resume.pdf',
    },
    '/home/zkarpinski/Documents': {
      type: 'folder' as const,
      children: ['My Resume.pdf'],
    },
    '/home/zkarpinski/Documents/My Resume.pdf': {
      type: 'file' as const,
      sourcePath: '/fs/home/zkarpinski/Desktop/My%20Resume.pdf',
    },
    '/tmp': { type: 'folder' as const, children: [] },
    ...fs.buildAppEntries(registryRef, { basePath: PROGRAM_FILES_BASE, layout: 'startMenu' }),
  };
}

/**
 * Call once at app load so `/opt` app shortcuts are built from the registry.
 * Also triggers manifest hydration for public static files.
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
 * Open a file or app by path: app nodes launch the app; files open by extension
 * via sessionStorage.
 */
export async function openFileByPath(
  path: string,
  showApp: (appId: string) => void,
): Promise<void> {
  await fs.hydrateFromManifest();
  const node = getNode(path);
  if (!node) return;
  if (node.type === 'app') {
    showApp(node.appId);
    return;
  }
  if (node.type !== 'file') return;
  const name = fs.basename(path);
  const ext = name.match(/\.([a-zA-Z0-9]+)$/)?.[1]?.toLowerCase();
  if (!ext) return;
  const appId = EXTENSION_TO_APP[ext];
  if (!appId) return;

  try {
    const content = await loadFileContent(node);
    switch (appId) {
      case 'notepad':
        sessionStorage.setItem(
          NOTEPAD_PENDING_KEY,
          JSON.stringify({ filename: name, content: content || node.content || '', path }),
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
  } catch {
    /* ignore */
  }
}

/** Test helper: reset all module state between Jest cases. */
export function __resetFileSystemStateForTests(): void {
  registryRef = [];
  fs.reset();
}
