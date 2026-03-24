'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { AppWindow, TitleBar } from '../../winxp';
import { useWindowManager } from '@retro-web/core/context';
import type { AppConfig } from '@retro-web/core/types/app-config';
import {
  MOCK_STREAMING_SONGS,
  formatDurationMmSs,
  openSpotifyForTrack,
  type StreamingSongTuple,
} from '@retro-web/core/music';
import './itunes8.css';

const ICON_SRC = 'apps/itunes8/itunes8-icon.png';

export const itunes8AppConfig: AppConfig = {
  id: 'itunes8',
  label: 'iTunes',
  icon: ICON_SRC,
  desktop: true,
  startMenu: { path: ['Programs', 'Entertainment'] },
  taskbarLabel: 'iTunes',
};

type Row = { artist: string; title: string; seconds: number; genre: string; album: string };

function tupleToRow(t: StreamingSongTuple): Row {
  const album = t.length === 5 ? t[4] : `${t[0]} (Collection)`;
  return { artist: t[0], title: t[1], seconds: t[2], genre: t[3], album };
}

function rowKey(r: Row): string {
  return `${r.artist}\u0000${r.album}\u0000${r.title}`;
}

function fakePlays(title: string): number {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) >>> 0;
  return (h % 420) + 12;
}

type AlbumGroup = { artist: string; album: string; tracks: Row[] };

/** Same column widths on the sticky header and every album subtable (new instance per table). */
function TrackColgroup() {
  return (
    <colgroup className="itunes8-track-cols">
      <col className="itunes8-cg-check" />
      <col className="itunes8-cg-name" />
      <col className="itunes8-cg-time" />
      <col className="itunes8-cg-artist" />
      <col className="itunes8-cg-genre" />
      <col className="itunes8-cg-rating" />
      <col className="itunes8-cg-plays" />
    </colgroup>
  );
}

const ItunesIcon = (
  <img src={ICON_SRC} alt="" style={{ width: 16, height: 16, marginRight: 4, flexShrink: 0 }} />
);

export function Itunes8Window() {
  const { hideApp, openDialog } = useWindowManager();
  const addFileInputRef = useRef<HTMLInputElement>(null);

  const libraryRows = useMemo(() => {
    const rows = MOCK_STREAMING_SONGS.map(tupleToRow);
    rows.sort((a, b) => {
      if (a.artist !== b.artist) return a.artist.localeCompare(b.artist);
      if (a.album !== b.album) return a.album.localeCompare(b.album);
      return a.title.localeCompare(b.title);
    });
    return rows;
  }, []);

  const [search, setSearch] = useState('');
  const [selectedKey, setSelectedKey] = useState<string>(() =>
    libraryRows[0] ? rowKey(libraryRows[0]) : '',
  );
  const [nowPlayingKey, setNowPlayingKey] = useState<string>(() =>
    libraryRows[0] ? rowKey(libraryRows[0]) : '',
  );
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'coverflow'>('list');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return libraryRows;
    return libraryRows.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.artist.toLowerCase().includes(q) ||
        r.genre.toLowerCase().includes(q) ||
        r.album.toLowerCase().includes(q),
    );
  }, [libraryRows, search]);

  const albumGroups = useMemo(() => {
    const map = new Map<string, Row[]>();
    for (const r of filtered) {
      const k = `${r.artist}\u0000${r.album}`;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(r);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => a.title.localeCompare(b.title));
    }
    const groups: AlbumGroup[] = [];
    for (const [k, tracks] of map) {
      const sep = k.indexOf('\u0000');
      const artist = k.slice(0, sep);
      const album = k.slice(sep + 1);
      groups.push({ artist, album, tracks });
    }
    groups.sort((a, b) => {
      const aSpot = a.artist === 'U2' && a.album === 'Songs of Innocence' ? 0 : 1;
      const bSpot = b.artist === 'U2' && b.album === 'Songs of Innocence' ? 0 : 1;
      if (aSpot !== bSpot) return aSpot - bSpot;
      if (a.artist !== b.artist) return a.artist.localeCompare(b.artist);
      return a.album.localeCompare(b.album);
    });
    return groups;
  }, [filtered]);

  const flatOrder = useMemo(() => albumGroups.flatMap((g) => g.tracks), [albumGroups]);

  useEffect(() => {
    if (!flatOrder.length) return;
    if (!flatOrder.some((r) => rowKey(r) === nowPlayingKey)) {
      setNowPlayingKey(rowKey(flatOrder[0]));
    }
    if (!flatOrder.some((r) => rowKey(r) === selectedKey)) {
      setSelectedKey(rowKey(flatOrder[0]));
    }
  }, [flatOrder, nowPlayingKey, selectedKey]);

  const current = useMemo(() => {
    const found = flatOrder.find((r) => rowKey(r) === nowPlayingKey);
    return found ?? flatOrder[0] ?? libraryRows[0] ?? null;
  }, [flatOrder, nowPlayingKey, libraryRows]);

  const duration = current?.seconds ?? 0;

  useEffect(() => {
    setElapsed(0);
  }, [nowPlayingKey]);

  useEffect(() => {
    if (!playing || duration <= 0) return;
    const id = window.setInterval(() => {
      setElapsed((e) => {
        if (e + 1 >= duration) {
          setPlaying(false);
          return 0;
        }
        return e + 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [playing, duration]);

  const resetProgress = useCallback(() => {
    setElapsed(0);
  }, []);

  const playRow = useCallback(
    (r: Row) => {
      setNowPlayingKey(rowKey(r));
      setSelectedKey(rowKey(r));
      resetProgress();
      setPlaying(true);
    },
    [resetProgress],
  );

  const togglePlay = () => {
    if (!current) return;
    setPlaying((p) => !p);
  };

  const stepTrack = (delta: number) => {
    if (!flatOrder.length) return;
    const idx = flatOrder.findIndex((r) => rowKey(r) === nowPlayingKey);
    const base = idx >= 0 ? idx : 0;
    const next = Math.max(0, Math.min(flatOrder.length - 1, base + delta));
    const row = flatOrder[next];
    setNowPlayingKey(rowKey(row));
    setSelectedKey(rowKey(row));
    resetProgress();
  };

  const remaining = Math.max(0, duration - elapsed);
  const progressPct = duration > 0 ? Math.min(100, (elapsed / duration) * 100) : 0;

  const totalSeconds = useMemo(() => libraryRows.reduce((s, r) => s + r.seconds, 0), [libraryRows]);
  const totalDays = (totalSeconds / 86400).toFixed(1);
  const totalGb = ((libraryRows.length * 4.2) / 1024).toFixed(2);

  const albumArtClass = (g: AlbumGroup): string => {
    if (g.artist === 'U2' && g.album === 'Songs of Innocence') return 'itunes8-album-art u2-soi';
    return 'itunes8-album-art';
  };

  const showStub = useCallback(
    (title: string, message: string) => {
      void openDialog({ type: 'info', title, message, buttons: ['OK'] });
    },
    [openDialog],
  );

  const onAddFileToLibrary = useCallback(() => {
    addFileInputRef.current?.click();
  }, []);

  const onAddFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      e.target.value = '';
      const n = files?.length ?? 0;
      if (n > 0) {
        void openDialog({
          type: 'info',
          title: 'iTunes',
          message: `Ready to add ${n} ${n === 1 ? 'file' : 'files'}. This demo uses a built-in library only — your tracks were not imported.`,
          buttons: ['OK'],
        });
      }
    },
    [openDialog],
  );

  const onExit = useCallback(() => {
    hideApp('itunes8');
  }, [hideApp]);

  const albumArtLabel = (g: AlbumGroup): React.ReactNode => {
    if (g.artist === 'U2' && g.album === 'Songs of Innocence') {
      return (
        <>
          SONGS OF
          <br />
          INNOCENCE
        </>
      );
    }
    const words = g.album.split(' ');
    if (words.length <= 3) return g.album;
    return (
      <>
        {words.slice(0, 2).join(' ')}
        <br />
        {words.slice(2).join(' ')}
      </>
    );
  };

  return (
    <AppWindow
      id="itunes8-window"
      appId="itunes8"
      allowResize
      className="itunes8-outer app-window app-window-hidden"
      titleBar={<TitleBar title="iTunes" icon={ItunesIcon} showMin showMax showClose />}
    >
      <div className="itunes8-root">
        <div className="itunes8-menubar">
          <input
            ref={addFileInputRef}
            type="file"
            className="itunes8-file-import-input"
            accept="audio/*,.mp3,.m4a,.aac,.wav,audio/mpeg"
            multiple
            tabIndex={-1}
            onChange={onAddFileChange}
          />
          <div className="itunes8-menu-item" tabIndex={0}>
            <span>
              <u>F</u>ile
            </span>
            <div className="itunes8-menu-dropdown" role="menu">
              <button
                type="button"
                className="itunes8-menu-dd-item"
                role="menuitem"
                onClick={onAddFileToLibrary}
              >
                <span>
                  Add <u>F</u>ile to Library…
                </span>
              </button>
              <div className="itunes8-menu-dd-item disabled" aria-disabled>
                <span>
                  Add <u>F</u>older to Library…
                </span>
              </div>
              <div className="itunes8-menu-dd-divider" role="separator" />
              <button
                type="button"
                className="itunes8-menu-dd-item"
                role="menuitem"
                onClick={() =>
                  showStub(
                    'New Playlist',
                    'Create playlists from the playlist section in the sidebar.',
                  )
                }
              >
                <span>
                  <u>N</u>ew Playlist
                </span>
              </button>
              <div className="itunes8-menu-dd-item disabled" aria-disabled>
                <span>
                  New <u>S</u>mart Playlist…
                </span>
              </div>
              <div className="itunes8-menu-dd-divider" role="separator" />
              <button
                type="button"
                className="itunes8-menu-dd-item"
                role="menuitem"
                onClick={() =>
                  showStub('Page Setup', 'Page setup is not available in this simulation.')
                }
              >
                <span>
                  Page <u>S</u>etup…
                </span>
              </button>
              <button
                type="button"
                className="itunes8-menu-dd-item"
                role="menuitem"
                onClick={() => showStub('Print', 'Printing is not available in this simulation.')}
              >
                <span>
                  <u>P</u>rint…
                </span>
              </button>
              <div className="itunes8-menu-dd-divider" role="separator" />
              <button
                type="button"
                className="itunes8-menu-dd-item"
                role="menuitem"
                onClick={onExit}
              >
                <span>
                  E<u>x</u>it
                </span>
              </button>
            </div>
          </div>
          <span>
            <u>E</u>dit
          </span>
          <span>
            <u>V</u>iew
          </span>
          <span>
            <u>C</u>ontrols
          </span>
          <span>
            S<u>t</u>ore
          </span>
          <span>
            <u>A</u>dvanced
          </span>
          <span>
            <u>H</u>elp
          </span>
        </div>

        <div className="itunes8-toolbar">
          <div className="itunes8-transport">
            <button
              type="button"
              className="itunes8-tbtn"
              title="Previous"
              aria-label="Previous"
              onClick={() => stepTrack(-1)}
            >
              ⏮
            </button>
            <button
              type="button"
              className="itunes8-tbtn"
              title={playing ? 'Pause' : 'Play'}
              aria-label={playing ? 'Pause' : 'Play'}
              onClick={togglePlay}
            >
              {playing ? '⏸' : '▶'}
            </button>
            <button
              type="button"
              className="itunes8-tbtn"
              title="Next"
              aria-label="Next"
              onClick={() => stepTrack(1)}
            >
              ⏭
            </button>
          </div>
          <input
            className="itunes8-volume"
            type="range"
            min={0}
            max={100}
            defaultValue={72}
            aria-label="Volume"
          />
          <div className="itunes8-lcd">
            <div className="itunes8-lcd-title">{current?.title ?? '—'}</div>
            <div className="itunes8-lcd-sub">{current?.artist ?? ''}</div>
            <div className="itunes8-lcd-bar-wrap">
              <div className="itunes8-lcd-bar-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="itunes8-lcd-times">
              <span>{formatDurationMmSs(elapsed)}</span>
              <span>-{formatDurationMmSs(remaining)}</span>
            </div>
          </div>
          <div className="itunes8-views">
            <button
              type="button"
              className={`itunes8-view-btn${viewMode === 'list' ? ' active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
            <button
              type="button"
              className={`itunes8-view-btn${viewMode === 'grid' ? ' active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              Grid
            </button>
            <button
              type="button"
              className={`itunes8-view-btn${viewMode === 'coverflow' ? ' active' : ''}`}
              onClick={() => setViewMode('coverflow')}
            >
              Cover Flow
            </button>
          </div>
          <div className="itunes8-search-wrap">
            <span style={{ opacity: 0.7 }}>🔍</span>
            <input
              className="itunes8-search"
              placeholder="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search library"
            />
          </div>
        </div>

        <div className="itunes8-body">
          <aside className="itunes8-sidebar" aria-label="Source list">
            <div className="itunes8-side-h">LIBRARY</div>
            <div className="itunes8-side-item selected">
              <span>🎵</span> Music
            </div>
            <div className="itunes8-side-item">
              <span>🎬</span> Movies
            </div>
            <div className="itunes8-side-item">
              <span>📺</span> TV Shows
            </div>
            <div className="itunes8-side-item">
              <span>🎙</span> Podcasts
            </div>
            <div className="itunes8-side-item">
              <span>📱</span> Apps
            </div>
            <div className="itunes8-side-item">
              <span>📻</span> Radio
            </div>
            <div className="itunes8-side-h">STORE</div>
            <div className="itunes8-side-item">
              <span>🛒</span> iTunes Store
            </div>
            <div className="itunes8-side-h">PLAYLISTS</div>
            <div className="itunes8-side-item">
              <span>💿</span> iTunes DJ
            </div>
            <div className="itunes8-side-item">
              <span>📋</span> 90&apos;s Music
            </div>
          </aside>

          <div className="itunes8-main">
            <div className="itunes8-viewbar">
              <span className="itunes8-breadcrumb-root">Music</span>
              <span className="itunes8-view-dropdown" title="View options">
                Album by Artist ▾
              </span>
            </div>
            <div className="itunes8-main-inner">
              {viewMode !== 'list' ? (
                <div style={{ padding: 16, color: '#666' }}>
                  {viewMode === 'grid' ? 'Grid view' : 'Cover Flow'} — use List for Album by Artist.
                </div>
              ) : (
                <div className="itunes8-table-wrap itunes8-sticky-head">
                  <table className="itunes8-global-thead" role="presentation">
                    <TrackColgroup />
                    <thead>
                      <tr>
                        <th className="itunes8-col-check">✓</th>
                        <th className="itunes8-col-name">Name</th>
                        <th className="itunes8-col-time">Time</th>
                        <th className="itunes8-col-artist">Artist</th>
                        <th className="itunes8-col-genre">Genre</th>
                        <th className="itunes8-col-rating">Rating</th>
                        <th className="itunes8-col-plays">Plays</th>
                      </tr>
                    </thead>
                  </table>
                  <div className="itunes8-album-groups">
                    {albumGroups.map((g) => (
                      <div key={`${g.artist}-${g.album}`} className="itunes8-album-group">
                        <div className="itunes8-album-banner">
                          <div className={albumArtClass(g)}>{albumArtLabel(g)}</div>
                          <div className="itunes8-album-meta">
                            <div className="itunes8-album-title">{g.album}</div>
                            <div className="itunes8-album-artist">{g.artist}</div>
                            <div className="itunes8-album-stars">★★★★☆</div>
                            <button
                              type="button"
                              className="itunes8-spotify-btn"
                              style={{ marginTop: 8 }}
                              onClick={() =>
                                openSpotifyForTrack(g.artist, g.tracks[0]?.title ?? '')
                              }
                            >
                              Open in Spotify
                            </button>
                          </div>
                        </div>
                        <table className="itunes8-subtable">
                          <TrackColgroup />
                          <tbody>
                            {g.tracks.map((row, ti) => {
                              const k = rowKey(row);
                              const isSel = k === selectedKey;
                              const isPlay = k === nowPlayingKey;
                              return (
                                <tr
                                  key={k}
                                  className={`${isSel ? 'selected' : ''}${isPlay ? ' playing' : ''}`}
                                  onClick={() => setSelectedKey(k)}
                                  onDoubleClick={() => playRow(row)}
                                >
                                  <td className="itunes8-col-check">✓</td>
                                  <td className="itunes8-col-name">
                                    {ti + 1}. {row.title}
                                    {isPlay ? '  🔊' : ''}
                                  </td>
                                  <td className="itunes8-col-time">
                                    {formatDurationMmSs(row.seconds)}
                                  </td>
                                  <td className="itunes8-col-artist">{row.artist}</td>
                                  <td className="itunes8-col-genre">{row.genre}</td>
                                  <td className="itunes8-col-rating">
                                    {ti === 0 ? '★★★★★' : '★★★★☆'}
                                  </td>
                                  <td className="itunes8-col-plays">{fakePlays(row.title)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside className="itunes8-genius" aria-label="Genius Sidebar">
            <h3>Genius Sidebar</h3>
            <div className="itunes8-genius-atom" aria-hidden>
              ⚛
            </div>
            <p>
              Genius makes playlists and mixes from songs in your library that go great together.
              Select a song to see recommendations.
            </p>
            <p style={{ marginTop: 8, opacity: 0.75, fontSize: 9 }}>
              Some Genius features send information to Apple. This is a recreation only.
            </p>
          </aside>
        </div>

        <div className="itunes8-footer">
          <div className="itunes8-footer-btns">
            <button type="button" className="itunes8-fbtn" title="Add playlist">
              +
            </button>
            <button type="button" className="itunes8-fbtn" title="Shuffle">
              🔀
            </button>
            <button type="button" className="itunes8-fbtn" title="Repeat">
              🔁
            </button>
            <button type="button" className="itunes8-fbtn" title="Eject">
              ⏏
            </button>
          </div>
          <div className="itunes8-footer-info">
            {libraryRows.length} items, {totalDays} days, {totalGb} GB
          </div>
          <span aria-hidden>⚛</span>
          <button type="button" className="itunes8-fbtn" title="Visual options">
            ···
          </button>
        </div>
      </div>
    </AppWindow>
  );
}
