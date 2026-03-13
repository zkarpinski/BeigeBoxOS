/**
 * Win97 Blue Screen of Death – reusable BSOD overlay.
 *
 * Windows97.bsod([options])
 *
 * options:
 *   message      {string}   Custom error text (supports \n). Uses classic Win98 text by default.
 *   clearStorage {boolean}  Clear localStorage, sessionStorage, and cookies. Default: false.
 *   reload       {boolean}  Reload the page after dismissal. Default: false.
 *   onDismiss    {function} Callback fired just before reload/remove.
 *   autoMs       {number}   Auto-dismiss after N ms (default: null = wait for keypress/click).
 */
(function () {
  'use strict';

  var w = window.Windows97;
  if (!w) return;

  var DEFAULT_MESSAGE =
    'A fatal exception 0E has occurred at F000:E2C3 in VXD VMM(01) +\n' +
    '00010E36. The current application will be terminated.\n\n' +
    '*  Press any key to terminate the current application.\n' +
    '*  Press CTRL+ALT+DEL to restart your computer. You will\n' +
    '   lose any unsaved information in all applications.';

  function escHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function clearAll() {
    try { localStorage.clear(); } catch (e) {}
    try { sessionStorage.clear(); } catch (e) {}
    try {
      document.cookie.split(';').forEach(function (c) {
        var key = c.split('=')[0].trim();
        if (key) document.cookie = key + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
      });
    } catch (e) {}
  }

  function bsod(options) {
    options = options || {};
    var message      = options.message      || DEFAULT_MESSAGE;
    var doClean      = !!options.clearStorage;
    var doReload     = !!options.reload;
    var onDismiss    = options.onDismiss    || null;
    var autoMs       = options.autoMs       || null;

    var el = document.createElement('div');
    el.className = 'w97-bsod';
    el.innerHTML =
      '<div class="w97-bsod-inner">' +
        '<div class="w97-bsod-header">Windows</div>' +
        '<p class="w97-bsod-msg">' + escHtml(message).replace(/\n/g, '<br>') + '</p>' +
        '<p class="w97-bsod-prompt">Press any key to continue ' +
          '<span class="w97-bsod-cursor">_</span>' +
        '</p>' +
      '</div>';

    document.body.appendChild(el);

    var dismissed = false;
    function dismiss() {
      if (dismissed) return;
      dismissed = true;
      if (doClean) clearAll();
      if (typeof onDismiss === 'function') onDismiss();
      if (doReload) {
        location.reload();
      } else {
        el.remove();
      }
    }

    function keyHandler() {
      document.removeEventListener('keydown', keyHandler);
      dismiss();
    }
    document.addEventListener('keydown', keyHandler);
    el.addEventListener('click', function () {
      document.removeEventListener('keydown', keyHandler);
      dismiss();
    });

    if (autoMs) setTimeout(dismiss, autoMs);

    return { dismiss: dismiss };
  }

  w.bsod = bsod;

})();
