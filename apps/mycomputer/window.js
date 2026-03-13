/**
 * My Computer — Shell registration and window chrome.
 */
(function () {
  'use strict';

  var mcWindow = document.getElementById('mycomputer-window');
  if (!mcWindow) return;

  if (window.attachWindowChrome) {
    attachWindowChrome({
      windowEl: mcWindow,
      appId: 'mycomputer',
      taskbarId: 'taskbar-mycomputer',
      minimizedClass: 'minimized',
      maximizedClass: 'maximized',
      allowResize: true,
      onClose: function () {
        if (window.Windows97) window.Windows97.hideApp('mycomputer');
      },
    });
  }

  if (window.Windows97) {
    window.Windows97.registerApp({
      id: 'mycomputer',
      windowId: 'mycomputer-window',
      taskbarId: 'taskbar-mycomputer',
      openByDefault: false,
    });
  }

  // Desktop icon double-click
  var icon = document.getElementById('mycomputer-desktop-icon');
  if (icon) {
    var clickCount = 0, clickTimer = null;
    icon.addEventListener('click', function (e) {
      e.stopPropagation();
      icon.classList.add('selected');
      clickCount++;
      if (clickCount === 1) {
        clickTimer = setTimeout(function () { clickCount = 0; }, 350);
      } else {
        clearTimeout(clickTimer);
        clickCount = 0;
        if (window.MyComputer97) window.MyComputer97.reset();
        if (window.Windows97) window.Windows97.showApp('mycomputer');
      }
    });
    icon.addEventListener('touchend', function (e) {
      e.preventDefault();
      e.stopPropagation();
      icon.classList.add('selected');
      clearTimeout(clickTimer);
      clickCount = 0;
      if (window.MyComputer97) window.MyComputer97.reset();
      if (window.Windows97) window.Windows97.showApp('mycomputer');
    });
    document.addEventListener('click', function (e) {
      if (!icon.contains(e.target)) icon.classList.remove('selected');
    });
  }
})();
