/**
 * Control Panel – Shell registration and window chrome.
 */
(function () {
  'use strict';

  var cp = window.ControlPanel97;
  if (!cp) return;

  cp.cpWindow = document.getElementById('controlpanel-window');

  if (window.attachWindowChrome && cp.cpWindow) {
    attachWindowChrome({
      windowEl: cp.cpWindow,
      appId: 'controlpanel',
      taskbarId: 'taskbar-controlpanel',
      minimizedClass: 'minimized',
      maximizedClass: 'maximized',
      allowResize: true,
      onClose: function () {
        if (window.Windows97) window.Windows97.hideApp('controlpanel');
      },
    });
  }

  if (window.Windows97 && cp.cpWindow) {
    window.Windows97.registerApp({
      id: 'controlpanel',
      windowId: 'controlpanel-window',
      taskbarId: 'taskbar-controlpanel',
      startMenuId: 'start-controlpanel',
      openByDefault: false,
    });
  }
})();
