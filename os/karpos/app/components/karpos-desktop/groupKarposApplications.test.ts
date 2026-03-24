import type { AppConfig } from '@retro-web/core/types/app-config';
import { groupKarposApplications } from './KarposApplicationsMenu';

function app(id: string, label: string, startMenu: AppConfig['startMenu']): AppConfig {
  return { id, label, icon: `/apps/${id}/icon.png`, startMenu };
}

describe('groupKarposApplications', () => {
  it('excludes apps with startMenu: false', () => {
    const { root, folderKeys } = groupKarposApplications([
      app('word', 'Word', { path: ['Programs'] }),
      app('mycomputer', 'My Computer', false),
    ]);
    expect(root.map((a) => a.id)).toEqual(['word']);
    expect(folderKeys).toEqual([]);
  });

  it('ignores apps without a startMenu object', () => {
    const { root } = groupKarposApplications([
      { id: 'orphan', label: 'Orphan', icon: 'x.png' } as AppConfig,
      app('word', 'Word', { path: ['Programs'] }),
    ]);
    expect(root.map((a) => a.id)).toEqual(['word']);
  });

  it('puts single-segment paths in root, sorted by display label', () => {
    const { root } = groupKarposApplications([
      app('z', 'Zebra', { path: ['Programs'] }),
      app('a', 'Alpha', { path: ['Programs'] }),
      app('cp', 'Control', { path: ['Settings'] }),
    ]);
    expect(root.map((a) => a.id)).toEqual(['a', 'cp', 'z']);
  });

  it('uses startMenu.label for sorting when present', () => {
    const { root } = groupKarposApplications([
      app('b', 'B', { path: ['Programs'], label: 'Microsoft Word' }),
      app('a', 'A', { path: ['Programs'], label: 'Apple' }),
    ]);
    expect(root.map((a) => a.id)).toEqual(['a', 'b']);
  });

  it('groups multi-segment paths by path.slice(1).join(" / ")', () => {
    const { folders, folderKeys } = groupKarposApplications([
      app('calc', 'Calc', { path: ['Programs', 'Accessories'] }),
      app('ms', 'Paint', { path: ['Programs', 'Accessories'] }),
      app('game', 'Pinball', { path: ['Programs', 'Games', 'Arcade'] }),
    ]);
    expect(folderKeys).toEqual(['Accessories', 'Games / Arcade']);
    expect(
      folders
        .get('Accessories')
        ?.map((a) => a.id)
        .sort(),
    ).toEqual(['calc', 'ms']);
    expect(folders.get('Games / Arcade')?.map((a) => a.id)).toEqual(['game']);
  });

  it('sorts folder keys alphabetically', () => {
    const { folderKeys } = groupKarposApplications([
      app('a', 'A', { path: ['Programs', 'Zebra'] }),
      app('b', 'B', { path: ['Programs', 'Alpha'] }),
    ]);
    expect(folderKeys).toEqual(['Alpha', 'Zebra']);
  });
});
