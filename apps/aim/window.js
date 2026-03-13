/**
 * AIM 97 – Shell registration and window chrome.
 */
(function () {
  'use strict';

  var ns = window.AIM97;
  if (!ns) return;

  ns.aimWindow  = document.getElementById('aim-window');
  ns.chatWindow = document.getElementById('aim-chat-window');

  // Buddy list registers with the shell (appears in taskbar + Start menu)
  if (ns.aimWindow && window.attachWindowChrome) {
    attachWindowChrome({
      windowEl: ns.aimWindow,
      appId: 'aim',
      taskbarId: 'taskbar-aim',
      minimizedClass: 'minimized',
      maximizedClass: 'maximized',
      allowResize: false,
      onClose: function () {
        if (window.Windows97) window.Windows97.hideApp('aim');
        // Also close chat if open
        if (ns.chatWindow) ns.chatWindow.style.display = 'none';
      },
    });
  }

  // Chat window gets chrome but no shell registration (internal window)
  if (ns.chatWindow && window.attachWindowChrome) {
    attachWindowChrome({
      windowEl: ns.chatWindow,
      minimizedClass: 'minimized',
      maximizedClass: 'maximized',
      allowResize: true,
      onClose: function () {
        ns.chatWindow.style.display = 'none';
        ns.chatOpen = false;
        ns.awayReplySent = false; // reset so re-open starts fresh
      },
    });
  }

  if (ns.aimWindow && window.Windows97) {
    window.Windows97.registerApp({
      id: 'aim',
      windowId: 'aim-window',
      taskbarId: 'taskbar-aim',
      startMenuId: 'start-aim',
      openByDefault: true,
    });
  }
})();
