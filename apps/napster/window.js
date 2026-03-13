/**
 * Napster v2.0 BETA – Shell registration and window chrome.
 */
(function () {
  'use strict';

  var ns = window.Napster97;
  if (!ns) return;

  var win = document.getElementById('napster-window');
  if (!win) return;

  if (window.attachWindowChrome) {
    attachWindowChrome({
      windowEl: win,
      appId: 'napster',
      taskbarId: 'taskbar-napster',
      minimizedClass: 'minimized',
      maximizedClass: 'maximized',
      allowResize: true,
      onClose: function () {
        if (window.Windows97) window.Windows97.hideApp('napster');
      },
      getCanDrag: function (el) {
        return !el.classList.contains('maximized');
      },
    });
  }

  if (window.Windows97) {
    window.Windows97.registerApp({
      id: 'napster',
      windowId: 'napster-window',
      taskbarId: 'taskbar-napster',
      startMenuId: 'start-napster',
      openByDefault: true,
    });
  }
})();
