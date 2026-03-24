/**
 * @jest-environment jsdom
 */
import {
  DESKTOP_PATH,
  getDrives,
  getFileIconPath,
  getParentPath,
  initFileSystem,
  listDir,
} from './fileSystem';
import type { AppConfig } from '@retro-web/core/types/app-config';

describe('fileSystem path helpers', () => {
  describe('getParentPath', () => {
    it('returns parent for nested paths', () => {
      expect(getParentPath('C:\\Windows\\Desktop')).toBe('C:\\Windows');
      expect(getParentPath('C:\\Windows')).toBe('C:');
    });

    it('returns empty string for drive root', () => {
      expect(getParentPath('C:')).toBe('');
      expect(getParentPath('C:\\')).toBe('');
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
    localStorage.clear();
    initFileSystem(minimalRegistry);
  });

  it('lists default desktop entries including TODO and resume', () => {
    const entries = listDir(DESKTOP_PATH);
    const names = entries.map((e) => e.name).sort();
    expect(names).toEqual(['My Resume.doc', 'My Resume.pdf', 'TODO.txt']);
  });

  it('getDrives returns floppy, C, and CD-ROM', () => {
    const drives = getDrives();
    expect(drives).toHaveLength(3);
    expect(drives.map((d) => d.path)).toEqual(['A:\\', 'C:\\', 'D:\\']);
  });
});
