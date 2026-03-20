'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AppWindow, TitleBar } from '../../win98';
import type { AppConfig } from '@/app/types/app-config';

export const napsterAppConfig: AppConfig = {
  id: 'napster',
  label: 'Napster',
  icon: 'apps/napster/napster-icon.png',
  openByDefault: true,
  desktop: false,
  startMenu: { path: ['Programs', 'Internet'] },
  taskbarLabel: 'Napster',
};

const NapsterIcon = (
  <img
    src={napsterAppConfig.icon}
    alt=""
    style={{ width: 16, height: 16, marginRight: 4, flexShrink: 0 }}
  />
);

// ── Song database ─────────────────────────────────────────────────────────────
type Song = [string, string, number, string]; // [artist, title, seconds, genre]

const SONGS: Song[] = [
  ['Backstreet Boys', 'I Want It That Way', 215, 'Pop'],
  ['Backstreet Boys', "Everybody (Backstreet's Back)", 244, 'Pop'],
  ['*NSYNC', 'Bye Bye Bye', 200, 'Pop'],
  ['*NSYNC', "It's Gonna Be Me", 235, 'Pop'],
  ['Britney Spears', '...Baby One More Time', 211, 'Pop'],
  ['Britney Spears', 'Oops!... I Did It Again', 204, 'Pop'],
  ['Britney Spears', 'Toxic', 198, 'Pop'],
  ['Christina Aguilera', 'Genie In A Bottle', 220, 'Pop'],
  ["Destiny's Child", 'Say My Name', 238, 'R&B'],
  ["Destiny's Child", 'Survivor', 243, 'R&B'],
  ['Blink-182', 'All The Small Things', 167, 'Pop Punk'],
  ['Blink-182', "What's My Age Again", 149, 'Pop Punk'],
  ['Blink-182', 'I Miss You', 228, 'Pop Punk'],
  ['Sum 41', 'Fat Lip', 139, 'Pop Punk'],
  ['Avril Lavigne', 'Complicated', 244, 'Pop Punk'],
  ['Avril Lavigne', 'Sk8er Boi', 194, 'Pop Punk'],
  ['Simple Plan', "I'm Just A Kid", 207, 'Pop Punk'],
  ['Good Charlotte', 'The Anthem', 207, 'Pop Punk'],
  ['Green Day', 'Minority', 168, 'Punk Rock'],
  ['Linkin Park', 'In The End', 216, 'Nu Metal'],
  ['Linkin Park', 'Numb', 187, 'Nu Metal'],
  ['Evanescence', 'Bring Me To Life', 223, 'Rock'],
  ['Nickelback', 'How You Remind Me', 223, 'Rock'],
  ['Coldplay', 'Yellow', 269, 'Alternative'],
  ['Eminem', 'Without Me', 295, 'Hip-Hop'],
  ['Eminem', 'Lose Yourself', 326, 'Hip-Hop'],
  ['Nelly', 'Hot In Herre', 215, 'Hip-Hop'],
  ['50 Cent', 'In Da Club', 193, 'Hip-Hop'],
  ['Outkast', 'Hey Ya!', 234, 'Hip-Hop'],
  ['Black Eyed Peas', 'Where Is The Love', 263, 'Hip-Hop'],
  ['Alicia Keys', "Fallin'", 213, 'R&B'],
  ['Smash Mouth', 'All Star', 199, 'Pop Rock'],
  ['Shaggy', "It Wasn't Me", 220, 'Reggae Pop'],
  ['Vanessa Carlton', 'A Thousand Miles', 236, 'Pop'],
  ['3 Doors Down', 'Kryptonite', 236, 'Rock'],
  ['The White Stripes', 'Seven Nation Army', 231, 'Rock'],
  ['Jimmy Eat World', 'The Middle', 162, 'Pop Punk'],
];

const SEARCH_CACHE = SONGS.map((s) => ({
  artistLower: s[0].toLowerCase(),
  titleLower: s[1].toLowerCase(),
  song: s,
}));

const USERNAMES = [
  'mp3freak2003',
  'xXnapsterXx',
  'kazaagod',
  'limewireman',
  'ilikepie99',
  'Emub7',
  'd00dster',
  'sk8rpunk',
  'WiNaMpRuLeS',
  'broadband_bob',
  'slipknotfan01',
  'napster4life',
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
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
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
  matched.forEach(({ song: [artist, title, len] }) => {
    const names = makeFilenames(artist, title);
    const count = Math.min(names.length, rnd(3, 6));
    for (let i = 0; i < count; i++) {
      const bitrate = pick([128, 128, 160, 192, 96]);
      const filesizeBytes = Math.round((len * bitrate * 1000) / 8) + rnd(-80000, 120000);
      results.push({
        filename: names[i],
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
      });
    }
  });
  for (let j = results.length - 1; j > 0; j--) {
    const k = rnd(0, j);
    [results[j], results[k]] = [results[k], results[j]];
  }
  return results.slice(0, 100);
}

function spotifyUrl(item: { rawArtist: string; rawTitle: string }): string {
  const slug = (item.rawArtist + ' ' + item.rawTitle)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-');
  return 'https://open.spotify.com/search/' + encodeURIComponent(slug);
}

export function NapsterWindow() {
  const [activeTab, setActiveTab] = useState('search');
  const [artistQuery, setArtistQuery] = useState('*NSYNC');
  const [titleQuery, setTitleQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [resultsStatus, setResultsStatus] = useState('');
  const [selectedResultIdx, setSelectedResultIdx] = useState<number | null>(null);
  const [downloads, setDownloads] = useState<Download[]>([]);
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [selectedLibIdx, setSelectedLibIdx] = useState<number | null>(null);
  const [statusText, setStatusText] = useState('Online [F4$tRunn3r200] Sharing 0 Songs.');

  // Initial search on mount
  useEffect(() => {
    setResultsStatus('Searching...');
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
            setStatusText('File saved to C:\\My Napster\\Music\\' + dl.filename);
            setTimeout(() => setStatusText('Online [F4$tRunn3r200] Sharing 0 Songs.'), 4000);
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
  }

  function addDownload(result: SearchResult) {
    const rateKbps = (SPEED_KBPS[result.linespeed] || SPEED_KBPS['Unknown'])();
    const totalKb = result.filesizeBytes / 1024;
    const dl: Download = {
      ...result,
      id: Date.now() + Math.random(),
      status: 'Getting Info...',
      rateKbps,
      progress: 0,
      downloadedKb: 0,
      totalKb,
      cancelled: false,
      currentRate: 0,
    };
    setDownloads((prev) => [...prev, dl]);
    setActiveTab('transfer');
  }

  function handleDownloadSelected() {
    if (selectedResultIdx === null) {
      window.alert('Please select a song first.');
      return;
    }
    const result = results[selectedResultIdx];
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
      id="napster-window"
      appId="napster"
      className="napster-window app-window app-window-hidden"
      titleBar={
        <TitleBar title="Napster v2.0 BETA 5" icon={NapsterIcon} showMin showMax showClose />
      }
    >
      <div className="napster-menu-bar">
        <span className="napster-menu-item">
          <u>F</u>ile
        </span>
        <span className="napster-menu-item">
          <u>A</u>ctions
        </span>
        <span className="napster-menu-item">
          <u>H</u>elp
        </span>
      </div>

      <div className="napster-tab-bar">
        {[
          { id: 'home', icon: '🏠', label: 'Home' },
          { id: 'chat', icon: '💬', label: 'Chat' },
          { id: 'library', icon: '📚', label: 'Library' },
          { id: 'search', icon: '🔍', label: 'Search' },
          { id: 'hotlist', icon: '🔥', label: 'Hot List' },
          { id: 'transfer', icon: '⬇️', label: 'Transfer' },
          { id: 'help', icon: '❓', label: 'Help' },
        ].map(({ id, icon, label }) => (
          <div
            key={id}
            className={`napster-tab${activeTab === id ? ' active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <span className="napster-tab-icon">{icon}</span> {label}
          </div>
        ))}
      </div>

      {/* HOME */}
      <div className={`napster-panel${activeTab === 'home' ? ' active' : ''}`}>
        <div className="napster-home-content">
          <div className="napster-home-logo">
            <svg viewBox="0 0 240 70" xmlns="http://www.w3.org/2000/svg">
              <rect width="240" height="70" fill="#000" />
              <g transform="translate(10, 10) scale(0.5)">
                <circle cx="50" cy="50" r="45" fill="#000080" />
                <path d="M 25 35 L 50 65 L 75 35 Z" fill="#00ff00" />
                <rect x="35" y="45" width="10" height="10" fill="#ffffff" />
                <rect x="55" y="45" width="10" height="10" fill="#ffffff" />
              </g>
              <text
                x="70"
                y="52"
                fontSize="16"
                fill="#00ff00"
                fontFamily="Arial Black,Arial"
                fontWeight="900"
                letterSpacing="-1"
              >
                napster
              </text>
            </svg>
          </div>
          <div className="napster-home-stats">
            <b>Welcome to Napster!</b>
            <br />
            You are sharing <b>0 songs</b> with the Napster community.
            <br />
            Currently <b>709,082 songs</b> available in <b>4,708 libraries</b>.<br />
            <br />
            <b>Hot Searches:</b> blink 182 &nbsp;•&nbsp; eminem &nbsp;•&nbsp; nsync &nbsp;•&nbsp;
            britney spears &nbsp;•&nbsp; linkin park
          </div>
          <p style={{ fontSize: 11, color: '#555' }}>
            Click the <b>Search</b> tab to find and download music.
          </p>
        </div>
      </div>

      {/* CHAT */}
      <div className={`napster-panel${activeTab === 'chat' ? ' active' : ''}`}>
        <div style={{ padding: 16, fontSize: 11, color: '#555' }}>
          <b>Chat Rooms</b>
          <br />
          <br />
          Chat is not available in this version.
        </div>
      </div>

      {/* LIBRARY */}
      <div className={`napster-panel${activeTab === 'library' ? ' active' : ''}`}>
        <div className="napster-library-toolbar">
          <button
            className="napster-btn napster-btn-primary"
            onClick={() => {
              if (selectedLibIdx === null) {
                window.alert('Select a song first.');
                return;
              }
              window.open(spotifyUrl(library[selectedLibIdx]), '_blank');
            }}
          >
            ▶ Play on Spotify
          </button>
          <button
            className="napster-btn"
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
            className="napster-btn"
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
        <div className="napster-library-table-wrap">
          <div className="napster-library-header">
            <div className="napster-lib-th lcol-filename">Filename</div>
            <div className="napster-lib-th lcol-filesize">Size</div>
            <div className="napster-lib-th lcol-bitrate">Bitrate</div>
            <div className="napster-lib-th lcol-freq">Freq</div>
            <div className="napster-lib-th lcol-length">Length</div>
            <div className="napster-lib-th lcol-path">Path</div>
          </div>
          <div id="nap-library-body">
            {library.length === 0 ? (
              <div className="napster-lib-empty">
                No songs yet. Download songs using the Search tab.
              </div>
            ) : (
              library.map((item, idx) => (
                <div
                  key={idx}
                  className={`napster-library-row${selectedLibIdx === idx ? ' selected' : ''}`}
                  onClick={() => setSelectedLibIdx(idx)}
                  onDoubleClick={() => window.open(spotifyUrl(item), '_blank')}
                >
                  <div className="napster-lib-td lcol-filename" title={item.filename}>
                    {item.filename}
                  </div>
                  <div className="napster-lib-td lcol-filesize">{item.filesize}</div>
                  <div className="napster-lib-td lcol-bitrate">{item.bitrate}</div>
                  <div className="napster-lib-td lcol-freq">{item.freq}</div>
                  <div className="napster-lib-td lcol-length">{item.length}</div>
                  <div className="napster-lib-td lcol-path">
                    {'C:\\My Napster\\Music\\' + item.filename}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* SEARCH */}
      <div className={`napster-panel${activeTab === 'search' ? ' active' : ''}`}>
        <div className="napster-search-top">
          <div className="napster-group-box">
            <span className="napster-group-label">Search Fields</span>
            <div className="napster-search-row">
              <span className="napster-search-label">Artist:</span>
              <input
                type="text"
                className="napster-search-input"
                autoComplete="off"
                value={artistQuery}
                onChange={(e) => setArtistQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="napster-search-row">
              <span className="napster-search-label">Song Title:</span>
              <input
                type="text"
                className="napster-search-input"
                autoComplete="off"
                value={titleQuery}
                onChange={(e) => setTitleQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="napster-search-btns" style={{ marginTop: 4 }}>
              <button className="napster-btn" onClick={handleClearSearch}>
                Clear Fields
              </button>
              <button className="napster-btn napster-btn-primary" onClick={handleSearch}>
                Find It!
              </button>
            </div>
          </div>
          <div className="napster-group-box">
            <span className="napster-group-label">Advanced Fields (OPTIONAL)</span>
            <div className="napster-adv-row">
              <span className="napster-adv-label">Bitrate must be:</span>
              <select className="napster-search-select" style={{ width: 68 }}>
                <option>AT LEAST</option>
                <option>EQUAL TO</option>
                <option>AT MOST</option>
              </select>
              <select className="napster-search-select" style={{ width: 62 }}>
                <option>128 KB/S</option>
                <option>96 KB/S</option>
                <option>192 KB/S</option>
              </select>
            </div>
            <div className="napster-adv-row">
              <span className="napster-adv-label">Line Speed must be:</span>
              <select className="napster-search-select" style={{ width: 68 }}>
                <option></option>
                <option>AT LEAST</option>
              </select>
              <select className="napster-search-select" style={{ width: 62 }}>
                <option></option>
                <option>Cable</option>
                <option>DSL</option>
                <option>T1</option>
              </select>
            </div>
          </div>
        </div>
        <div className="napster-results-wrap">
          <div className="napster-table-container">
            <table className="napster-table">
              <thead>
                <tr>
                  <th className="col-filename">Filename</th>
                  <th className="col-filesize">Filesize</th>
                  <th className="col-bitrate">Bitrate</th>
                  <th className="col-freq">Freq</th>
                  <th className="col-length">Length</th>
                  <th className="col-user">User</th>
                  <th className="col-linespeed">Line Speed</th>
                  <th className="col-ping">Ping</th>
                </tr>
              </thead>
              <tbody>
                {results.length === 0 && resultsStatus !== 'Searching...' ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: 8, color: '#888' }}>
                      No files found. Try a different search.
                    </td>
                  </tr>
                ) : (
                  results.map((r, idx) => (
                    <tr
                      key={idx}
                      className={selectedResultIdx === idx ? 'selected' : ''}
                      onClick={() => setSelectedResultIdx(idx)}
                      onDoubleClick={() => {
                        setSelectedResultIdx(idx);
                        handleDownloadSelected();
                      }}
                    >
                      <td className="col-filename">
                        <span className={`napster-dot ${r.dot}`} />
                        {r.filename}
                      </td>
                      <td className="col-filesize">{r.filesize}</td>
                      <td className="col-bitrate">{r.bitrate}</td>
                      <td className="col-freq">{r.freq}</td>
                      <td className="col-length">{r.length}</td>
                      <td className="col-user">{r.user}</td>
                      <td className="col-linespeed">{r.linespeed}</td>
                      <td className="col-ping">{r.ping === 9999 ? 'N/A' : r.ping}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="napster-results-count">{resultsStatus}</div>
        </div>
        <div className="napster-results-actions">
          <button className="napster-btn" onClick={handleDownloadSelected}>
            Get Selected Song(s)
          </button>
          <button
            className="napster-btn"
            onClick={() => {
              if (selectedResultIdx === null) {
                window.alert('Select a song first.');
                return;
              }
              window.alert('Added to Hot List!\n\n' + results[selectedResultIdx].filename);
            }}
          >
            Add Selected Song to Hot List
          </button>
        </div>
      </div>

      {/* HOT LIST */}
      <div className={`napster-panel${activeTab === 'hotlist' ? ' active' : ''}`}>
        <div style={{ padding: 16, fontSize: 11, color: '#555' }}>
          <b>Hot List</b>
          <br />
          <br />
          Your hot list is empty.
        </div>
      </div>

      {/* TRANSFER */}
      <div className={`napster-panel${activeTab === 'transfer' ? ' active' : ''}`}>
        <div className="napster-transfer-wrap">
          <div className="napster-transfer-section">
            <div className="napster-transfer-header-row">
              <div className="napster-th tcol-icon"></div>
              <div className="napster-th tcol-filename">Filename</div>
              <div className="napster-th tcol-filesize">File Size</div>
              <div className="napster-th tcol-user">User</div>
              <div className="napster-th tcol-status">Status</div>
              <div className="napster-th tcol-speed">Speed</div>
              <div className="napster-th tcol-progress">Progress</div>
              <div className="napster-th tcol-rate">Rate</div>
              <div className="napster-th tcol-timeleft">Time Left</div>
            </div>
            <div className="napster-transfer-body">
              {downloads.map((dl) => (
                <div
                  key={dl.id}
                  className="napster-transfer-row"
                  style={
                    dl.progress >= 100
                      ? { background: '#e8f5e8' }
                      : dl.cancelled
                        ? { color: '#888' }
                        : {}
                  }
                >
                  <div className="napster-td tcol-icon napster-dl-icon">⬇</div>
                  <div className="napster-td tcol-filename nap-td-fn" title={dl.filename}>
                    {dl.filename}
                  </div>
                  <div className="napster-td tcol-filesize">{dl.filesize}</div>
                  <div className="napster-td tcol-user">{dl.user}</div>
                  <div className="napster-td tcol-status">
                    {dl.cancelled ? 'Cancelled' : dl.status}
                  </div>
                  <div className="napster-td tcol-speed">{dl.linespeed}</div>
                  <div className="napster-td tcol-progress">
                    <div className="napster-progress-cell">
                      <div className="napster-progress-fill" style={{ width: dl.progress + '%' }} />
                      <div className="napster-progress-text">{dl.progress}%</div>
                    </div>
                  </div>
                  <div className="napster-td tcol-rate">
                    {dl.progress >= 100 || dl.cancelled ? '—' : dl.currentRate.toFixed(1) + ' k/s'}
                  </div>
                  <div className="napster-td tcol-timeleft">
                    {dl.progress >= 100 || dl.cancelled
                      ? '—'
                      : fmtTime((dl.totalKb - dl.downloadedKb) / (dl.currentRate || 1))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="napster-transfer-stats">
          <span>Concurrent Downloads: {activeDownloads}</span>
          <span>Concurrent Uploads: 0</span>
        </div>
        <div className="napster-transfer-actions">
          <button
            className="napster-btn"
            onClick={() =>
              setDownloads((prev) => prev.filter((d) => d.progress < 100 && !d.cancelled))
            }
          >
            Clear Finished
          </button>
          <button
            className="napster-btn"
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

      {/* HELP */}
      <div className={`napster-panel${activeTab === 'help' ? ' active' : ''}`}>
        <div style={{ padding: 16, fontSize: 11 }}>
          <b>Napster v2.0 BETA Help</b>
          <br />
          <br />
          <b>Search:</b> Enter an artist or song title and click Find It!
          <br />
          <b>Download:</b> Select a result and click &quot;Get Selected Song(s)&quot; or
          double-click
          <br />
          <b>Transfer:</b> Monitor download progress in the Transfer tab
        </div>
      </div>

      {/* Status bar */}
      <div className="napster-status-bar">
        <div className="napster-status-left">{statusText}</div>
        <div className="napster-status-right" />
      </div>
    </AppWindow>
  );
}
