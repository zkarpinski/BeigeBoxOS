/**
 * Netscape Navigator 97 - Toolbar navigation logic.
 * Handles URL navigation via CORS proxy, history, and UI state.
 */
(function () {
  'use strict';

  var ns = window.Navigator97;
  if (!ns) return;

  var navIframe = ns.navIframe;
  var navUrlInput = ns.navUrlInput;
  var navStatusText = ns.navStatusText;
  var navProgressBar = ns.navProgressBar;
  var navThrobber = ns.navThrobber;
  var navSecurityIcon = ns.navSecurityIcon;
  var navBtnBack = ns.navBtnBack;
  var navBtnForward = ns.navBtnForward;
  var navBtnStop = ns.navBtnStop;
  var navBtnStopEl = document.getElementById('nav-btn-stop');

  // Navigation history
  var history = [];
  var historyPos = -1;
  var isLoading = false;
  var abortController = null;

  // Proxy for stripping X-Frame-Options / CORS headers
  var PROXY = 'https://api.allorigins.win/raw?url=';

  /* ── UI helpers ── */

  function setStatus(text) {
    if (navStatusText) navStatusText.textContent = text;
  }

  function setProgress(pct) {
    if (navProgressBar) navProgressBar.style.width = pct + '%';
  }

  function setLoading(loading) {
    isLoading = loading;
    if (navThrobber) navThrobber.classList.toggle('loading', loading);
    if (navBtnStopEl) navBtnStopEl.classList.toggle('loading', loading);
    if (!loading) setProgress(0);
  }

  function updateNavButtons() {
    if (navBtnBack) navBtnBack.disabled = historyPos <= 0;
    if (navBtnForward) navBtnForward.disabled = historyPos >= history.length - 1;
  }

  function setSecure(isHttps) {
    var icon = isHttps ? '🔒' : '🔓';
    var label = isHttps ? 'Secure connection' : 'Insecure connection';
    // Toolbar button icon
    if (navSecurityIcon) {
      navSecurityIcon.textContent = icon;
      navSecurityIcon.title = label;
    }
    // Status bar icon
    var statusSecIcon = document.getElementById('nav-status-security-icon');
    if (statusSecIcon) {
      statusSecIcon.textContent = icon;
      statusSecIcon.title = label;
    }
  }

  /* ── Home page ── */

  function getHomePage() {
    var logoUrl = new URL('apps/navigator/netscape-logo.png', document.baseURI).href;
    var linkedinLogoUrl = new URL('assets/linkedin-logo.png', document.baseURI).href;
    var githubLogoUrl = new URL('assets/github-logo.png', document.baseURI).href;
    return [
      '<!DOCTYPE html><html><head>',
      '<meta charset="UTF-8">',
      '<title>Netscape Navigator Home</title>',
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
      '</style>',
      '</head><body>',
      '<div class="header">',
      '<img src="' + logoUrl + '" class="ns-logo" alt="Netscape">',
      '<div class="header-text">',
      '<h1>Netscape Navigator</h1>',
      '<p>Version 4.0 &nbsp;&bull;&nbsp; Welcome to the World Wide Web</p>',
      '</div>',
      '</div>',
      '<div class="content">',
      '<div class="welcome-box">',
      '<h2>Welcome to Zachary Karpinski\'s Home Page!</h2>',
      '<p>This is a functional replica of Windows 98 representing my memories, interests, portfolio and work experience.</p>',
      '<p>Type a web address in the Location bar above, or click one of the links below to begin exploring the World Wide Web. You are using Netscape Navigator, the world\'s most popular web browser.</p>',
      '<p>You can also explore various applications such as Word, Paint, Minesweeper, The Incredible Machine, Notepad, Winamp, Napster, AIM, Navigator, Tony Hawk\'s Pro Skater 2, and more.</p>',
      '<p>I hope you enjoy your visit!</p>',
      '</div>',
      '<div class="links-grid">',
      '<div class="link-card" data-url="https://www.linkedin.com/in/zacharykarpinski/"><img src="' + linkedinLogoUrl + '" alt="LinkedIn"><div class="link-card-text"><h3>LinkedIn</h3><p>View my LinkedIn profile</p></div></div>',
      '<div class="link-card" data-url="https://github.com/zkarpinski"><img src="' + githubLogoUrl + '" alt="GitHub"><div class="link-card-text"><h3>GitHub</h3><p>View my GitHub profile</p></div></div>',
      '</div>',
      '</div>',
      '<div class="footer">Netscape Communications Corporation &copy; 1997 &nbsp;|&nbsp; All Rights Reserved</div>',
      '</body></html>'
    ].join('');
  }

  function getErrorPage(url, reason) {
    var msg = reason || 'Netscape is unable to find the server or DNS error.';
    return [
      '<!DOCTYPE html><html><head><meta charset="UTF-8">',
      '<title>Netscape: Server not found</title>',
      '<style>',
      'body{font-family:Arial,sans-serif;margin:40px;background:#fff;color:#000;}',
      'h1{color:#cc0000;font-size:18px;}',
      'h2{font-size:14px;margin-top:20px;}',
      'ul{font-size:12px;line-height:1.8;}',
      '.url{font-family:monospace;background:#f0f0f0;padding:2px 6px;border:1px solid #ccc;}',
      '</style></head><body>',
      '<h1>Netscape is unable to find the server at <span class="url">' + url + '</span></h1>',
      '<p>' + msg + '</p>',
      '<h2>The page could not be displayed. Here are some suggestions:</h2>',
      '<ul>',
      '<li>Check the address for typing errors such as <b>ww.example.com</b> instead of <b>www.example.com</b></li>',
      '<li>If you are unable to load any pages, check your computer\'s network connection.</li>',
      '<li>If your computer or network is protected by a firewall or proxy, make sure that Netscape is permitted to access the Web.</li>',
      '</ul>',
      '</body></html>'
    ].join('');
  }

  /* ── Navigation ── */

  function normalizeUrl(raw) {
    var trimmed = raw.trim();
    if (!trimmed) return 'about:home';
    if (trimmed === 'about:home' || trimmed === 'about:blank') return trimmed;
    // Search query: has spaces or no dot
    if (trimmed.indexOf(' ') !== -1 || trimmed.indexOf('.') === -1) {
      return 'https://www.google.com/search?q=' + encodeURIComponent(trimmed);
    }
    if (trimmed.indexOf('://') === -1) {
      return 'https://' + trimmed;
    }
    return trimmed;
  }

  function pushHistory(url) {
    // Truncate forward history
    history.splice(historyPos + 1);
    history.push(url);
    historyPos = history.length - 1;
    updateNavButtons();
  }

  function navigate(rawUrl, addToHistory) {
    if (isLoading && abortController) abortController.abort();

    var url = normalizeUrl(rawUrl);

    if (url === 'about:home') {
      navIframe.srcdoc = getHomePage();
      if (navUrlInput) navUrlInput.value = 'about:home';
      setStatus('Document: Done');
      setSecure(false);
      if (addToHistory !== false) pushHistory('about:home');
      return;
    }
    if (url === 'about:blank') {
      navIframe.srcdoc = '';
      if (navUrlInput) navUrlInput.value = 'about:blank';
      setStatus('');
      if (addToHistory !== false) pushHistory('about:blank');
      return;
    }

    if (navUrlInput) navUrlInput.value = url;

    var isHttps = url.indexOf('https://') === 0;
    setSecure(isHttps);

    var hostname = url;
    try { hostname = new URL(url).hostname; } catch (e) {}

    setStatus('Contacting ' + hostname + '...');
    setLoading(true);
    setProgress(20);

    abortController = new AbortController();
    var signal = abortController.signal;

    var proxyUrl = PROXY + encodeURIComponent(url);

    fetch(proxyUrl, { signal: signal })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        setProgress(60);
        setStatus('Transferring data from ' + hostname + '...');
        return res.text();
      })
      .then(function (html) {
        // Inject <base> tag to resolve relative URLs against the original origin
        var baseTag = '<base href="' + url + '">';
        var modified = html;
        if (/(<head[^>]*>)/i.test(modified)) {
          modified = modified.replace(/(<head[^>]*>)/i, '$1' + baseTag);
        } else if (/<html/i.test(modified)) {
          modified = modified.replace(/(<html[^>]*>)/i, '$1<head>' + baseTag + '</head>');
        } else {
          modified = baseTag + modified;
        }
        // Suppress scripts that try to break out of the frame
        modified = modified.replace(/top\s*\.\s*location/g, 'window.location');
        modified = modified.replace(/parent\s*\.\s*location/g, 'window.location');

        navIframe.srcdoc = modified;
        setProgress(100);
        setStatus('Document: Done');
        setLoading(false);

        if (addToHistory !== false) pushHistory(url);
      })
      .catch(function (err) {
        if (err && err.name === 'AbortError') return;
        navIframe.srcdoc = getErrorPage(url, err.message);
        setStatus('Error: Unable to load page');
        setLoading(false);
        setProgress(0);
      });
  }

  /* ── Toolbar button handlers ── */

  document.getElementById('nav-btn-back')?.addEventListener('click', function () {
    if (historyPos > 0) {
      historyPos--;
      updateNavButtons();
      navigate(history[historyPos], false);
    }
  });

  document.getElementById('nav-btn-forward')?.addEventListener('click', function () {
    if (historyPos < history.length - 1) {
      historyPos++;
      updateNavButtons();
      navigate(history[historyPos], false);
    }
  });

  document.getElementById('nav-btn-reload')?.addEventListener('click', function () {
    var url = (navUrlInput && navUrlInput.value) || 'about:home';
    navigate(url, false);
  });

  document.getElementById('nav-btn-home')?.addEventListener('click', function () {
    navigate('about:home');
  });

  document.getElementById('nav-btn-search')?.addEventListener('click', function () {
    navigate('https://www.google.com');
  });

  document.getElementById('nav-btn-print')?.addEventListener('click', function () {
    try { navIframe.contentWindow.print(); } catch (e) { window.print(); }
  });

  document.getElementById('nav-btn-stop')?.addEventListener('click', function () {
    if (abortController) abortController.abort();
    setLoading(false);
    setStatus('Transfer interrupted');
  });

  /* ── URL bar ── */

  if (navUrlInput) {
    navUrlInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        navigate(navUrlInput.value);
      }
    });
    navUrlInput.addEventListener('focus', function () {
      navUrlInput.select();
    });
  }

  /* ── Throbber click = go home ── */
  if (navThrobber) {
    navThrobber.addEventListener('click', function () {
      navigate('about:home');
    });
  }

  /* ── Home page link cards (message from iframe) ── */
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'nav-navigate') {
      navigate(e.data.url);
    }
  });

  // Intercept clicks on home page link cards via iframe load
  if (navIframe) {
    navIframe.addEventListener('load', function () {
      try {
        var doc = navIframe.contentDocument;
        if (!doc) return;
        var cards = doc.querySelectorAll('[data-url]');
        cards.forEach(function (card) {
          card.addEventListener('click', function () {
            navigate(card.getAttribute('data-url'));
          });
        });
      } catch (e) {
        // Cross-origin – cannot access contentDocument (expected for real pages)
      }
    });
  }

  /* ── Personal toolbar quick links ── */
  document.getElementById('nav-personal-btn-home')?.addEventListener('click', function () {
    navigate('about:home');
  });
  document.getElementById('nav-personal-btn-linkedin')?.addEventListener('click', function () {
    navigate('https://www.linkedin.com/in/zacharykarpinski/');
  });
  document.getElementById('nav-personal-btn-github')?.addEventListener('click', function () {
    navigate('https://github.com/zkarpinski');
  });
  document.getElementById('nav-personal-btn-news')?.addEventListener('click', function () {
    navigate('https://news.ycombinator.com');
  });


  /* ── Bookmark button ── */
  document.getElementById('nav-bookmark-btn')?.addEventListener('click', function () {
    alert('Bookmarks are full!\n\nYour bookmark list is not yet implemented in Netscape Navigator 97.');
  });

  /* ── Expose navigate to menus.js ── */
  window.Navigator97.navigate = navigate;
  updateNavButtons();

  /* ── Load home page on init ── */
  navigate('about:home');
})();
