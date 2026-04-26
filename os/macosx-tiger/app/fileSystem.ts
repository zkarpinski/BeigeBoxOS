/**
 * Mac OS X Tiger virtual filesystem — CRUD via @retro-web/core/fs.
 * macOS-style POSIX paths; desktop at `/Users/zkarpinski/Desktop`.
 * Applications populate `/Applications` flat-style (all apps by label).
 */

import { NOTEPAD_PENDING_KEY } from '@retro-web/core/apps/notepad';
import {
  PDF_READER_PENDING_KEY,
  PDF_CONTENT_KEY_TO_URL,
} from '@retro-web/core/apps/pdf-reader/constants';
import type { AppConfig } from '@retro-web/core/types/app-config';
import { createFileSystem } from '@retro-web/core/fs';

export { NOTEPAD_PENDING_KEY };
export { PDF_READER_PENDING_KEY };

// Re-export shared types so OS components can import from this module as before
export type { FolderNode, FileNode, AppNode, FsNode, FsTree, DirEntry } from '@retro-web/core/fs';

export const HOME_PATH = '/Users/zkarpinski';
export const DESKTOP_PATH = '/Users/zkarpinski/Desktop';
const APPLICATIONS_PATH = '/Applications';

export const FINDER_PENDING_PATH_KEY = 'finder-pending-path';

export const EXTENSION_TO_APP: Record<string, string> = {
  txt: 'notepad',
  pdf: 'pdf-reader',
};

// ── Factory instance ───────────────────────────────────────────────────────────

const fs = createFileSystem({
  storageKey: 'macosx-tiger-filesystem',
  changeEvent: 'macosx-fs-change',
  pathStyle: 'posix',
  volumes: [{ name: 'Macintosh HD', rootKey: '/' }],
  defaultIconByExt: {
    txt: 'shell/icons/text_file.png',
    pdf: 'shell/icons/pdf_file.png',
    rtf: 'shell/icons/rtf_file.png',
  },
  defaultIcon: 'shell/icons/generic_file.png',
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
} = fs;

// ── Registry reference (set by initFileSystem) ────────────────────────────────

let registryRef: AppConfig[] = [];

const DEFAULT_README = `Welcome to Mac OS X!

This is your home folder. You can store files here,
on your Desktop, or in your Documents folder.

Mac OS X 10.4 "Tiger" — April 2005
`;

function buildDefaultTree() {
  return {
    '/': {
      type: 'folder' as const,
      children: ['Users', 'Applications'],
    },
    '/Users': {
      type: 'folder' as const,
      children: ['zkarpinski'],
    },
    '/Users/zkarpinski': {
      type: 'folder' as const,
      children: ['Desktop', 'Documents'],
    },
    '/Users/zkarpinski/Desktop': {
      type: 'folder' as const,
      children: ['ReadMe.txt'],
    },
    '/Users/zkarpinski/Desktop/ReadMe.txt': {
      type: 'file' as const,
      content: DEFAULT_README,
    },
    '/Users/zkarpinski/Documents': {
      type: 'folder' as const,
      children: [],
    },
    ...fs.buildAppEntries(registryRef, {
      basePath: APPLICATIONS_PATH,
      layout: 'flat',
      excludeIds: ['finder'],
    }),
  };
}

/**
 * Call once at app load so /Applications is built from the registry.
 */
export function initFileSystem(registry: AppConfig[]): void {
  registryRef = registry;
  fs.init(buildDefaultTree);
}

/** Icon for an app shortcut in the filesystem (from registry). */
export function getAppIcon(appId: string): string {
  const app = registryRef.find((a) => a.id === appId);
  return app?.icon ?? 'shell/icons/generic_file.png';
}

/**
 * Open a file or app by path: app nodes launch the app; files open by
 * extension via sessionStorage.
 */
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
