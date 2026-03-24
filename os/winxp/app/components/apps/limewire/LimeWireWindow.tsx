'use client';

// P2P client UI (mock search / transfers / library). Shared catalog: MOCK_STREAMING_SONGS.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { AppConfig } from '@retro-web/core/types/app-config';
import { useOsShell } from '@retro-web/core/context';
import {
  MOCK_STREAMING_SONGS,
  openSpotifyForTrack,
  formatDurationLegacy,
} from '@retro-web/core/music';

export const limewireAppConfig: AppConfig = {
  id: 'limewire',
  label: 'LimeWire',
  icon: 'apps/limewire/limewire-icon.png',
  openByDefault: true,
  desktop: false,
  startMenu: { path: ['Programs', 'LimeWire'] },
  taskbarLabel: 'LimeWire',
};

const LimeWireIcon = (
  <img
    src={limewireAppConfig.icon}
    alt=""
    style={{ width: 16, height: 16, marginRight: 4, flexShrink: 0 }}
  />
);

// ── Song database (shared mock catalog) ──────────────────────────────────────
type Song = [string, string, number, string]; // [artist, title, seconds, genre]

const SONGS: Song[] = MOCK_STREAMING_SONGS.map((t) => [t[0], t[1], t[2], t[3]]);

const SEARCH_CACHE = SONGS.map((s) => ({
  artistLower: s[0].toLowerCase(),
  titleLower: s[1].toLowerCase(),
  song: s,
}));

const CATALOG_ARTISTS = [...new Set(SONGS.map((s) => s[0]))].sort().slice(0, 18);
const CATALOG_ALBUMS = [...new Set(SONGS.map((s) => s[3]))].sort().slice(0, 14);

const USERNAMES = [
  'mp3freak2003',
  'xXlimewireXx',
  'kazaagod',
  'limewireman',
  'ilikepie99',
  'Emub7',
  'd00dster',
  'sk8rpunk',
  'WiNaMpRuLeS',
  'broadband_bob',
  'slipknotfan01',
  'limewire4life',
  'cable_dude',
  'dsl_rox',
  'freemuzik',
  'dl_king99',
  'matbai',
  'Tinh69',
];

const LINE_SPEEDS = ['56K Modem', 'Cable', 'DSL', 'T1', 'T3', 'ISDN', 'Unknown'];

const SPEED_KBPS: Record<string, () => number> = {
  '56K Modem': () => rnd(3, 7),
  ISDN: () => rnd(8, 15),
  DSL: () => rnd(20, 50),
  Cable: () => rnd(30, 80),
  T1: () => rnd(60, 150),
  T3: () => rnd(100, 300),
  Unknown: () => rnd(5, 60),
};

function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[rnd(0, arr.length - 1)];
}
function fmtLen(s: number) {
  return formatDurationLegacy(s);
}
function fmtSize(b: number) {
  return b.toLocaleString();
}
function fmtTime(s: number) {
  if (!isFinite(s) || s < 0) return '--:--';
  return (
    String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(Math.floor(s % 60)).padStart(2, '0')
  );
}
function getStatus(pct: number): string {
  if (pct < 3) return 'Getting Info...';
  if (pct < 8) return 'Connecting...';
  if (pct < 100) return 'Downloading...';
  return 'File Complete!';
}

interface SearchResult {
  filename: string;
  filesize: string;
  filesizeBytes: number;
  bitrate: number;
  freq: number;
  length: string;
  user: string;
  linespeed: string;
  ping: number;
  dot: string;
  rawArtist: string;
  rawTitle: string;
  rawGenre: string;
  qualityStars: number;
  fileExt: string;
}

function extFromFilename(fn: string): string {
  const m = fn.match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toLowerCase() : 'mp3';
}

function starRating(n: number): string {
  const c = Math.max(1, Math.min(5, n));
  return '★'.repeat(c) + '☆'.repeat(5 - c);
}

interface Download extends SearchResult {
  id: number;
  status: string;
  rateKbps: number;
  progress: number;
  downloadedKb: number;
  totalKb: number;
  cancelled: boolean;
  currentRate: number;
}

interface LibraryItem {
  filename: string;
  filesize: string;
  bitrate: number;
  freq: number;
  length: string;
  rawArtist: string;
  rawTitle: string;
}

function makeFilenames(artist: string, title: string): string[] {
  const clean = artist + ' - ' + title;
  const initials = artist
    .split(' ')
    .map((w) => w[0])
    .join('');
  return [
    clean + '.mp3',
    clean + ' (Radio Edit).mp3',
    clean + ' [128kbps].mp3',
    artist.toLowerCase().replace(/\s/g, '_') +
      '-' +
      title.toLowerCase().replace(/[^a-z0-9]/g, '_') +
      '.mp3',
    initials + ' - ' + title + '.mp3',
    '0' + rnd(1, 9) + ' - ' + title + '.mp3',
    clean + ' (live).mp3',
    title + ' - ' + artist + '.mp3',
  ];
}

function doSearch(query: string): SearchResult[] {
  if (!query.trim()) return [];
  const q = query.trim().toLowerCase();
  const matched = SEARCH_CACHE.filter((s) => s.artistLower.includes(q) || s.titleLower.includes(q));
  const results: SearchResult[] = [];
  const dots = ['dot-green', 'dot-green', 'dot-green', 'dot-yellow', 'dot-red'];
  matched.forEach(({ song: [artist, title, len, genre] }) => {
    const names = makeFilenames(artist, title);
    const count = Math.min(names.length, rnd(3, 6));
    for (let i = 0; i < count; i++) {
      const bitrate = pick([128, 128, 160, 192, 96]);
      const filesizeBytes = Math.round((len * bitrate * 1000) / 8) + rnd(-80000, 120000);
      const fn = names[i];
      results.push({
        filename: fn,
        filesize: fmtSize(filesizeBytes),
        filesizeBytes,
        bitrate,
        freq: pick([44100, 44100, 22050]),
        length: fmtLen(len + rnd(-5, 5)),
        user: pick(USERNAMES),
        linespeed: pick(LINE_SPEEDS),
        ping: rnd(1, 9999),
        dot: pick(dots),
        rawArtist: artist,
        rawTitle: title,
        rawGenre: genre,
        qualityStars: rnd(2, 5),
        fileExt: extFromFilename(fn),
      });
    }
  });
  for (let j = results.length - 1; j > 0; j--) {
    const k = rnd(0, j);
    [results[j], results[k]] = [results[k], results[j]];
  }
  return results.slice(0, 100);
}

type MediaFilter = 'all' | 'audio' | 'programs' | 'video';

export function LimeWireWindow() {
  const { AppWindow, TitleBar } = useOsShell();
  const [activeTab, setActiveTab] = useState<'search' | 'monitor' | 'library'>('search');
  const [artistQuery, setArtistQuery] = useState('*NSYNC');
  const [titleQuery, setTitleQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [resultsStatus, setResultsStatus] = useState('');
  const [selectedResultIdx, setSelectedResultIdx] = useState<number | null>(null);
  const [filterArtist, setFilterArtist] = useState<string | null>(null);
  const [filterAlbum, setFilterAlbum] = useState<string | null>(null);
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all');
  const [lastSearchLabel, setLastSearchLabel] = useState('music');
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [selectedLibIdx, setSelectedLibIdx] = useState<number | null>(null);
  const [statusText, setStatusText] = useState('Connected to Gnutella: sharing 0 files.');
  const downloadIdRef = useRef(0);

  const filteredResults = useMemo(() => {
    let r = results;
    if (filterArtist) r = r.filter((x) => x.rawArtist === filterArtist);
    if (filterAlbum) r = r.filter((x) => x.rawGenre === filterAlbum);
    if (mediaFilter === 'audio') {
      r = r.filter((x) => ['mp3', 'm4a', 'aac', 'wma', 'ogg'].includes(x.fileExt));
    } else if (mediaFilter === 'programs') {
      r = r.filter((x) => ['exe', 'msi', 'zip'].includes(x.fileExt));
    } else if (mediaFilter === 'video') {
      r = r.filter((x) => ['mpg', 'mpeg', 'avi', 'wmv', 'mp4'].includes(x.fileExt));
    }
    return r;
  }, [results, filterArtist, filterAlbum, mediaFilter]);

  // Initial search on mount
  useEffect(() => {
    setResultsStatus('Searching...');
    setLastSearchLabel('nsync');
    const t = setTimeout(() => {
      const r = doSearch('nsync');
      setResults(r);
      setResultsStatus(`Returned ${r.length} results.`);
    }, 800);
    return () => clearTimeout(t);
  }, []);

  // Download tick
  useEffect(() => {
    const id = setInterval(() => {
      setDownloads((prev) => {
        let hasActive = false;
        const next = prev.map((dl) => {
          if (dl.cancelled || dl.progress >= 100) return dl;
          hasActive = true;
          const rate = dl.rateKbps * (0.7 + Math.random() * 0.6);
          const downloadedKb = Math.min(dl.downloadedKb + rate * 0.5, dl.totalKb);
          const progress = Math.min(100, Math.round((downloadedKb / dl.totalKb) * 100));
          const status = getStatus(progress);
          if (progress >= 100 && dl.progress < 100) {
            setLibrary((lib) => {
              if (lib.some((i) => i.filename === dl.filename)) return lib;
              return [
                ...lib,
                {
                  filename: dl.filename,
                  filesize: dl.filesize,
                  bitrate: dl.bitrate,
                  freq: dl.freq,
                  length: dl.length,
                  rawArtist: dl.rawArtist,
                  rawTitle: dl.rawTitle,
                },
              ];
            });
            setStatusText('File saved to C:\\Program Files\\LimeWire\\Shared\\' + dl.filename);
            setTimeout(() => setStatusText('Connected to Gnutella: sharing 0 files.'), 4000);
          }
          return { ...dl, downloadedKb, progress, status, currentRate: rate };
        });
        return next;
      });
    }, 500);
    return () => clearInterval(id);
  }, []);

  function handleSearch() {
    const q = (artistQuery + ' ' + titleQuery).trim();
    if (!q) return;
    const label = q.replace(/\s+/g, ' ').slice(0, 24) || 'music';
    setLastSearchLabel(label);
    setResultsStatus('Searching...');
    setResults([]);
    setSelectedResultIdx(null);
    setTimeout(
      () => {
        const r = doSearch(q);
        setResults(r);
        setResultsStatus(r.length > 0 ? `Returned ${r.length} results.` : 'No results found.');
      },
      rnd(600, 1400),
    );
  }

  function handleClearSearch() {
    setArtistQuery('');
    setTitleQuery('');
    setResults([]);
    setResultsStatus('');
    setSelectedResultIdx(null);
    setFilterArtist(null);
    setFilterAlbum(null);
    setMediaFilter('all');
  }

  function handleBackToSearchFilters() {
    setFilterArtist(null);
    setFilterAlbum(null);
    setMediaFilter('all');
  }

  function handleStopSearch() {
    setResultsStatus('');
    setResults([]);
    setSelectedResultIdx(null);
  }

  function handleJunk() {
    if (selectedResultIdx === null) {
      window.alert('Select a file first.');
      return;
    }
    const sel = filteredResults[selectedResultIdx];
    if (!sel) return;
    setResults((prev) => prev.filter((r) => r.filename !== sel.filename));
    setSelectedResultIdx(null);
  }

  function handleCloseSearchTab() {
    handleStopSearch();
  }

  function addDownload(result: SearchResult) {
    const rateKbps = (SPEED_KBPS[result.linespeed] || SPEED_KBPS['Unknown'])();
    const totalKb = result.filesizeBytes / 1024;
    const dl: Download = {
      ...result,
      id: ++downloadIdRef.current,
      status: 'Getting Info...',
      rateKbps,
      progress: 0,
      downloadedKb: 0,
      totalKb,
      cancelled: false,
      currentRate: 0,
    };
    setDownloads((prev) => [...prev, dl]);
    setActiveTab('monitor');
  }

  function handleDownloadSelected() {
    if (selectedResultIdx === null) {
      window.alert('Please select a song first.');
      return;
    }
    const result = filteredResults[selectedResultIdx];
    if (!result) return;
    if (downloads.some((d) => d.filename === result.filename && d.progress < 100 && !d.cancelled)) {
      window.alert(result.filename + '\n\nThis file is already downloading.');
      return;
    }
    addDownload(result);
  }

  const activeDownloads = downloads.filter((d) => !d.cancelled && d.progress < 100).length;

  return (
    <AppWindow
      id="limewire-window"
      appId="limewire"
      className="limewire-window app-window app-window-hidden"
      titleBar={
        <TitleBar
          title="LimeWire: Enabling Open Information Sharing"
          icon={LimeWireIcon}
          showMin
          showMax
          showClose
        />
      }
    >
      <div className="limewire-menu-bar">
        <span className="limewire-menu-item">
          <u>F</u>ile
        </span>
        <span className="limewire-menu-item">
          <u>V</u>iew
        </span>
        <span className="limewire-menu-item">
          <u>N</u>avigation
        </span>
        <span className="limewire-menu-item">
          <u>R</u>esources
        </span>
        <span className="limewire-menu-item">
          <u>T</u>ools
        </span>
        <span className="limewire-menu-item">
          <u>H</u>elp
        </span>
      </div>

      <div className="limewire-nav-row">
        <div className="limewire-main-tabs">
          {(
            [
              { id: 'search' as const, icon: '🔍', label: 'Search' },
              { id: 'monitor' as const, icon: '🖥', label: 'Monitor' },
              { id: 'library' as const, icon: '📁', label: 'Library' },
            ] as const
          ).map(({ id, icon, label }) => (
            <div
              key={id}
              className={`limewire-tab limewire-tab-main${activeTab === id ? ' active' : ''}`}
              onClick={() => setActiveTab(id)}
            >
              <span className="limewire-tab-icon">{icon}</span> {label}
            </div>
          ))}
        </div>
        <div className="limewire-nav-logo" aria-hidden>
          <img src={limewireAppConfig.icon} alt="" className="limewire-nav-logo-img" />
          <span className="limewire-nav-logo-text">LimeWire</span>
          <span className="limewire-nav-logo-dots" />
        </div>
      </div>

      {/* LIBRARY */}
      <div className={`limewire-panel${activeTab === 'library' ? ' active' : ''}`}>
        <div className="limewire-library-toolbar">
          <button
            className="limewire-btn limewire-btn-primary"
            onClick={() => {
              if (selectedLibIdx === null) {
                window.alert('Select a song first.');
                return;
              }
              openSpotifyForTrack(
                library[selectedLibIdx].rawArtist,
                library[selectedLibIdx].rawTitle,
              );
            }}
          >
            ▶ Play on Spotify
          </button>
          <button
            className="limewire-btn"
            onClick={() => {
              if (selectedLibIdx === null) {
                window.alert('Select a song first.');
                return;
              }
              setLibrary((prev) => {
                const n = [...prev];
                n.splice(selectedLibIdx, 1);
                return n;
              });
              setSelectedLibIdx(null);
            }}
          >
            Remove Selected
          </button>
          <button
            className="limewire-btn"
            onClick={() => {
              if (window.confirm('Remove all songs from your library?')) {
                setLibrary([]);
                setSelectedLibIdx(null);
              }
            }}
          >
            Clear All
          </button>
          <span style={{ marginLeft: 8, fontSize: 11, color: '#555' }}>
            {library.length > 0
              ? `${library.length} song${library.length === 1 ? '' : 's'} in library.`
              : ''}
          </span>
        </div>
        <div className="limewire-library-table-wrap">
          <div className="limewire-library-header">
            <div className="limewire-lib-th lcol-filename">Filename</div>
            <div className="limewire-lib-th lcol-filesize">Size</div>
            <div className="limewire-lib-th lcol-bitrate">Bitrate</div>
            <div className="limewire-lib-th lcol-freq">Freq</div>
            <div className="limewire-lib-th lcol-length">Length</div>
            <div className="limewire-lib-th lcol-path">Path</div>
          </div>
          <div id="limewire-library-body">
            {library.length === 0 ? (
              <div className="limewire-lib-empty">
                No songs yet. Download songs using the Search tab.
              </div>
            ) : (
              library.map((item, idx) => (
                <div
                  key={idx}
                  className={`limewire-library-row${selectedLibIdx === idx ? ' selected' : ''}`}
                  onClick={() => setSelectedLibIdx(idx)}
                  onDoubleClick={() => openSpotifyForTrack(item.rawArtist, item.rawTitle)}
                >
                  <div className="limewire-lib-td lcol-filename" title={item.filename}>
                    {item.filename}
                  </div>
                  <div className="limewire-lib-td lcol-filesize">{item.filesize}</div>
                  <div className="limewire-lib-td lcol-bitrate">{item.bitrate}</div>
                  <div className="limewire-lib-td lcol-freq">{item.freq}</div>
                  <div className="limewire-lib-td lcol-length">{item.length}</div>
                  <div className="limewire-lib-td lcol-path">
                    {'C:\\Program Files\\LimeWire\\Shared\\' + item.filename}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* SEARCH */}
      <div
        className={`limewire-panel limewire-panel-search${activeTab === 'search' ? ' active' : ''}`}
      >
        <div className="limewire-search-layout">
          <aside className="limewire-filter-sidebar">
            <div className="limewire-filter-title">Filter Results:</div>
            <section className="limewire-filter-section">
              <div className="lw-filter-header">Media</div>
              <div className="lw-filter-list">
                {(
                  [
                    { id: 'all' as MediaFilter, label: 'All', icon: '📄' },
                    { id: 'audio' as MediaFilter, label: 'Audio', icon: '🎵' },
                    { id: 'programs' as MediaFilter, label: 'Programs', icon: '⚙' },
                    { id: 'video' as MediaFilter, label: 'Video', icon: '🎬' },
                  ] as const
                ).map(({ id, label, icon }) => (
                  <button
                    key={id}
                    type="button"
                    className={`lw-filter-chip${mediaFilter === id ? ' selected' : ''}`}
                    onClick={() => setMediaFilter(id)}
                  >
                    <span className="lw-filter-chip-icon">{icon}</span> {label}
                  </button>
                ))}
              </div>
            </section>
            <section className="limewire-filter-section">
              <div className="lw-filter-header">Artist</div>
              <div className="lw-filter-scroll">
                {CATALOG_ARTISTS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    className={`lw-filter-line${filterArtist === a ? ' selected' : ''}`}
                    onClick={() => setFilterArtist(filterArtist === a ? null : a)}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </section>
            <section className="limewire-filter-section">
              <div className="lw-filter-header">Album</div>
              <div className="lw-filter-scroll">
                {CATALOG_ALBUMS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    className={`lw-filter-line${filterAlbum === g ? ' selected' : ''}`}
                    onClick={() => setFilterAlbum(filterAlbum === g ? null : g)}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </section>
            <button
              type="button"
              className="lw-btn-back-search"
              onClick={handleBackToSearchFilters}
            >
              Back To Search
            </button>
            <button
              type="button"
              className="lw-btn-magnet"
              onClick={() => window.alert('magnetmix.com — not connected in this demo.')}
            >
              +magnetmix.com+
            </button>
          </aside>

          <div className="limewire-search-main">
            <div className="limewire-search-toolbar-compact">
              <span className="limewire-search-label-inline">Artist:</span>
              <input
                type="text"
                className="limewire-search-input lw-input-sm"
                autoComplete="off"
                value={artistQuery}
                onChange={(e) => setArtistQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <span className="limewire-search-label-inline">Title:</span>
              <input
                type="text"
                className="limewire-search-input lw-input-sm"
                autoComplete="off"
                value={titleQuery}
                onChange={(e) => setTitleQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button type="button" className="limewire-btn lw-btn-find" onClick={handleSearch}>
                Search
              </button>
              <button type="button" className="limewire-btn" onClick={handleClearSearch}>
                Clear
              </button>
            </div>

            <div className="lw-search-tab-strip">
              <span className="lw-search-tab-label">
                {lastSearchLabel} ({filteredResults.length})
              </span>
              <button
                type="button"
                className="lw-search-tab-close"
                title="Close search"
                onClick={handleCloseSearchTab}
              >
                ×
              </button>
            </div>

            <div className="limewire-table-container lw-results-table-wrap">
              <table className="limewire-table lw-results-table">
                <thead>
                  <tr>
                    <th className="lw-col-quality">Quality</th>
                    <th className="lw-col-icon" aria-label="Type" />
                    <th className="lw-col-name">Name</th>
                    <th className="lw-col-type">Type</th>
                    <th className="lw-col-size">Size</th>
                    <th className="lw-col-speed">Speed</th>
                    <th className="lw-col-bitrate">Bitrate</th>
                  </tr>
                </thead>
                <tbody>
                  {resultsStatus === 'Searching...' ? (
                    <tr>
                      <td colSpan={7} className="lw-results-empty">
                        Searching the network…
                      </td>
                    </tr>
                  ) : filteredResults.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="lw-results-empty">
                        {results.length === 0
                          ? 'No files found. Try a different search.'
                          : 'No results match the current filters.'}
                      </td>
                    </tr>
                  ) : (
                    filteredResults.map((r, idx) => (
                      <tr
                        key={r.filename + idx}
                        className={selectedResultIdx === idx ? 'selected' : ''}
                        onClick={() => setSelectedResultIdx(idx)}
                        onDoubleClick={() => {
                          setSelectedResultIdx(idx);
                          if (
                            downloads.some(
                              (d) => d.filename === r.filename && d.progress < 100 && !d.cancelled,
                            )
                          ) {
                            window.alert(r.filename + '\n\nThis file is already downloading.');
                            return;
                          }
                          addDownload(r);
                        }}
                      >
                        <td className="lw-col-quality">
                          <span className="lw-stars" title={`${r.qualityStars}/5`}>
                            {starRating(r.qualityStars)}
                          </span>
                        </td>
                        <td className="lw-col-icon">
                          <span className="lw-file-icon" aria-hidden>
                            🎵
                          </span>
                        </td>
                        <td className="lw-col-name" title={r.filename}>
                          {r.filename}
                        </td>
                        <td className="lw-col-type">{r.fileExt}</td>
                        <td className="lw-col-size">{r.filesize}</td>
                        <td className="lw-col-speed">{r.linespeed}</td>
                        <td className="lw-col-bitrate">{r.bitrate}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="limewire-results-count lw-results-status">{resultsStatus}</div>

            <div className="lw-action-bar-big">
              <button
                type="button"
                className="lw-big-action lw-act-download"
                onClick={handleDownloadSelected}
                title="Download"
              >
                <span className="lw-big-action-icon">⬇</span>
                <span>Download</span>
              </button>
              <button
                type="button"
                className="lw-big-action lw-act-browse disabled"
                disabled
                title="Browse Host"
              >
                <span className="lw-big-action-icon">📂</span>
                <span>Browse Host</span>
              </button>
              <button
                type="button"
                className="lw-big-action lw-act-stop"
                onClick={handleStopSearch}
                title="Stop Search"
              >
                <span className="lw-big-action-icon lw-icon-stop">✕</span>
                <span>Stop Search</span>
              </button>
              <button
                type="button"
                className="lw-big-action lw-act-junk"
                onClick={handleJunk}
                title="Junk"
              >
                <span className="lw-big-action-icon">🗑</span>
                <span>Junk</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MONITOR (transfers) */}
      <div className={`limewire-panel${activeTab === 'monitor' ? ' active' : ''}`}>
        <div className="limewire-transfer-wrap">
          <div className="limewire-transfer-section">
            <div className="limewire-transfer-header-row">
              <div className="limewire-th tcol-icon"></div>
              <div className="limewire-th tcol-filename">Filename</div>
              <div className="limewire-th tcol-filesize">File Size</div>
              <div className="limewire-th tcol-user">User</div>
              <div className="limewire-th tcol-status">Status</div>
              <div className="limewire-th tcol-speed">Speed</div>
              <div className="limewire-th tcol-progress">Progress</div>
              <div className="limewire-th tcol-rate">Rate</div>
              <div className="limewire-th tcol-timeleft">Time Left</div>
            </div>
            <div className="limewire-transfer-body">
              {downloads.map((dl) => (
                <div
                  key={dl.id}
                  className="limewire-transfer-row"
                  style={
                    dl.progress >= 100
                      ? { background: '#e8f5e8' }
                      : dl.cancelled
                        ? { color: '#888' }
                        : {}
                  }
                >
                  <div className="limewire-td tcol-icon limewire-dl-icon">⬇</div>
                  <div className="limewire-td tcol-filename limewire-td-fn" title={dl.filename}>
                    {dl.filename}
                  </div>
                  <div className="limewire-td tcol-filesize">{dl.filesize}</div>
                  <div className="limewire-td tcol-user">{dl.user}</div>
                  <div className="limewire-td tcol-status">
                    {dl.cancelled ? 'Cancelled' : dl.status}
                  </div>
                  <div className="limewire-td tcol-speed">{dl.linespeed}</div>
                  <div className="limewire-td tcol-progress">
                    <div className="limewire-progress-cell">
                      <div
                        className="limewire-progress-fill"
                        style={{ width: dl.progress + '%' }}
                      />
                      <div className="limewire-progress-text">{dl.progress}%</div>
                    </div>
                  </div>
                  <div className="limewire-td tcol-rate">
                    {dl.progress >= 100 || dl.cancelled ? '—' : dl.currentRate.toFixed(1) + ' k/s'}
                  </div>
                  <div className="limewire-td tcol-timeleft">
                    {dl.progress >= 100 || dl.cancelled
                      ? '—'
                      : fmtTime((dl.totalKb - dl.downloadedKb) / (dl.currentRate || 1))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="limewire-transfer-stats">
          <span>Concurrent Downloads: {activeDownloads}</span>
          <span>Concurrent Uploads: 0</span>
        </div>
        <div className="limewire-transfer-actions">
          <button
            className="limewire-btn"
            onClick={() =>
              setDownloads((prev) => prev.filter((d) => d.progress < 100 && !d.cancelled))
            }
          >
            Clear Finished
          </button>
          <button
            className="limewire-btn"
            onClick={() =>
              setDownloads((prev) =>
                prev.map((d) => (d.progress < 100 ? { ...d, cancelled: true } : d)),
              )
            }
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Footer: signal / PRO promo / mini player */}
      <div className="limewire-footer-bar">
        <div className="limewire-footer-left">
          <span className="lw-signal-meter" aria-hidden>
            <span className="lw-signal-bar" />
            <span className="lw-signal-bar" />
            <span className="lw-signal-bar" />
            <span className="lw-signal-bar" />
            <span className="lw-signal-bar" />
          </span>
          <span className="lw-footer-globe" title="Network">
            🌐
          </span>
          <span className="lw-footer-count">{activeDownloads}</span>
        </div>
        <div className="limewire-footer-promo">
          <button type="button" className="lw-pro-link">
            Purchase LimeWire PRO to help us make downloads faster.
          </button>
        </div>
        <div className="limewire-footer-player">
          <span className="lw-player-label">LimeWire Media Player</span>
          <span className="lw-player-btns">
            <button type="button" className="lw-pl-btn" aria-label="Rewind">
              ⏮
            </button>
            <button type="button" className="lw-pl-btn" aria-label="Play">
              ▶
            </button>
            <button type="button" className="lw-pl-btn" aria-label="Fast forward">
              ⏭
            </button>
          </span>
        </div>
      </div>

      <div className="limewire-status-bar">
        <div className="limewire-status-left">{statusText}</div>
        <div className="limewire-status-right" />
      </div>
    </AppWindow>
  );
}
