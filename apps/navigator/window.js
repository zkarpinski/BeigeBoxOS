/**
 * Netscape Navigator 97 - Shell registration and window chrome.
 */
(function () {
  'use strict';

  const { navWindow } = window.Navigator97 || {};
  if (!navWindow) return;

  if (window.attachWindowChrome) {
    attachWindowChrome({
      windowEl: navWindow,
      appId: 'navigator',
      taskbarId: 'taskbar-navigator',
      minimizedClass: 'minimized',
      maximizedClass: 'maximized',
      allowResize: true,
      onClose: function () {
        if (window.Windows97) window.Windows97.hideApp('navigator');
      },
      getCanDrag: function (el) {
        return !el.classList.contains('maximized');
      },
    });
  }

  if (window.Windows97) {
    window.Windows97.registerApp({
      id: 'navigator',
      windowId: 'navigator-window',
      taskbarId: 'taskbar-navigator',
      startMenuId: 'start-navigator',
      openByDefault: true,
    });
  }
})();
