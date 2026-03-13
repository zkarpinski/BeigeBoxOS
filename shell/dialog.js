/**
 * Win97Dialog – reusable Windows 98-style modal dialog system.
 * Exposes Windows97.alert(), Windows97.confirm(), Windows97.dialog().
 *
 * Windows97.alert(title, message [, type])  → Promise<void>
 * Windows97.confirm(title, message [, type]) → Promise<boolean>
 * Windows97.dialog({ type, title, message, buttons }) → Promise<string>  (resolves with button label)
 *
 * types: 'info' | 'warning' | 'question' | 'error'
 */
(function () {
  'use strict';

  var w = window.Windows97;
  if (!w) return;

  // ── Icons ─────────────────────────────────────────────────────────────────

  var ICONS = {
    warning: '<svg viewBox="0 0 32 32" width="32" height="32" xmlns="http://www.w3.org/2000/svg">' +
      '<polygon points="16,3 31,29 1,29" fill="#ffcc00" stroke="#000" stroke-width="1.5" stroke-linejoin="round"/>' +
      '<text x="16" y="27" text-anchor="middle" font-size="17" font-weight="900" font-family="Arial,sans-serif" fill="#000">!</text>' +
      '</svg>',
    question: '<svg viewBox="0 0 32 32" width="32" height="32" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="16" cy="16" r="14" fill="#ffcc00" stroke="#000" stroke-width="1.5"/>' +
      '<text x="16" y="23" text-anchor="middle" font-size="19" font-weight="900" font-family="Arial,sans-serif" fill="#000">?</text>' +
      '</svg>',
    info: '<svg viewBox="0 0 32 32" width="32" height="32" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="16" cy="16" r="14" fill="#0055cc" stroke="#000" stroke-width="1.5"/>' +
      '<text x="16" y="13" text-anchor="middle" font-size="13" font-weight="900" font-family="Arial,sans-serif" fill="#fff">i</text>' +
      '<rect x="13" y="16" width="6" height="10" rx="1" fill="#fff"/>' +
      '</svg>',
    error: '<svg viewBox="0 0 32 32" width="32" height="32" xmlns="http://www.w3.org/2000/svg">' +
      '<circle cx="16" cy="16" r="14" fill="#cc0000" stroke="#000" stroke-width="1.5"/>' +
      '<line x1="10" y1="10" x2="22" y2="22" stroke="#fff" stroke-width="3" stroke-linecap="round"/>' +
      '<line x1="22" y1="10" x2="10" y2="22" stroke="#fff" stroke-width="3" stroke-linecap="round"/>' +
      '</svg>',
  };

  // ── Core dialog builder ───────────────────────────────────────────────────

  function showDialog(options) {
    var type    = options.type    || 'info';
    var title   = options.title   || 'Windows';
    var message = options.message || '';
    var buttons = options.buttons || ['OK'];

    return new Promise(function (resolve) {

      // Overlay (blocks pointer events behind the dialog)
      var overlay = document.createElement('div');
      overlay.className = 'w97dlg-overlay';

      // Dialog window
      var dlg = document.createElement('div');
      dlg.className = 'w97dlg';

      // ── Title bar ────────────────────────────────────────────────────────
      var titleBar = document.createElement('div');
      titleBar.className = 'w97dlg-titlebar';

      var titleText = document.createElement('span');
      titleText.className = 'w97dlg-title';
      titleText.textContent = title;

      var titleBtns = document.createElement('div');
      titleBtns.className = 'w97dlg-titlebtns';

      if (type === 'question') {
        var helpBtn = document.createElement('button');
        helpBtn.className = 'w97dlg-titlebtn';
        helpBtn.textContent = '?';
        helpBtn.setAttribute('aria-label', 'Help');
        titleBtns.appendChild(helpBtn);
      }

      var closeBtn = document.createElement('button');
      closeBtn.className = 'w97dlg-titlebtn';
      closeBtn.innerHTML = '&#x2715;';
      closeBtn.setAttribute('aria-label', 'Close');
      titleBtns.appendChild(closeBtn);

      titleBar.appendChild(titleText);
      titleBar.appendChild(titleBtns);

      // ── Body (icon + message) ─────────────────────────────────────────────
      var body = document.createElement('div');
      body.className = 'w97dlg-body';

      var iconEl = document.createElement('div');
      iconEl.className = 'w97dlg-icon';
      iconEl.innerHTML = ICONS[type] || ICONS.info;

      var msgEl = document.createElement('div');
      msgEl.className = 'w97dlg-message';
      // Replace \n with <br> for multiline
      msgEl.innerHTML = message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');

      body.appendChild(iconEl);
      body.appendChild(msgEl);

      // ── Button row ────────────────────────────────────────────────────────
      var btnRow = document.createElement('div');
      btnRow.className = 'w97dlg-btnrow';

      var firstBtn = null;
      buttons.forEach(function (label, i) {
        var btn = document.createElement('button');
        btn.className = 'w97dlg-btn' + (i === 0 ? ' w97dlg-btn-default' : '');
        btn.textContent = label;
        btn.addEventListener('click', function () { close(label); });
        btnRow.appendChild(btn);
        if (i === 0) firstBtn = btn;
      });

      // ── Assemble ──────────────────────────────────────────────────────────
      dlg.appendChild(titleBar);
      dlg.appendChild(body);
      dlg.appendChild(btnRow);
      overlay.appendChild(dlg);
      document.body.appendChild(overlay);

      // Focus default button
      if (firstBtn) setTimeout(function () { firstBtn.focus(); }, 0);

      // ── Close helpers ─────────────────────────────────────────────────────
      function close(result) {
        overlay.remove();
        resolve(result);
      }

      // X button resolves with last button (Cancel / No / OK)
      closeBtn.addEventListener('click', function () {
        close(buttons[buttons.length - 1]);
      });

      // Enter on a focused button
      dlg.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          var focused = document.activeElement;
          if (focused && focused.classList.contains('w97dlg-btn')) {
            focused.click();
          } else if (firstBtn) {
            firstBtn.click();
          }
          e.preventDefault();
        }
        if (e.key === 'Escape') {
          close(buttons[buttons.length - 1]);
        }
      });

      // ── Drag ─────────────────────────────────────────────────────────────
      var dragging = false, dragDx = 0, dragDy = 0;

      titleBar.addEventListener('mousedown', function (e) {
        if (e.target === closeBtn || e.target === helpBtn) return;
        dragging = true;
        var rect = dlg.getBoundingClientRect();
        dragDx = e.clientX - rect.left;
        dragDy = e.clientY - rect.top;
        // Switch from CSS centering to explicit position
        dlg.style.position = 'fixed';
        dlg.style.top  = rect.top  + 'px';
        dlg.style.left = rect.left + 'px';
        dlg.style.transform = 'none';
        dlg.style.margin = '0';
        e.preventDefault();
      });

      function onMouseMove(e) {
        if (!dragging) return;
        dlg.style.left = (e.clientX - dragDx) + 'px';
        dlg.style.top  = (e.clientY - dragDy) + 'px';
      }
      function onMouseUp() { dragging = false; }

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);

      // Clean up drag listeners when dialog closes
      var origClose = close;
      close = function (result) {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        origClose(result);
      };
      // Re-wire button listeners with the updated close
      btnRow.querySelectorAll('.w97dlg-btn').forEach(function (btn, i) {
        btn.onclick = function () { close(buttons[i]); };
      });
      closeBtn.onclick = function () { close(buttons[buttons.length - 1]); };
    });
  }

  // ── Public API ────────────────────────────────────────────────────────────

  w.alert = function (title, message, type) {
    return showDialog({ type: type || 'info', title: title, message: message, buttons: ['OK'] });
  };

  w.confirm = function (title, message, type) {
    return showDialog({ type: type || 'question', title: title, message: message, buttons: ['OK', 'Cancel'] })
      .then(function (btn) { return btn === 'OK'; });
  };

  w.dialog = showDialog;

  // ── Fatal Error dialog ────────────────────────────────────────────────────
  //
  // Windows97.fatalError({
  //   program      {string}   Window title / program name
  //   details      {string}   Register dump text shown in the scrollable pane
  //   clearStorage {boolean}  Clear localStorage/sessionStorage/cookies on Close
  //   reload       {boolean}  Reload page after Close
  //   onClose      {function} Callback fired just before reload/remove
  // })

  w.fatalError = function (options) {
    options = options || {};
    var program      = options.program      || 'Application';
    var detailsText  = options.details      || (program.toUpperCase().replace(/\s/g, '') + ' caused an invalid page fault\nin module UNKNOWN.DLL at 0177:00401a3f.\n\nRegisters:\nEAX=00000000 CS=0177 EIP=00401a3f EFLGS=00010202\nEBX=00000000 SS=017f ESP=009ef800 EBP=00000000\nECX=00000000 DS=017f ESI=00000000 FS=3eaf\nEDX=00000000 ES=017f EDI=00000000 GS=0000\n\nBytes at CS:EIP:\nf0 a0 ac 00 f0 ce ad 00 f0 00 00 c5 09 28 00 08');
    var doClean      = !!options.clearStorage;
    var doReload     = !!options.reload;
    var onCloseCb    = options.onClose || null;

    // ── Overlay ───────────────────────────────────────────────────────────
    var overlay = document.createElement('div');
    overlay.className = 'w97dlg-overlay';

    // ── Dialog shell ──────────────────────────────────────────────────────
    var dlg = document.createElement('div');
    dlg.className = 'w97dlg w97fe-dlg';

    // ── Title bar ─────────────────────────────────────────────────────────
    var titleBar = document.createElement('div');
    titleBar.className = 'w97dlg-titlebar';
    titleBar.innerHTML =
      '<span class="w97dlg-title">' + escHtml(program) + '</span>' +
      '<div class="w97dlg-titlebtns">' +
        '<button class="w97dlg-titlebtn w97fe-xbtn" aria-label="Close">&#x2715;</button>' +
      '</div>';

    // ── Upper body (icon + message + buttons) ─────────────────────────────
    var upper = document.createElement('div');
    upper.className = 'w97fe-upper';

    var iconEl = document.createElement('div');
    iconEl.className = 'w97dlg-icon';
    iconEl.innerHTML = ICONS.error;

    var msgEl = document.createElement('div');
    msgEl.className = 'w97fe-msg';
    msgEl.innerHTML =
      '<p class="w97fe-line1">This program has performed an illegal operation and will be shut down.</p>' +
      '<p class="w97fe-line2">If the problem persists, contact the program vendor.</p>';

    var btnCol = document.createElement('div');
    btnCol.className = 'w97fe-btncol';

    var closeBtn = document.createElement('button');
    closeBtn.className = 'w97dlg-btn w97dlg-btn-default';
    closeBtn.textContent = 'Close';

    var detailsBtn = document.createElement('button');
    detailsBtn.className = 'w97dlg-btn';
    detailsBtn.textContent = 'Details \u00bb';

    btnCol.appendChild(closeBtn);
    btnCol.appendChild(detailsBtn);

    upper.appendChild(iconEl);
    upper.appendChild(msgEl);
    upper.appendChild(btnCol);

    // ── Details pane ──────────────────────────────────────────────────────
    var detailsPane = document.createElement('div');
    detailsPane.className = 'w97fe-details';
    detailsPane.hidden = true;

    var detailsArea = document.createElement('textarea');
    detailsArea.className = 'w97fe-textarea';
    detailsArea.readOnly = true;
    detailsArea.value = detailsText;
    detailsPane.appendChild(detailsArea);

    // ── Assemble ──────────────────────────────────────────────────────────
    dlg.appendChild(titleBar);
    dlg.appendChild(upper);
    dlg.appendChild(detailsPane);
    overlay.appendChild(dlg);
    document.body.appendChild(overlay);

    setTimeout(function () { closeBtn.focus(); }, 0);

    // ── Details toggle ────────────────────────────────────────────────────
    var detailsOpen = false;
    detailsBtn.addEventListener('click', function () {
      detailsOpen = !detailsOpen;
      detailsPane.hidden = !detailsOpen;
      detailsBtn.textContent = detailsOpen ? 'Details \u00ab' : 'Details \u00bb';
    });

    // ── Close ─────────────────────────────────────────────────────────────
    function dismiss() {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      if (doClean) {
        try { localStorage.clear(); } catch (e) {}
        try { sessionStorage.clear(); } catch (e) {}
        try {
          document.cookie.split(';').forEach(function (c) {
            var key = c.split('=')[0].trim();
            if (key) document.cookie = key + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
          });
        } catch (e) {}
      }
      if (typeof onCloseCb === 'function') onCloseCb();
      overlay.remove();
      if (doReload) location.reload();
    }

    closeBtn.addEventListener('click', dismiss);
    titleBar.querySelector('.w97fe-xbtn').addEventListener('click', dismiss);
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === 'Escape') { dismiss(); e.preventDefault(); }
    });

    // ── Drag ──────────────────────────────────────────────────────────────
    var dragging = false, dragDx = 0, dragDy = 0;
    titleBar.addEventListener('mousedown', function (e) {
      if (e.target.classList.contains('w97dlg-titlebtn')) return;
      dragging = true;
      var r = dlg.getBoundingClientRect();
      dragDx = e.clientX - r.left;
      dragDy = e.clientY - r.top;
      dlg.style.position  = 'fixed';
      dlg.style.top       = r.top  + 'px';
      dlg.style.left      = r.left + 'px';
      dlg.style.transform = 'none';
      dlg.style.margin    = '0';
      e.preventDefault();
    });
    function onMouseMove(e) { if (dragging) { dlg.style.left = (e.clientX - dragDx) + 'px'; dlg.style.top = (e.clientY - dragDy) + 'px'; } }
    function onMouseUp()    { dragging = false; }
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup',   onMouseUp);
  };

  function escHtml(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

})();
