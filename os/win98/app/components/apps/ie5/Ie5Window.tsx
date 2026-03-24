'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AppWindow, TitleBar } from '../../win98';
import type { AppConfig } from '@/app/types/app-config';
import { useWindowManager } from '@retro-web/core/context';

const ICON = 'apps/ie5/ie5-icon.png';

const DEFAULT_URL = 'https://web.archive.org/web/19990221081643/http://www.msn.com/';

const FAVORITES = [
  {
    label: 'MSN',
    url: 'https://web.archive.org/web/19990221081643/http://www.msn.com/',
    displayUrl: 'http://www.msn.com/',
  },
  {
    label: 'AskJeeves',
    url: 'https://web.archive.org/web/19990422115127/http://www.askjeeves.com/',
    displayUrl: 'http://www.askjeeves.com/',
  },
  {
    label: 'AOL',
    url: 'https://web.archive.org/web/19990508164724/http://www.aol.com/',
    displayUrl: 'http://www.aol.com/',
  },
  {
    label: 'Ebay',
    url: 'https://web.archive.org/web/19990422071007/http://www.ebay.com/',
    displayUrl: 'http://www.ebay.com/',
  },
];

function getWindowsUpdatePage(): string {
  return (
    '<!DOCTYPE html><html><head><meta charset="utf-8"><style>' +
    'body{margin:0;padding:0;font-family:Arial,sans-serif;font-size:12px;background:#fff;color:#000}' +
    'a{color:#0000cc;text-decoration:underline;cursor:pointer}' +
    '#header{background:linear-gradient(to bottom,#003399,#0066cc);padding:8px 12px;color:#fff;display:flex;align-items:center;gap:8px}' +
    '#header-title{font-size:18px;font-weight:bold}' +
    '#layout{display:flex;min-height:400px}' +
    '#sidebar{width:140px;background:#d4d0c8;border-right:1px solid #808080;padding:8px;flex-shrink:0}' +
    '#sidebar a{display:block;margin-bottom:6px;font-size:11px;color:#000099}' +
    '#main{flex:1;padding:16px}h2{font-size:14px;font-weight:bold;margin:0 0 10px 0;color:#003399}' +
    '.phase{display:none}.phase.active{display:block}.dots{display:inline-block;min-width:24px}' +
    'table{border-collapse:collapse;width:100%;margin:10px 0}' +
    'th{background:#003399;color:#fff;padding:4px 6px;text-align:left;font-size:11px}' +
    'td{padding:4px 6px;border-bottom:1px solid #d4d0c8;font-size:11px;vertical-align:middle}' +
    'tr:nth-child(even) td{background:#f0f0f0}' +
    '.btn{border:2px outset #c0c0c0;background:#c0c0c0;padding:4px 14px;font-size:12px;cursor:pointer;font-family:Arial,sans-serif}' +
    '.btn:active{border-style:inset}' +
    '.progress-wrap{border:2px inset #808080;width:300px;height:18px;background:#fff;margin:12px 0}' +
    '.progress-bar{height:100%;width:0%;background:#000080;transition:none}' +
    '.notice{background:#ffffc0;border:1px solid #c0c000;padding:6px 10px;margin-bottom:10px;font-size:11px}' +
    '</style></head><body>' +
    '<div id="header"><span style="font-size:22px">&#x1F5BC;</span><span id="header-title">Windows Update</span></div>' +
    '<div id="layout"><div id="sidebar"><b style="font-size:11px">Windows Update</b><br><br>' +
    '<a onclick="return false">Product Updates</a><a onclick="return false">Driver Updates</a>' +
    '<a onclick="return false">History</a><a onclick="return false">Support</a></div>' +
    '<div id="main">' +
    '<div class="phase active" id="phase0"><h2>Welcome to Windows Update</h2>' +
    '<div class="notice">Windows Update is scanning your computer&hellip;</div>' +
    '<p>Scanning<span class="dots" id="scan-dots"></span></p></div>' +
    '<div class="phase" id="phase1"><h2>Critical Updates Available</h2>' +
    '<div class="notice"><b>3 critical updates</b> available.</div>' +
    '<table><tr><th></th><th>Name</th><th>Description</th><th>Type</th><th>Size</th></tr>' +
    '<tr><td><input type="checkbox" checked></td><td><b>Security Update (KB813951)</b></td><td>Fixes MSHTML.DLL vulnerability.</td><td>Critical</td><td>1.2 MB</td></tr>' +
    '<tr><td><input type="checkbox" checked></td><td><b>Media Player Patch (KB828026)</b></td><td>Fixes buffer overrun.</td><td>Critical</td><td>0.8 MB</td></tr>' +
    '<tr><td><input type="checkbox" checked></td><td><b>Y2K Update</b></td><td>Y2K date compliance.</td><td>Critical</td><td>2.1 MB</td></tr>' +
    '</table><button class="btn" onclick="startInstall()">Install Now</button></div>' +
    '<div class="phase" id="phase2"><h2>Downloading and Installing&hellip;</h2>' +
    '<p id="install-status">Preparing&hellip;</p>' +
    '<div class="progress-wrap"><div class="progress-bar" id="prog-bar"></div></div>' +
    '<p id="install-pct">0%</p></div>' +
    '<div class="phase" id="phase3"><h2>Installation Complete</h2>' +
    '<div class="notice">Updates installed. <b>Restart required.</b></div>' +
    '<button class="btn" onclick="alert(\'Windows 98 is shutting down...\\n\\nIt is now safe to turn off your computer.\')">Restart Now</button></div>' +
    '</div></div>' +
    '<script>(function(){var phases=["phase0","phase1","phase2","phase3"];' +
    'function show(n){phases.forEach(function(id,i){var el=document.getElementById(id);if(el)el.className="phase"+(i===n?" active":"");});}' +
    'var dots=0;var dotEl=document.getElementById("scan-dots");' +
    'var dt=setInterval(function(){dots=(dots+1)%4;if(dotEl)dotEl.textContent=".".repeat(dots);},400);' +
    'setTimeout(function(){clearInterval(dt);show(1);},1800);' +
    'window.startInstall=function(){show(2);var u=["Security Update","Media Player Patch","Y2K Update"];' +
    'var pct=0;var bar=document.getElementById("prog-bar");var st=document.getElementById("install-status");var pe=document.getElementById("install-pct");' +
    'var t=setInterval(function(){pct+=1;if(bar)bar.style.width=pct+"%";if(pe)pe.textContent=pct+"%";' +
    'var i=Math.min(Math.floor(pct/34),u.length-1);if(st)st.textContent="Installing: "+u[i]+"...";' +
    'if(pct>=100){clearInterval(t);setTimeout(function(){show(3);},400);}},35);};' +
    '})();<\/script></body></html>'
  );
}

export const ie5AppConfig: AppConfig = {
  id: 'ie5',
  label: 'Internet Explorer 5',
  icon: ICON,
  desktop: true,
  startMenu: { path: ['Programs', 'Internet'] },
  taskbarLabel: 'Microsoft Internet...',
};

export function Ie5Window() {
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const [iframeSrcdoc, setIframeSrcdoc] = useState<string | null>(null);
  const [urlBarValue, setUrlBarValue] = useState('http://www.msn.com/');
  const [statusText, setStatusText] = useState('Done');
  const [helpMenuOpen, setHelpMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const hasLoadedRef = useRef(false);
  const ctx = useWindowManager();

  const isVisible = ctx?.isAppVisible('ie5') ?? false;

  // Lazy-load iframe on first show
  useEffect(() => {
    if (isVisible && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      setIframeSrc(DEFAULT_URL);
      setStatusText('Opening page http://www.msn.com/...');
    }
  }, [isVisible]);

  // Expose WindowsUpdate97 global
  useEffect(() => {
    (window as any).WindowsUpdate97 = {
      open: () => {
        ctx?.showApp('ie5');
        setIframeSrc(null);
        setIframeSrcdoc(getWindowsUpdatePage());
        setUrlBarValue('http://windowsupdate.microsoft.com/');
        setStatusText('Done');
      },
    };
  }, [ctx]);

  // Close help menu on outside click
  useEffect(() => {
    if (!helpMenuOpen) return;
    const handler = () => setHelpMenuOpen(false);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [helpMenuOpen]);

  function handleFavoriteClick(fav: (typeof FAVORITES)[0]) {
    setIframeSrcdoc(null);
    setIframeSrc(fav.url);
    setUrlBarValue(fav.displayUrl);
    setStatusText('Opening page ' + fav.displayUrl + '...');
    setTimeout(() => setStatusText('Done'), 1000);
  }

  return (
    <AppWindow
      id="ie5-window"
      appId="ie5"
      allowResize
      className="ie5-window app-window app-window-hidden"
      titleBar={
        <TitleBar
          title="Microsoft Internet Explorer"
          icon={
            <img
              src={ICON}
              className="ie5-title-logo"
              alt="Internet Explorer"
              style={{ width: 16, height: 16, marginRight: 4 }}
            />
          }
          showMin
          showMax
          showClose
        />
      }
    >
      {/* Menu bar */}
      <div className="ie5-menu-bar">
        <div className="ie5-menu-item">
          <u>F</u>ile
        </div>
        <div className="ie5-menu-item">
          <u>E</u>dit
        </div>
        <div className="ie5-menu-item">
          <u>V</u>iew
        </div>
        <div className="ie5-menu-item">
          F<u>a</u>vorites
        </div>
        <div className="ie5-menu-item">
          <u>T</u>ools
        </div>
        <div
          className="ie5-menu-item"
          onClick={(e) => {
            e.stopPropagation();
            setHelpMenuOpen((v) => !v);
          }}
        >
          <u>H</u>elp
        </div>
      </div>

      {helpMenuOpen && (
        <div className="ie5-menu-dropdown" style={{ position: 'absolute' }}>
          <div className="ie5-menu-dropdown-item disabled">Contents and Index</div>
          <div className="ie5-menu-dropdown-item disabled">Tip of the Day</div>
          <div className="ie5-menu-dropdown-item disabled">For Netscape Users</div>
          <div className="ie5-menu-divider" />
          <div className="ie5-menu-dropdown-item disabled">Online Support</div>
          <div className="ie5-menu-dropdown-item disabled">Send Feedback</div>
          <div className="ie5-menu-divider" />
          <div
            className="ie5-menu-dropdown-item"
            onClick={() => {
              setAboutOpen(true);
              setHelpMenuOpen(false);
            }}
          >
            <u>A</u>bout Internet Explorer
          </div>
        </div>
      )}

      {/* Navigation toolbar */}
      <div className="ie5-toolbar-row">
        <div className="ie5-grippy" />
        <div className="ie5-toolbar">
          <button className="ie5-btn disabled" title="Back">
            <span className="ie5-btn-icon">⬅</span>
            <span className="ie5-btn-label">Back</span>
          </button>
          <button className="ie5-btn disabled" title="Forward">
            <span className="ie5-btn-icon">➡</span>
            <span className="ie5-btn-label">Forward</span>
          </button>
          <button className="ie5-btn disabled" title="Stop">
            <span className="ie5-btn-icon">✖</span>
            <span className="ie5-btn-label">Stop</span>
          </button>
          <button className="ie5-btn disabled" title="Refresh">
            <span className="ie5-btn-icon">🔄</span>
            <span className="ie5-btn-label">Refresh</span>
          </button>
          <button className="ie5-btn disabled" title="Home">
            <span className="ie5-btn-icon">🏠</span>
            <span className="ie5-btn-label">Home</span>
          </button>
          <div className="ie5-tb-sep" />
          <button className="ie5-btn disabled" title="Search">
            <span className="ie5-btn-icon">🔍</span>
            <span className="ie5-btn-label">Search</span>
          </button>
          <button className="ie5-btn disabled" title="Favorites">
            <span className="ie5-btn-icon">🗂️</span>
            <span className="ie5-btn-label">Favorites</span>
          </button>
          <button className="ie5-btn disabled" title="History">
            <span className="ie5-btn-icon">🕒</span>
            <span className="ie5-btn-label">History</span>
          </button>
          <div className="ie5-tb-sep" />
          <button className="ie5-btn disabled" title="Mail">
            <span className="ie5-btn-icon">✉</span>
            <span className="ie5-btn-label">Mail</span>
          </button>
          <button className="ie5-btn disabled" title="Print">
            <span className="ie5-btn-icon">🖨️</span>
            <span className="ie5-btn-label">Print</span>
          </button>
        </div>
        <div className="ie5-windows-logo">
          <img
            src="shell/icons/windows_update.png"
            alt="Windows Logo"
            style={{ width: 22, height: 22 }}
          />
        </div>
      </div>

      {/* Address bar */}
      <div className="ie5-toolbar-row">
        <div className="ie5-grippy" />
        <div className="ie5-address-bar">
          <span className="ie5-address-label">
            <u>A</u>ddress
          </span>
          <div className="ie5-url-input-container">
            <img src={ICON} alt="IE" className="ie5-url-icon" />
            <input
              type="text"
              className="ie5-url-input"
              value={urlBarValue}
              readOnly
              onChange={() => {}}
            />
          </div>
        </div>
        <div className="ie5-address-go disabled">Go</div>
        <div className="ie5-address-links disabled">
          Links <span>»</span>
        </div>
      </div>

      {/* Main body */}
      <div className="ie5-body">
        {sidebarVisible && (
          <div className="ie5-sidebar">
            <div className="ie5-sidebar-header">
              <span>Favorites</span>
              <button
                className="win-btn title-btn ie5-sidebar-close"
                title="Close"
                onClick={() => setSidebarVisible(false)}
              >
                <span className="icon-close">X</span>
              </button>
            </div>
            <div className="ie5-sidebar-toolbar">
              <button className="win-btn ie5-sidebar-btn disabled">Add...</button>
              <button className="win-btn ie5-sidebar-btn disabled">Organize...</button>
            </div>
            <div className="ie5-sidebar-list">
              {FAVORITES.map((fav) => (
                <div
                  key={fav.label}
                  className="ie5-favorite-item"
                  onClick={() => handleFavoriteClick(fav)}
                >
                  <img src={ICON} alt="IE" />
                  <span>{fav.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="ie5-content">
          {iframeSrcdoc !== null ? (
            <iframe
              id="ie5-iframe"
              key="srcdoc"
              srcDoc={iframeSrcdoc}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              title="Internet Explorer content"
            />
          ) : (
            <iframe
              id="ie5-iframe"
              key={iframeSrc ?? 'blank'}
              src={iframeSrc ?? 'about:blank'}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              title="Internet Explorer content"
            />
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="ie5-status-bar">
        <span className="ie5-status-icon" />
        <span className="ie5-status-text">{statusText}</span>
        <div className="ie5-progress-wrap">
          <div className="ie5-progress-bar" />
        </div>
        <div className="ie5-component-bar">
          <div className="ie5-zone">
            <img src={ICON} alt="Internet" />
            <span>Internet</span>
          </div>
        </div>
      </div>

      {/* About dialog */}
      {aboutOpen && (
        <div className="ie5-about-dialog">
          <div className="ie5-about-title-bar">
            <span className="ie5-about-title-text">About Internet Explorer</span>
            <button
              type="button"
              className="win-btn title-btn ie5-about-close"
              onClick={() => setAboutOpen(false)}
            >
              <span className="icon-close">X</span>
            </button>
          </div>
          <div className="ie5-about-content">
            <div className="ie5-about-logo">
              <img src={ICON} alt="IE Logo" />
              <div className="ie5-about-logo-text">
                Microsoft<sup>®</sup>
                <br />
                <b>Internet Explorer 5</b>
              </div>
            </div>
            <div className="ie5-about-info">
              Version: 5.00.2314.1003
              <br />
              Cipher Strength: 40-bit (Update Information)
              <br />
              Product ID: 50071-314-0005673-04544
            </div>
            <div className="ie5-about-legal">
              <textarea
                readOnly
                defaultValue="Based on NCSA Mosaic. NCSA Mosaic(TM); was developed at the National Center for Supercomputing Applications at the University of Illinois at Urbana-Champaign."
              />
            </div>
            <div className="ie5-about-bottom">
              <img
                src="shell/icons/windows_update.png"
                alt="Windows"
                style={{ width: 24, height: 24 }}
              />
              <span>Copyright ©1995-1999 Microsoft Corp.</span>
              <button className="win-btn ie5-about-ok" onClick={() => setAboutOpen(false)}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </AppWindow>
  );
}
