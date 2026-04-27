/**
 * Unified virtual filesystem factory for all BeigeBoxOS operating systems.
 *
 * Supports both Windows-style (backslash, drive letters) and POSIX-style
 * (forward slash, single root) paths via the `pathStyle` option, so any OS
 * — Win98, WinXP, KarpOS, macOS Tiger — can share the same CRUD logic with
 * zero duplication.
 *
 * Quick-start:
 *
 *   // Windows OS
 *   const fs = createFileSystem({
 *     storageKey: 'win98-filesystem',
 *     changeEvent: 'win98-fs-change',
 *     pathStyle: 'windows',
 *     volumes: [
 *       { name: '3½ Floppy (A:)', rootKey: 'A:', placeholder: true },
 *       { name: 'Local Disk (C:)',  rootKey: 'C:' },
 *       { name: 'CD-ROM Drive (D:)', rootKey: 'D:', placeholder: true },
 *     ],
 *   });
 *
 *   // POSIX OS (KarpOS, macOS Tiger)
 *   const fs = createFileSystem({
 *     storageKey: 'karpos-filesystem-linux',
 *     changeEvent: 'karpos-fs-change',
 *     pathStyle: 'posix',
 *     volumes: [{ name: 'File System', rootKey: '/' }],
 *     publicFsManifestUrl: '/fs/index.json', // optional — hydrates static files
 *   });
 *
 *   // At app startup, give the factory your OS-specific default tree:
 *   fs.init(() => buildDefaultTree());
 *
 *   // Then use the returned helpers:
 *   fs.writeFile('/home/user/hello.txt', 'Hello!');
 *   fs.listDir('/home/user'); // → DirEntry[]
 */

import type { AppConfig } from '../types/app-config';

// ── Shared node types ─────────────────────────────────────────────────────────

export type FolderNode = { type: 'folder'; children: string[] };

/** File node with optional remote-source support (KarpOS / macOS Tiger). */
export type FileNode = {
  type: 'file';
  /** Inline content (always present after a writeFile call). */
  content?: string;
  /** Opaque key for app-specific content lookup (e.g. 'resume' for Word). */
  contentKey?: string;
  /**
   * URL to a public static file served from `/fs/…`.
   * When set, `loadFileContent` fetches this URL unless `localOverride` is true.
   */
  sourcePath?: string;
  /**
   * True after the user has written their own content, preventing the public
   * source from overwriting their changes on the next hydration.
   */
  localOverride?: boolean;
};

export type AppNode = { type: 'app'; appId: string; label: string };
export type FsNode = FolderNode | FileNode | AppNode;
export type FsTree = Record<string, FsNode>;

// ── Shared result types ───────────────────────────────────────────────────────

export interface DirEntry {
  name: string;
  path: string;
  type: 'folder' | 'file' | 'app';
  node: FsNode;
  appId?: string;
}

// ── Configuration types ───────────────────────────────────────────────────────

/** Controls path separators and root convention for the whole filesystem. */
export type PathStyle = 'windows' | 'posix';

/**
 * A volume (drive/mount-point) shown in the file-manager's "My Computer" /
 * "Finder Computer" view.
 */
export interface VolumeDescriptor {
  /** Display name, e.g. "Local Disk (C:)", "Macintosh HD", "File System". */
  name: string;
  /**
   * The key used in the FsTree, e.g. "C:" (Windows) or "/" (POSIX).
   * For Windows volumes, omit the trailing backslash — normalizePath handles it.
   */
  rootKey: string;
  /**
   * When true, this volume is not stored in the tree (e.g. empty floppy/CD).
   * getDrives() returns a stub empty folder for it.
   */
  placeholder?: boolean;
}

/**
 * Describes how to populate an app-shortcuts directory from the app registry.
 * Pass this to `fs.buildAppEntries()` inside your `buildDefaultTree`.
 */
export interface AppEntryConfig {
  /**
   * Root path for app shortcuts.
   * Windows: "C:\\Program Files"  |  POSIX: "/opt" or "/Applications"
   */
  basePath: string;
  /**
   * - "startMenu": reads `app.startMenu.path` to build a nested folder hierarchy.
   *   Suitable for Win98, WinXP, KarpOS.
   * - "flat": places every app directly under `basePath`.
   *   Suitable for macOS Tiger's /Applications folder.
   */
  layout: 'startMenu' | 'flat';
  /** For flat layout — key each entry by app.label (default) or app.id. */
  flatKeyBy?: 'label' | 'id';
  /** App IDs to skip (e.g. macOS Tiger skips "finder"). */
  excludeIds?: string[];
}

/** Full options for createFileSystem(). */
export interface FileSystemOptions {
  /** localStorage key for persisting the tree (e.g. "win98-filesystem"). */
  storageKey: string;
  /** CustomEvent name dispatched on every write (e.g. "win98-fs-change"). */
  changeEvent: string;
  /**
   * Path convention for this OS:
   * - "windows" — backslash separators, uppercase drive roots (C:, A:).
   * - "posix"   — forward slash separators, single root (/).
   */
  pathStyle: PathStyle;
  /**
   * Volumes shown in the file manager's computer/drives view.
   * The first non-placeholder volume is treated as the primary drive.
   */
  volumes: VolumeDescriptor[];
  /**
   * URL to a JSON manifest that hydrates public static files into the tree.
   * Expected shape: `{ entries: Array<{ path: string; type: 'file' | 'folder' }> }`.
   * Fetch is attempted once when `init()` is called (KarpOS uses this for /fs/).
   * Omit for OSes that have no public /fs/ directory.
   */
  publicFsManifestUrl?: string;
  /** Maps file extensions → icon paths for `getFileIconPath()`. */
  defaultIconByExt?: Record<string, string>;
  /** Fallback icon path when no extension match is found. */
  defaultIcon?: string;
}

// ── Factory ───────────────────────────────────────────────────────────────────

export function createFileSystem(options: FileSystemOptions) {
  const {
    storageKey,
    changeEvent,
    pathStyle,
    volumes,
    publicFsManifestUrl,
    defaultIconByExt = {},
    defaultIcon = 'shell/icons/notepad_file.png',
  } = options;

  let cachedTree: FsTree | null = null;
  let defaultTreeFn: (() => FsTree) | null = null;
  let publicFsHydrated = false;
  let publicFsHydrating = false;

  // ── Path helpers ────────────────────────────────────────────────────────────

  function normalizePath(p: string): string {
    if (pathStyle === 'windows') {
      const s = p.replace(/\//g, '\\').trim();
      if (!s) return s;
      const parts = s.split('\\').filter(Boolean);
      if (parts.length === 0) return s;
      const first = parts[0].toUpperCase();
      if (first.endsWith(':')) parts[0] = first;
      return parts.join('\\');
    } else {
      const s = p.replace(/\\/g, '/').trim();
      if (!s) return '';
      const parts = s.split('/').filter(Boolean);
      if (parts.length === 0) return '/';
      return '/' + parts.join('/');
    }
  }

  function joinPath(parent: string, name: string): string {
    const p = normalizePath(parent);
    if (pathStyle === 'windows') {
      return p ? p + '\\' + name : name;
    } else {
      return !p || p === '/' ? '/' + name : p + '/' + name;
    }
  }

  function getParentPath(path: string): string {
    const n = normalizePath(path);
    if (pathStyle === 'windows') {
      if (!n) return '';
      const parts = n.split('\\').filter(Boolean);
      return parts.length <= 1 ? '' : parts.slice(0, -1).join('\\');
    } else {
      if (!n || n === '/') return '';
      const parts = n.split('/').filter(Boolean);
      return parts.length <= 1 ? '/' : '/' + parts.slice(0, -1).join('/');
    }
  }

  function basename(path: string): string {
    const n = normalizePath(path);
    const sep = pathStyle === 'windows' ? '\\' : '/';
    const parts = n.split(sep).filter(Boolean);
    return parts.length ? parts[parts.length - 1]! : n;
  }

  /**
   * Splits a normalized path into [name, parentPath].
   * Windows: "C:\\Foo\\bar.txt" → ["bar.txt", "C:\\Foo"]
   * POSIX:   "/home/user/hi.txt" → ["hi.txt", "/home/user"]
   */
  function splitNameAndParent(normalized: string): [string, string] {
    if (pathStyle === 'windows') {
      const parts = normalized.split('\\').filter(Boolean);
      const name = parts.pop() ?? '';
      const parent = parts.join('\\');
      return [name, parent];
    } else {
      const parts = normalized.split('/').filter(Boolean);
      const name = parts.pop() ?? '';
      const parent = parts.length ? '/' + parts.join('/') : '/';
      return [name, parent];
    }
  }

  // ── Extension helper ────────────────────────────────────────────────────────

  function getExtension(name: string): string | null {
    const m = name.match(/\.([a-zA-Z0-9]+)$/);
    return m ? m[1].toLowerCase() : null;
  }

  // ── Storage ─────────────────────────────────────────────────────────────────

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
    return cachedTree!;
  }

  // ── Public FS manifest hydration ────────────────────────────────────────────

  type ManifestEntry = { path: string; type: 'file' | 'folder' };

  function upsertPublicEntry(tree: FsTree, entry: ManifestEntry): void {
    const normalized = normalizePath(entry.path);
    if (!normalized) return;
    if (pathStyle === 'posix' && normalized === '/') return;

    const [name, parentPath] = splitNameAndParent(normalized);
    if (!name) return;

    if (parentPath && !tree[parentPath]) {
      tree[parentPath] = { type: 'folder', children: [] };
    }
    if (parentPath && tree[parentPath]?.type === 'folder') {
      const p = tree[parentPath] as FolderNode;
      if (!p.children.includes(name)) p.children.push(name);
    }

    if (entry.type === 'folder') {
      if (!tree[normalized]) tree[normalized] = { type: 'folder', children: [] };
      return;
    }

    // Compute the base URL for file fetches: strip the manifest filename
    const fsBase = publicFsManifestUrl
      ? publicFsManifestUrl.slice(0, publicFsManifestUrl.lastIndexOf('/'))
      : '';

    const existing = tree[normalized];
    const existingFile = existing?.type === 'file' ? existing : null;
    const localOverride = existingFile?.localOverride === true;

    tree[normalized] = {
      type: 'file',
      sourcePath: `${fsBase}${normalized}`,
      localOverride,
      content: localOverride ? existingFile?.content : undefined,
    };
  }

  /**
   * Fetches the public FS manifest and merges its entries into the tree.
   * Called automatically by `init()` when `publicFsManifestUrl` is set.
   * Exposed so callers can also await it before reading (e.g. openFileByPath).
   */
  async function hydrateFromManifest(): Promise<void> {
    if (!publicFsManifestUrl) return;
    if (publicFsHydrated || publicFsHydrating) return;
    if (typeof window === 'undefined') return;
    publicFsHydrating = true;
    try {
      const res = await fetch(publicFsManifestUrl, { cache: 'no-store' });
      if (!res.ok) {
        publicFsHydrated = true;
        return;
      }
      const manifest = (await res.json()) as { entries: ManifestEntry[] };
      const entries = Array.isArray(manifest.entries) ? manifest.entries : [];
      if (!entries.length) {
        publicFsHydrated = true;
        return;
      }
      const tree = { ...loadTree() };
      for (const entry of entries) {
        if (!entry?.path || (entry.type !== 'file' && entry.type !== 'folder')) continue;
        upsertPublicEntry(tree, entry);
      }
      saveTree(tree);
      publicFsHydrated = true;
    } catch {
      publicFsHydrated = true;
    } finally {
      publicFsHydrating = false;
    }
  }

  // ── Read operations ─────────────────────────────────────────────────────────

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
    const tree = loadTree();
    return volumes.map((v) => {
      const path = pathStyle === 'windows' ? v.rootKey + '\\' : v.rootKey;
      const node: FsNode = v.placeholder
        ? { type: 'folder', children: [] }
        : (tree[v.rootKey] ?? { type: 'folder', children: [] });
      return { name: v.name, path, type: 'folder' as const, node };
    });
  }

  function getFileIconPath(name: string, _path?: string): string {
    const ext = getExtension(name);
    return (ext && defaultIconByExt[ext]) || defaultIcon;
  }

  // ── Remote file content ─────────────────────────────────────────────────────

  /**
   * Loads the content of a file node.
   * If the node has a `sourcePath` and no `localOverride`, fetches from that URL.
   * Otherwise falls back to the inline `content` field.
   */
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

  // ── Write operations ────────────────────────────────────────────────────────

  function writeFile(path: string, content: string): void {
    const normalized = normalizePath(path);
    if (!normalized) return;
    if (pathStyle === 'posix' && normalized === '/') return;

    const [name, parent] = splitNameAndParent(normalized);
    if (!name) return;

    const tree = loadTree();
    const parentNode = tree[parent];
    if (!parentNode || parentNode.type !== 'folder') return;

    const children = [...parentNode.children];
    if (!children.includes(name)) {
      children.push(name);
      tree[parent] = { type: 'folder', children };
    }
    const existing = tree[normalized];
    const sourcePath = existing?.type === 'file' ? existing.sourcePath : undefined;
    tree[normalized] = { type: 'file', content, sourcePath, localOverride: true };
    saveTree(tree);
  }

  function createFolder(path: string): void {
    const normalized = normalizePath(path);
    if (!normalized) return;
    if (pathStyle === 'posix' && normalized === '/') return;
    if (getNode(normalized)) return;

    const [name, parent] = splitNameAndParent(normalized);
    if (!name) return;

    const tree = loadTree();
    const parentNode = tree[parent];
    if (!parentNode || parentNode.type !== 'folder') return;

    tree[parent] = { type: 'folder', children: [...parentNode.children, name] };
    tree[normalized] = { type: 'folder', children: [] };
    saveTree(tree);
  }

  function deletePath(path: string): void {
    const normalized = normalizePath(path);
    if (!normalized) return;
    if (pathStyle === 'posix' && normalized === '/') return;
    // Protect Windows drive roots (e.g. "C:", "A:")
    if (pathStyle === 'windows' && /^[A-Z]:$/.test(normalized)) return;

    const node = getNode(normalized);
    if (!node) return;

    const tree = loadTree();
    const [name, parent] = splitNameAndParent(normalized);
    if (!name) return;

    if (parent && tree[parent]?.type === 'folder') {
      const p = tree[parent] as FolderNode;
      tree[parent] = { type: 'folder', children: p.children.filter((c) => c !== name) };
    }
    delete tree[normalized];
    if (node.type === 'folder') {
      for (const child of node.children) {
        deletePath(joinPath(normalized, child));
      }
    }
    saveTree(tree);
  }

  function renamePath(oldPath: string, newPath: string): void {
    const normalizedOld = normalizePath(oldPath);
    const normalizedNew = normalizePath(newPath);
    if (!normalizedOld || !normalizedNew) return;
    if (pathStyle === 'posix' && (normalizedOld === '/' || normalizedNew === '/')) return;
    if (normalizedOld === normalizedNew) return;

    const node = getNode(normalizedOld);
    if (!node) return;
    if (getNode(normalizedNew)) return;

    const tree = loadTree();
    const [oldName, oldParent] = splitNameAndParent(normalizedOld);
    const [newName, newParent] = splitNameAndParent(normalizedNew);
    if (!newName) return;

    // Remove from old parent
    if (oldParent && tree[oldParent]?.type === 'folder') {
      const p = tree[oldParent] as FolderNode;
      tree[oldParent] = { type: 'folder', children: p.children.filter((c) => c !== oldName) };
    }

    // Add to new parent
    if (!tree[newParent]) tree[newParent] = { type: 'folder', children: [] };
    const newParentNode = tree[newParent];
    if (newParentNode?.type === 'folder' && !newParentNode.children.includes(newName)) {
      tree[newParent] = { type: 'folder', children: [...newParentNode.children, newName] };
    }

    tree[normalizedNew] = node;
    delete tree[normalizedOld];

    // Recursively repath children of renamed folders
    if (node.type === 'folder') {
      const repathChildren = (oldBase: string, newBase: string) => {
        const n = tree[newBase];
        if (n?.type !== 'folder') return;
        for (const childName of n.children) {
          const childOld = joinPath(oldBase, childName);
          const childNew = joinPath(newBase, childName);
          if (tree[childOld]) {
            tree[childNew] = tree[childOld];
            delete tree[childOld];
            repathChildren(childOld, childNew);
          }
        }
      };
      repathChildren(normalizedOld, normalizedNew);
    }

    saveTree(tree);
  }

  // ── App entry builder ───────────────────────────────────────────────────────

  /**
   * Builds a subtree of app shortcuts from an app registry.
   * Spread the result into your `buildDefaultTree()`:
   *
   *   return {
   *     'C:': { type: 'folder', children: ['Program Files'] },
   *     ...fs.buildAppEntries(registry, { basePath: 'C:\\Program Files', layout: 'startMenu' }),
   *   };
   */
  function buildAppEntries(registry: AppConfig[], config: AppEntryConfig): FsTree {
    const { basePath, layout, flatKeyBy = 'label', excludeIds = [] } = config;
    const result: FsTree = {
      [basePath]: { type: 'folder', children: [] },
    };

    if (layout === 'flat') {
      for (const app of registry) {
        if (excludeIds.includes(app.id)) continue;
        const key = flatKeyBy === 'id' ? app.id : app.label;
        const appPath = joinPath(basePath, key);
        result[appPath] = { type: 'app', appId: app.id, label: app.label };
        const folder = result[basePath] as FolderNode;
        if (!folder.children.includes(key)) folder.children.push(key);
      }
    } else {
      // startMenu layout: respect app.startMenu.path hierarchy
      for (const app of registry) {
        if (excludeIds.includes(app.id)) continue;
        const menu = app.startMenu && typeof app.startMenu === 'object' ? app.startMenu : null;
        if (!menu || !Array.isArray(menu.path) || menu.path[0] !== 'Programs') continue;

        const subPath = menu.path.slice(1);
        let current = basePath;
        for (const segment of subPath) {
          const next = joinPath(current, segment);
          if (!result[next]) result[next] = { type: 'folder', children: [] };
          const folder = result[current] as FolderNode;
          if (!folder.children.includes(segment)) folder.children.push(segment);
          current = next;
        }

        const appKey = app.id;
        const appPath = joinPath(current, appKey);
        result[appPath] = { type: 'app', appId: app.id, label: menu.label ?? app.label };
        const folder = result[current] as FolderNode;
        if (!folder.children.includes(appKey)) folder.children.push(appKey);
      }
    }

    return result;
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  /**
   * Call once at app startup (before any other operations) to provide the
   * OS-specific default tree and reset the in-memory cache.
   * If `publicFsManifestUrl` is set, manifest hydration starts automatically.
   */
  function init(getDefaultTree: () => FsTree): void {
    defaultTreeFn = getDefaultTree;
    cachedTree = null;
    if (publicFsManifestUrl) {
      publicFsHydrated = false;
      publicFsHydrating = false;
      void hydrateFromManifest();
    }
  }

  /** Reset all state (useful in tests). */
  function reset(): void {
    defaultTreeFn = null;
    cachedTree = null;
    publicFsHydrated = false;
    publicFsHydrating = false;
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  return {
    // Lifecycle
    init,
    reset,
    // Path utilities
    normalizePath,
    joinPath,
    getParentPath,
    basename,
    // Read
    getFsTree,
    getNode,
    listDir,
    getDrives,
    getFileIconPath,
    // Remote content
    loadFileContent,
    hydrateFromManifest,
    // Write
    writeFile,
    createFolder,
    deletePath,
    renamePath,
    // Builder
    buildAppEntries,
  };
}
