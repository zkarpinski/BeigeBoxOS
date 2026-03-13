(function () {
  'use strict';

  var win = document.getElementById('winamp-window');
  if (!win) return;

  if (window.attachWindowChrome) {
    window.attachWindowChrome({
      windowEl: win,
      appId: 'winamp',
      taskbarId: 'taskbar-winamp',
      minimizedClass: 'minimized',
      onClose: function () {
        if (window.Windows97) window.Windows97.hideApp('winamp');
      }
    });
  }

  if (window.Windows97) {
    window.Windows97.registerApp({
      id: 'winamp',
      windowId: 'winamp-window',
      taskbarId: 'taskbar-winamp',
      startMenuId: 'start-winamp',
      openByDefault: false,
    });
  }
})();
