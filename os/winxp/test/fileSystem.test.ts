import {
  normalizePath,
  getParentPath,
  initFileSystem,
  getFsTree,
  getNode,
  listDir,
  writeFile,
  deletePath,
  createFolder,
  USER_PROFILE_NAME,
  DESKTOP_PATH,
} from '../app/fileSystem';
import type { AppConfig } from '../app/types/app-config';

const mockRegistry: AppConfig[] = [
  {
    id: 'notepad',
    label: 'Notepad',
    icon: 'icon.png',
    startMenu: { path: ['Programs', 'Accessories'] },
  },
];

describe('WinXP FileSystem', () => {
  beforeEach(() => {
    localStorage.clear();
    initFileSystem(mockRegistry);
  });

  describe('normalizePath', () => {
    test('converts forward slashes to backslashes', () => {
      expect(normalizePath('C:/Windows/System32')).toBe('C:\\Windows\\System32');
    });

    test('trims whitespace', () => {
      expect(normalizePath('  C:\\Windows  ')).toBe('C:\\Windows');
    });

    test('uppercases drive letter', () => {
      expect(normalizePath('c:\\windows')).toBe('C:\\windows');
    });
  });

  describe('getParentPath', () => {
    test('returns parent directory', () => {
      expect(getParentPath('C:\\Windows\\System32')).toBe('C:\\Windows');
    });

    test('returns empty string for root drive', () => {
      expect(getParentPath('C:\\')).toBe('');
      expect(getParentPath('C:')).toBe('');
    });
  });

  describe('initFileSystem and Default Tree', () => {
    test('initializes default tree with registry apps', () => {
      const tree = getFsTree();
      expect(tree['C:']).toBeDefined();
      expect(tree['C:\\Program Files\\Accessories\\notepad']).toBeDefined();
      expect(tree[DESKTOP_PATH]).toBeDefined();
    });

    test('Desktop contains TODO.txt but not My Resume.doc (as per recent change)', () => {
      const desktop = getNode(DESKTOP_PATH);
      if (desktop?.type === 'folder') {
        expect(desktop.children).toContain('TODO.txt');
        expect(desktop.children).not.toContain('My Resume.doc');
      } else {
        fail('Desktop is not a folder');
      }
    });
  });

  describe('Operations', () => {
    test('writeFile creates a new file', () => {
      const path = `${DESKTOP_PATH}\\newfile.txt`;
      writeFile(path, 'hello world');
      const node = getNode(path);
      expect(node).toBeDefined();
      expect(node?.type).toBe('file');
      if (node?.type === 'file') {
        expect(node.content).toBe('hello world');
      }

      const desktop = getNode(DESKTOP_PATH);
      if (desktop?.type === 'folder') {
        expect(desktop.children).toContain('newfile.txt');
      }
    });

    test('createFolder creates a new folder', () => {
      const path = `${DESKTOP_PATH}\\New Folder`;
      createFolder(path);
      const node = getNode(path);
      expect(node).toBeDefined();
      expect(node?.type).toBe('folder');

      const desktop = getNode(DESKTOP_PATH);
      if (desktop?.type === 'folder') {
        expect(desktop.children).toContain('New Folder');
      }
    });

    test('deletePath removes a file', () => {
      const path = `${DESKTOP_PATH}\\TODO.txt`;
      expect(getNode(path)).toBeDefined();
      deletePath(path);
      expect(getNode(path)).toBeNull();

      const desktop = getNode(DESKTOP_PATH);
      if (desktop?.type === 'folder') {
        expect(desktop.children).not.toContain('TODO.txt');
      }
    });

    test('listDir returns entries for a folder', () => {
      const entries = listDir(DESKTOP_PATH);
      expect(entries.length).toBeGreaterThan(0);
      expect(entries.some((e) => e.name === 'TODO.txt')).toBe(true);
    });
  });
});
