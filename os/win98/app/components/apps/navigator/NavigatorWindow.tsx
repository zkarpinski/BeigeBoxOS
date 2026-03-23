'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AppWindow, TitleBar } from '../../win98';
import type { AppConfig } from '@/app/types/app-config';

export const navigatorAppConfig: AppConfig = {
  id: 'navigator',
  label: 'Netscape Navigator',
  icon: 'apps/navigator/navigator-icon.png',
  openByDefault: true,
  desktop: true,
  startMenu: { path: ['Programs', 'Internet'] },
  taskbarLabel: 'Netscape',
};

/** CORS proxy fallback when direct fetch fails (cross-origin). Returns JSON with .contents */
const CORS_PROXY = 'https://whateverorigin.org/get?url=';

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return 'about:home';
  if (trimmed === 'about:home' || trimmed === 'about:blank') return trimmed;
  if (trimmed.includes(' ') || !trimmed.includes('.'))
    return 'https://www.google.com/search?q=' + encodeURIComponent(trimmed);
  if (!trimmed.includes('://')) return 'https://' + trimmed;
  return trimmed;
}

function getHomePage(): string {
  const logoUrl = new URL('apps/navigator/navigator-icon.png', document.baseURI).href;
  const linkedinLogoUrl = new URL('apps/navigator/linkedin-logo.png', document.baseURI).href;
  const githubLogoUrl = new URL('apps/navigator/github-logo.png', document.baseURI).href;
  return [
    '<!DOCTYPE html><html><head>',
    '<meta charset="UTF-8"><title>Netscape Navigator Home</title>',
    '<style>',
    'body{margin:0;font-family:Arial,sans-serif;background:#fff;}',
    '.header{background:linear-gradient(180deg,#003399 0%,#0055cc 100%);padding:16px 24px;display:flex;align-items:center;gap:16px;}',
    '.ns-logo{width:60px;height:60px;object-fit:contain;flex-shrink:0;}',
    '.header-text{color:#fff;}',
    '.header-text h1{margin:0;font-size:22px;font-weight:bold;}',
    '.header-text p{margin:4px 0 0;font-size:13px;opacity:0.85;}',
    '.content{padding:20px 24px;}',
    '.welcome-box{border:1px solid #ccc;background:#f0f4ff;padding:12px 16px;margin-bottom:20px;border-radius:2px;}',
    '.welcome-box h2{margin:0 0 8px;font-size:15px;color:#003399;}',
    '.welcome-box p{margin:0;font-size:12px;color:#333;line-height:1.6;}',
    '.links-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:16px;}',
    '.link-card{border:1px solid #ccc;padding:10px 12px;background:#fff;cursor:pointer;display:flex;align-items:center;gap:10px;}',
    '.link-card:hover{background:#e8f0ff;border-color:#003399;}',
    '.link-card img{width:28px;height:28px;object-fit:contain;flex-shrink:0;}',
    '.link-card-text h3{margin:0 0 4px;font-size:12px;color:#003399;}',
    '.link-card-text p{margin:0;font-size:10px;color:#666;}',
    '.footer{margin-top:24px;padding-top:12px;border-top:1px solid #ccc;font-size:10px;color:#666;text-align:center;}',
    '</style></head><body>',
    '<div class="header">',
    '<img src="' + logoUrl + '" class="ns-logo" alt="Netscape">',
    '<div class="header-text"><h1>Netscape Navigator</h1>',
    '<p>Version 4.0 &nbsp;&bull;&nbsp; Welcome to the World Wide Web</p></div>',
    '</div>',
    '<div class="content">',
    '<div class="welcome-box">',
    "<h2>Welcome to Zachary Karpinski's Home Page!</h2>",
    '<p>This is a functional replica of Windows 98 representing my memories, interests, portfolio and work experience.</p>',
    "<p>Type a web address in the Location bar above, or click one of the links below to begin exploring the World Wide Web. You are using Netscape Navigator, the world's most popular web browser.</p>",
    "<p>You can also explore various applications such as Word, Paint, Minesweeper, The Incredible Machine, Notepad, Winamp, Napster, AIM, Navigator, Tony Hawk's Pro Skater 2, and more.</p>",
    '<p>I hope you enjoy your visit!</p>',
    '</div>',
    '<div class="links-grid">',
    '<div class="link-card" data-url="https://www.linkedin.com/in/zacharykarpinski/"><img src="' +
      linkedinLogoUrl +
      '" alt="LinkedIn"><div class="link-card-text"><h3>LinkedIn</h3><p>View my LinkedIn profile</p></div></div>',
    '<div class="link-card" data-url="https://github.com/zkarpinski"><img src="' +
      githubLogoUrl +
      '" alt="GitHub"><div class="link-card-text"><h3>GitHub</h3><p>View my GitHub profile</p></div></div>',
    '</div></div>',
    '<div class="footer">Netscape Communications Corporation &copy; 1997 &nbsp;|&nbsp; All Rights Reserved</div>',
    '</body></html>',
  ].join('');
}

function getErrorPage(url: string, reason?: string): string {
  const msg = reason || 'Netscape is unable to find the server or DNS error.';
  return [
    '<!DOCTYPE html><html><head><meta charset="UTF-8">',
    '<title>Netscape: Server not found</title>',
    '<style>body{font-family:Arial,sans-serif;margin:40px;background:#fff;color:#000;}',
    'h1{color:#cc0000;font-size:18px;}h2{font-size:14px;margin-top:20px;}',
    'ul{font-size:12px;line-height:1.8;}',
    '.url{font-family:monospace;background:#f0f0f0;padding:2px 6px;border:1px solid #ccc;}</style></head><body>',
    '<h1>Netscape is unable to find the server at <span class="url">' + url + '</span></h1>',
    '<p>' + msg + '</p>',
    '<h2>The page could not be displayed. Here are some suggestions:</h2>',
    '<ul>',
    '<li>Check the address for typing errors such as <b>ww.example.com</b> instead of <b>www.example.com</b></li>',
    "<li>If you are unable to load any pages, check your computer's network connection.</li>",
    '<li>If your computer or network is protected by a firewall or proxy, make sure that Netscape is permitted to access the Web.</li>',
    '</ul></body></html>',
  ].join('');
}

export function NavigatorWindow() {
  const [urlBarValue, setUrlBarValue] = useState('about:home');
  const [srcdoc, setSrcdoc] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [isSecure, setIsSecure] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState({ left: 0, top: 0 });

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const historyArr = useRef<string[]>([]);
  const histPos = useRef(-1);
  const abortRef = useRef<AbortController | null>(null);
  const isLoadingRef = useRef(false);

  const navigate = useCallback((rawUrl: string, addToHistory = true) => {
    if (isLoadingRef.current && abortRef.current) abortRef.current.abort();

    const url = normalizeUrl(rawUrl);

    if (url === 'about:home') {
      setSrcdoc(getHomePage());
      setUrlBarValue('about:home');
      setStatusText('Document: Done');
      setIsSecure(false);
      if (addToHistory) {
        historyArr.current.splice(histPos.current + 1);
        historyArr.current.push('about:home');
        histPos.current = historyArr.current.length - 1;
        setCanGoBack(histPos.current > 0);
        setCanGoForward(false);
      }
      return;
    }
    if (url === 'about:blank') {
      setSrcdoc('');
      setUrlBarValue('about:blank');
      setStatusText('');
      if (addToHistory) {
        historyArr.current.splice(histPos.current + 1);
        historyArr.current.push('about:blank');
        histPos.current = historyArr.current.length - 1;
        setCanGoBack(histPos.current > 0);
        setCanGoForward(false);
      }
      return;
    }

    setUrlBarValue(url);
    setIsSecure(url.startsWith('https://'));

    let hostname = url;
    try {
      hostname = new URL(url).hostname;
    } catch {
      /* ignore */
    }

    setStatusText('Contacting ' + hostname + '...');
    setIsLoading(true);
    isLoadingRef.current = true;
    setProgress(20);

    const controller = new AbortController();
    abortRef.current = controller;

    function onSuccess(html: string) {
      const baseTag = '<base href="' + url + '">';
      let modified = html;
      if (/(<head[^>]*>)/i.test(modified)) {
        modified = modified.replace(/(<head[^>]*>)/i, '$1' + baseTag);
      } else if (/<html/i.test(modified)) {
        modified = modified.replace(/(<html[^>]*>)/i, '$1<head>' + baseTag + '</head>');
      } else {
        modified = baseTag + modified;
      }
      modified = modified.replace(/top\s*\.\s*location/g, 'window.location');
      modified = modified.replace(/parent\s*\.\s*location/g, 'window.location');

      setSrcdoc(modified);
      setProgress(100);
      setStatusText('Document: Done');
      setIsLoading(false);
      isLoadingRef.current = false;

      if (addToHistory) {
        historyArr.current.splice(histPos.current + 1);
        historyArr.current.push(url);
        histPos.current = historyArr.current.length - 1;
        setCanGoBack(histPos.current > 0);
        setCanGoForward(false);
      }
    }

    function onError(err: unknown) {
      if (err && typeof err === 'object' && (err as Error).name === 'AbortError') return;
      setSrcdoc(getErrorPage(url, err instanceof Error ? err.message : undefined));
      setStatusText('Error: Unable to load page');
      setIsLoading(false);
      isLoadingRef.current = false;
      setProgress(0);
    }

    setProgress(60);
    setStatusText('Transferring data from ' + hostname + '...');

    fetch(url, { signal: controller.signal, mode: 'cors' })
      .then((res) => {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text();
      })
      .then((html) => onSuccess(html))
      .catch((err) => {
        if (err?.name === 'AbortError') return;
        setProgress(20);
        setStatusText('Contacting ' + hostname + '... (via proxy)');
        fetch(CORS_PROXY + encodeURIComponent(url), { signal: controller.signal })
          .then((res) => {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json() as Promise<{ contents: string }>;
          })
          .then((data) => onSuccess(data.contents))
          .catch(onError);
      });
  }, []);

  // Load home page on mount
  useEffect(() => {
    navigate('about:home');
  }, [navigate]);

  // Message listener for nav-navigate from home page iframes
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.data?.type === 'nav-navigate') navigate(e.data.url);
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [navigate]);

  // Close menus on outside click
  useEffect(() => {
    function onClick() {
      setActiveMenu(null);
    }
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  function handleStop() {
    if (abortRef.current) abortRef.current.abort();
    setIsLoading(false);
    isLoadingRef.current = false;
    setStatusText('Transfer interrupted');
  }

  function handleBack() {
    if (histPos.current > 0) {
      histPos.current--;
      setCanGoBack(histPos.current > 0);
      setCanGoForward(histPos.current < historyArr.current.length - 1);
      navigate(historyArr.current[histPos.current], false);
    }
  }

  function handleForward() {
    if (histPos.current < historyArr.current.length - 1) {
      histPos.current++;
      setCanGoBack(histPos.current > 0);
      setCanGoForward(histPos.current < historyArr.current.length - 1);
      navigate(historyArr.current[histPos.current], false);
    }
  }

  function handleIframeLoad() {
    try {
      const doc = iframeRef.current?.contentDocument;
      if (!doc) return;
      doc.querySelectorAll('[data-url]').forEach((card) => {
        card.addEventListener('click', () => navigate((card as HTMLElement).dataset.url || ''));
      });
    } catch {
      /* cross-origin */
    }
  }

  function openMenu(e: React.MouseEvent, menuId: string) {
    e.stopPropagation();
    if (activeMenu === menuId) {
      setActiveMenu(null);
      return;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenuPos({ left: rect.left, top: rect.bottom });
    setActiveMenu(menuId);
  }

  function hoverMenu(e: React.MouseEvent, menuId: string) {
    if (activeMenu && activeMenu !== menuId) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setMenuPos({ left: rect.left, top: rect.bottom });
      setActiveMenu(menuId);
    }
  }

  function handleMenuAction(action: string) {
    setActiveMenu(null);
    const shell = (
      window as unknown as {
        Windows98?: { showApp: (id: string) => void; hideApp: (id: string) => void };
      }
    ).Windows98;
    switch (action) {
      case 'nav-menu-file-open': {
        const url = prompt('Open Location:', 'https://');
        if (url) navigate(url);
        break;
      }
      case 'nav-menu-file-new':
        shell?.showApp('navigator');
        navigate('about:home');
        break;
      case 'nav-menu-file-save':
        alert('Save As is not implemented in Netscape Navigator 97.');
        break;
      case 'nav-menu-file-print':
        try {
          iframeRef.current?.contentWindow?.print();
        } catch {
          window.print();
        }
        break;
      case 'nav-menu-file-offline':
        alert('Go Offline mode is not available in this version.');
        break;
      case 'nav-menu-file-close':
        shell?.hideApp('navigator');
        break;
      case 'nav-menu-edit-find': {
        const term = prompt('Find in page:');
        if (term) {
          try {
            (iframeRef.current?.contentWindow as Window & { find?: (s: string) => void })?.find?.(
              term,
            );
          } catch {
            /* ignore */
          }
        }
        break;
      }
      case 'nav-menu-edit-prefs':
        alert('Preferences\n\nHome: about:home\nSecurity: Standard');
        break;
      case 'nav-menu-view-reload':
        navigate(urlBarValue, false);
        break;
      case 'nav-menu-view-stop':
        handleStop();
        break;
      case 'nav-menu-view-source':
        alert('View Source is not implemented. Open developer tools to view source.');
        break;
      case 'nav-menu-go-back':
        handleBack();
        break;
      case 'nav-menu-go-forward':
        handleForward();
        break;
      case 'nav-menu-go-home':
        navigate('about:home');
        break;
      case 'nav-menu-go-search':
        navigate('https://www.google.com');
        break;
      case 'nav-menu-comm-navigator':
        shell?.showApp('navigator');
        break;
      case 'nav-menu-comm-word':
        shell?.showApp('word');
        break;
      case 'nav-menu-comm-vb6':
        shell?.showApp('vb6');
        break;
      case 'nav-menu-help-about':
        alert(
          'Netscape Navigator\nVersion 4.0 (Windows)\n\nCopyright \u00a9 1994\u20131997 Netscape Communications Corporation.\nAll Rights Reserved.\n\nThis product is licensed under the terms of your\nNetscape License Agreement.',
        );
        break;
      case 'nav-menu-help-contents':
        navigate('https://en.wikipedia.org/wiki/Netscape_Navigator');
        break;
    }
  }

  const securityIcon = isSecure ? '🔒' : '🔓';
  const securityTitle = isSecure ? 'Secure connection' : 'Insecure connection';

  // Dropdown JSX helper
  function Dropdown({ menuId, children }: { menuId: string; children: React.ReactNode }) {
    if (activeMenu !== menuId) return null;
    return (
      <div
        className="nav-menu-dropdown open"
        style={{ left: menuPos.left, top: menuPos.top }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    );
  }

  function MenuItem({
    action,
    children,
    disabled,
  }: {
    action?: string;
    children: React.ReactNode;
    disabled?: boolean;
  }) {
    return (
      <div
        className={`nav-menu-dropdown-item${disabled ? ' disabled' : ''}`}
        onClick={
          action && !disabled
            ? (e) => {
                e.stopPropagation();
                handleMenuAction(action);
              }
            : undefined
        }
      >
        {children}
      </div>
    );
  }

  return (
    <AppWindow
      id="navigator-window"
      appId="navigator"
      allowResize
      className="nav-window app-window app-window-hidden"
      titleBar={
        <TitleBar
          title="Netscape"
          icon={
            <img
              src="apps/navigator/navigator-icon.png"
              className="nav-title-logo"
              alt="Netscape"
            />
          }
          showMin
          showMax
          showClose
        />
      }
    >
      {/* Menu bar */}
      <div className="nav-menu-bar">
        <div
          className="nav-menu-item"
          onClick={(e) => openMenu(e, 'file')}
          onMouseEnter={(e) => hoverMenu(e, 'file')}
        >
          <u>F</u>ile
        </div>
        <div
          className="nav-menu-item"
          onClick={(e) => openMenu(e, 'edit')}
          onMouseEnter={(e) => hoverMenu(e, 'edit')}
        >
          <u>E</u>dit
        </div>
        <div
          className="nav-menu-item"
          onClick={(e) => openMenu(e, 'view')}
          onMouseEnter={(e) => hoverMenu(e, 'view')}
        >
          <u>V</u>iew
        </div>
        <div
          className="nav-menu-item"
          onClick={(e) => openMenu(e, 'go')}
          onMouseEnter={(e) => hoverMenu(e, 'go')}
        >
          <u>G</u>o
        </div>
        <div
          className="nav-menu-item"
          onClick={(e) => openMenu(e, 'communicator')}
          onMouseEnter={(e) => hoverMenu(e, 'communicator')}
        >
          <u>C</u>ommunicator
        </div>
        <div
          className="nav-menu-item"
          onClick={(e) => openMenu(e, 'help')}
          onMouseEnter={(e) => hoverMenu(e, 'help')}
        >
          <u>H</u>elp
        </div>
      </div>

      {/* Dropdowns (rendered outside AppWindow to allow overflow) */}
      <Dropdown menuId="file">
        <MenuItem action="nav-menu-file-new">
          <u>N</u>ew Window
        </MenuItem>
        <MenuItem action="nav-menu-file-open">
          <u>O</u>pen Page...
        </MenuItem>
        <div className="nav-menu-divider" />
        <MenuItem action="nav-menu-file-save">
          <u>S</u>ave As...
        </MenuItem>
        <MenuItem action="nav-menu-file-print">
          <u>P</u>rint...
        </MenuItem>
        <div className="nav-menu-divider" />
        <MenuItem action="nav-menu-file-offline">
          Go Offli<u>n</u>e
        </MenuItem>
        <div className="nav-menu-divider" />
        <MenuItem action="nav-menu-file-close">
          Clos<u>e</u>
        </MenuItem>
      </Dropdown>
      <Dropdown menuId="edit">
        <MenuItem disabled>
          Cu<u>t</u>
        </MenuItem>
        <MenuItem disabled>
          <u>C</u>opy
        </MenuItem>
        <MenuItem disabled>
          <u>P</u>aste
        </MenuItem>
        <div className="nav-menu-divider" />
        <MenuItem action="nav-menu-edit-find">
          <u>F</u>ind in Page...
        </MenuItem>
        <div className="nav-menu-divider" />
        <MenuItem action="nav-menu-edit-prefs">
          Prefere<u>n</u>ces...
        </MenuItem>
      </Dropdown>
      <Dropdown menuId="view">
        <MenuItem action="nav-menu-view-reload">
          <u>R</u>eload
        </MenuItem>
        <MenuItem action="nav-menu-view-stop">
          <u>S</u>top
        </MenuItem>
        <div className="nav-menu-divider" />
        <MenuItem action="nav-menu-view-source">
          Page Sour<u>c</u>e
        </MenuItem>
        <MenuItem disabled>
          Page In<u>f</u>o
        </MenuItem>
        <div className="nav-menu-divider" />
        <MenuItem disabled>
          <u>N</u>avigation Toolbar
        </MenuItem>
        <MenuItem disabled>
          <u>L</u>ocation Toolbar
        </MenuItem>
        <MenuItem disabled>
          Personal <u>T</u>oolbar
        </MenuItem>
      </Dropdown>
      <Dropdown menuId="go">
        <MenuItem action="nav-menu-go-back">
          <u>B</u>ack
        </MenuItem>
        <MenuItem action="nav-menu-go-forward">
          <u>F</u>orward
        </MenuItem>
        <MenuItem action="nav-menu-go-home">
          <u>H</u>ome
        </MenuItem>
        <div className="nav-menu-divider" />
        <MenuItem action="nav-menu-go-search">
          <u>S</u>earch the Web
        </MenuItem>
      </Dropdown>
      <Dropdown menuId="communicator">
        <MenuItem action="nav-menu-comm-navigator">
          <u>N</u>avigator
        </MenuItem>
        <div className="nav-menu-divider" />
        <MenuItem action="nav-menu-comm-word">
          Microsoft <u>W</u>ord
        </MenuItem>
        <MenuItem action="nav-menu-comm-vb6">
          Visual Basic <u>6</u>
        </MenuItem>
      </Dropdown>
      <Dropdown menuId="help">
        <MenuItem action="nav-menu-help-contents">
          Help <u>C</u>ontents
        </MenuItem>
        <MenuItem disabled>
          Release <u>N</u>otes
        </MenuItem>
        <div className="nav-menu-divider" />
        <MenuItem action="nav-menu-help-about">
          <u>A</u>bout Netscape...
        </MenuItem>
      </Dropdown>

      {/* Navigation toolbar */}
      <div className="nav-toolbar-row">
        <div className="nav-grippy" />
        <div className="nav-toolbar">
          <button className="nav-btn" title="Back" disabled={!canGoBack} onClick={handleBack}>
            <span className="nav-btn-icon">◀</span>
            <span className="nav-btn-label">Back</span>
          </button>
          <button
            className="nav-btn"
            title="Forward"
            disabled={!canGoForward}
            onClick={handleForward}
          >
            <span className="nav-btn-icon">▶</span>
            <span className="nav-btn-label">Forward</span>
          </button>
          <button className="nav-btn" title="Reload" onClick={() => navigate(urlBarValue, false)}>
            <span className="nav-btn-icon">↺</span>
            <span className="nav-btn-label">Reload</span>
          </button>
          <button className="nav-btn" title="Home" onClick={() => navigate('about:home')}>
            <span className="nav-btn-icon">🏠</span>
            <span className="nav-btn-label">Home</span>
          </button>
          <button
            className="nav-btn"
            title="Search"
            onClick={() => navigate('https://www.google.com')}
          >
            <span className="nav-btn-icon">🔍</span>
            <span className="nav-btn-label">Search</span>
          </button>
          <div className="nav-tb-sep" />
          <button
            className="nav-btn"
            title="Print"
            onClick={() => {
              try {
                iframeRef.current?.contentWindow?.print();
              } catch {
                window.print();
              }
            }}
          >
            <span className="nav-btn-icon">🖨️</span>
            <span className="nav-btn-label">Print</span>
          </button>
          <button className="nav-btn" title={securityTitle}>
            <span className="nav-btn-icon" title={securityTitle}>
              {securityIcon}
            </span>
            <span className="nav-btn-label">Security</span>
          </button>
          <div className="nav-tb-sep" />
          <button
            className={`nav-btn nav-btn-stop${isLoading ? ' loading' : ''}`}
            title="Stop"
            onClick={handleStop}
          >
            <span className="nav-btn-icon">✖</span>
            <span className="nav-btn-label">Stop</span>
          </button>
          <div
            className={`nav-throbber${isLoading ? ' loading' : ''}`}
            title="Netscape Navigator – click to go home"
            onClick={() => navigate('about:home')}
          >
            <svg
              className="nav-throbber-svg"
              viewBox="0 0 38 38"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g className="nav-throbber-comet">
                <line
                  x1="10"
                  y1="6"
                  x2="30"
                  y2="28"
                  stroke="#FFD700"
                  strokeWidth="3"
                  strokeLinecap="round"
                  opacity="0.9"
                />
                <circle cx="10" cy="6" r="3" fill="#ffffff" />
              </g>
              <g className="nav-throbber-star">
                <circle cx="30" cy="8" r="2" fill="#FFD700" />
                <line x1="30" y1="4" x2="30" y2="6" stroke="#FFD700" strokeWidth="1.5" />
                <line x1="30" y1="10" x2="30" y2="12" stroke="#FFD700" strokeWidth="1.5" />
                <line x1="26" y1="8" x2="28" y2="8" stroke="#FFD700" strokeWidth="1.5" />
                <line x1="32" y1="8" x2="34" y2="8" stroke="#FFD700" strokeWidth="1.5" />
              </g>
            </svg>
          </div>
        </div>
      </div>

      {/* Location toolbar */}
      <div className="nav-toolbar-row">
        <div className="nav-grippy" />
        <div className="nav-location-bar">
          <span className="nav-location-label">Location:</span>
          <input
            type="text"
            className="nav-url-input"
            value={urlBarValue}
            onChange={(e) => setUrlBarValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') navigate(urlBarValue);
            }}
            onFocus={(e) => e.currentTarget.select()}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            className="nav-bookmark-btn"
            title="Add bookmark"
            onClick={() =>
              alert(
                'Bookmarks are full!\n\nYour bookmark list is not yet implemented in Netscape Navigator 97.',
              )
            }
          >
            🔖
          </button>
        </div>
      </div>

      {/* Personal toolbar */}
      <div className="nav-toolbar-row">
        <div className="nav-grippy" />
        <div className="nav-personal-toolbar">
          <button className="nav-personal-btn" onClick={() => navigate('about:home')}>
            Home
          </button>
          <button
            className="nav-personal-btn"
            onClick={() => navigate('https://www.linkedin.com/in/zacharykarpinski/')}
          >
            LinkedIn
          </button>
          <button
            className="nav-personal-btn"
            onClick={() => navigate('https://github.com/zkarpinski')}
          >
            GitHub
          </button>
          <button
            className="nav-personal-btn"
            onClick={() => navigate('https://news.ycombinator.com')}
          >
            Hacker News
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="nav-content">
        <iframe
          id="nav-iframe"
          ref={iframeRef}
          srcDoc={srcdoc}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          title="Netscape Navigator content"
          onLoad={handleIframeLoad}
        />
      </div>

      {/* Status bar */}
      <div className="nav-status-bar">
        <span className="nav-security-icon" title={securityTitle}>
          {securityIcon}
        </span>
        <span className="nav-status-text">{statusText}</span>
        <div className="nav-progress-wrap">
          <div className="nav-progress-bar" style={{ width: progress + '%' }} />
        </div>
        <div className="nav-component-bar">
          <button className="nav-component-btn" title="Navigator">
            🧭
          </button>
          <button className="nav-component-btn" title="Messenger">
            ✉
          </button>
          <button className="nav-component-btn" title="Newsgroups">
            💬
          </button>
          <button className="nav-component-btn" title="Composer">
            ✏
          </button>
        </div>
      </div>
    </AppWindow>
  );
}
