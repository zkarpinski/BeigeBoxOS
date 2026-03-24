/**
 * @jest-environment jsdom
 */
import {
  __resetFileSystemStateForTests,
  DESKTOP_PATH,
  getDrives,
  getFileIconPath,
  getNode,
  getParentPath,
  initFileSystem,
  listDir,
  openFileByPath,
  PAD_PENDING_KEY,
  writeFile,
} from './fileSystem';
import type { AppConfig } from '@retro-web/core/types/app-config';

describe('fileSystem path helpers', () => {
  describe('getParentPath', () => {
    it('returns parent for nested POSIX paths', () => {
      expect(getParentPath('/home/zkarpinski/Desktop')).toBe('/home/zkarpinski');
      expect(getParentPath('/home/zkarpinski')).toBe('/home');
      expect(getParentPath('/home')).toBe('/');
    });

    it('returns empty string for filesystem root', () => {
      expect(getParentPath('/')).toBe('');
    });
  });

  describe('getFileIconPath', () => {
    it('maps known extensions', () => {
      expect(getFileIconPath('readme.txt')).toBe('shell/icons/notepad_file.png');
      expect(getFileIconPath('doc.doc')).toBe('apps/word/word-icon.png');
      expect(getFileIconPath('resume.pdf')).toBe('shell/icons/adobe-pdf-modern-icon.png');
    });

    it('falls back to default for unknown extensions', () => {
      expect(getFileIconPath('file.xyz')).toBe('shell/icons/notepad_file.png');
    });
  });
});

describe('fileSystem init + listDir', () => {
  const minimalRegistry: AppConfig[] = [
    { id: 'word', label: 'Word', icon: 'apps/word/icon.png', startMenu: { path: ['Programs'] } },
  ];

  beforeEach(() => {
    __resetFileSystemStateForTests();
    jest.restoreAllMocks();
    (global as typeof globalThis & { fetch?: jest.Mock }).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ entries: [] }),
    });
    localStorage.clear();
    initFileSystem(minimalRegistry);
  });

  it('lists default desktop entries including TODO and resume', () => {
    const entries = listDir(DESKTOP_PATH);
    const names = entries.map((e) => e.name).sort();
    expect(names).toEqual(['My Resume.pdf', 'Projects', 'TODO.md']);
  });

  it('getDrives returns filesystem root', () => {
    const drives = getDrives();
    expect(drives).toHaveLength(1);
    expect(drives.map((d) => d.path)).toEqual(['/']);
  });
});

describe('fileSystem public fs hydration + file opening', () => {
  const registry: AppConfig[] = [
    { id: 'word', label: 'Word', icon: 'apps/word/icon.png', startMenu: { path: ['Programs'] } },
  ];

  beforeEach(() => {
    __resetFileSystemStateForTests();
    jest.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('hydrates desktop entries from /fs/index.json manifest', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          entries: [
            { path: '/home/zkarpinski/Desktop/Ideas.md', type: 'file' },
            { path: '/home/zkarpinski/Desktop/Notes', type: 'folder' },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => '# Ideas',
      });
    (global as typeof globalThis & { fetch?: jest.Mock }).fetch = fetchMock;

    initFileSystem(registry);
    await openFileByPath('/home/zkarpinski/Desktop/Ideas.md', jest.fn());

    const names = listDir(DESKTOP_PATH).map((e) => e.name);
    expect(names).toContain('Ideas.md');
    expect(names).toContain('Notes');
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/fs/index.json', { cache: 'no-store' });
  });

  it('opens markdown in pad and stores pending payload from sourcePath content', async () => {
    const showApp = jest.fn();
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ entries: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => '# Roadmap\n\n- [ ] Item',
      });
    (global as typeof globalThis & { fetch?: jest.Mock }).fetch = fetchMock;

    initFileSystem(registry);
    await openFileByPath('/home/zkarpinski/Desktop/TODO.md', showApp);

    expect(showApp).toHaveBeenCalledWith('pad');
    const raw = sessionStorage.getItem(PAD_PENDING_KEY);
    expect(raw).toBeTruthy();
    expect(raw ? JSON.parse(raw).content : '').toContain('# Roadmap');
  });

  it('prefers local override content over sourcePath fetch after writeFile', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ entries: [] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        text: async () => '# from-disk',
      });
    (global as typeof globalThis & { fetch?: jest.Mock }).fetch = fetchMock;

    initFileSystem(registry);
    await openFileByPath('/home/zkarpinski/Desktop/TODO.md', jest.fn());

    writeFile('/home/zkarpinski/Desktop/TODO.md', '# from-local');
    const node = getNode('/home/zkarpinski/Desktop/TODO.md');
    expect(node && node.type === 'file' ? node.localOverride : false).toBe(true);

    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: async () => '# should-not-be-used',
    });

    await openFileByPath('/home/zkarpinski/Desktop/TODO.md', jest.fn());
    const raw = sessionStorage.getItem(PAD_PENDING_KEY);
    expect(raw ? JSON.parse(raw).content : '').toContain('# from-local');
  });
});
