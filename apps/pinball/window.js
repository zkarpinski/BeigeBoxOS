(function () {
  'use strict';

  var win = document.getElementById('pinball-app-window');
  if (!win) return;

  if (window.attachWindowChrome) {
    window.attachWindowChrome({
      windowEl: win,
      appId: 'pinball',
      taskbarId: 'taskbar-pinball',
      minimizedClass: 'minimized',
      onClose: function () {
        if (window.Windows97) window.Windows97.hideApp('pinball');
        if (window.closeSpaceCadet) window.closeSpaceCadet();
      }
    });
  }

  if (window.Windows97) {
    window.Windows97.registerApp({
      id: 'pinball',
      windowId: 'pinball-app-window',
      taskbarId: 'taskbar-pinball',
      startMenuId: 'start-pinball-game',
      openByDefault: false,
    });
  }

  // Custom focus handler: focus the body to catch keyboard events
  const taskbarBtn = document.getElementById('taskbar-pinball');
  const startMenuBtn = document.getElementById('start-pinball-game');

  function handleShow() {
      if (window.openSpaceCadet) {
          window.openSpaceCadet();
      }
      const body = document.querySelector('.pinball-app-body');
      if (body) {
          body.focus();
      }
  }

  if (taskbarBtn) {
      taskbarBtn.addEventListener('click', () => {
          setTimeout(handleShow, 0);
      });
  }
  if (startMenuBtn) {
      startMenuBtn.addEventListener('click', () => {
          setTimeout(handleShow, 0);
      });
  }
})();
