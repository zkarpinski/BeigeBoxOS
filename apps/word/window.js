/**
 * Word 97 - Window controls via shared chrome; registers with shell.
 */
(function () {
  'use strict';

  const { wordWindow } = window.Word97 || {};
  if (!wordWindow) return;

  function closeWord() {
    if (window.Windows97) {
      window.Windows97.hideApp('word');
    } else {
      wordWindow.style.display = 'none';
      const taskbarEl = document.getElementById('taskbar-word');
      if (taskbarEl) {
        taskbarEl.style.display = 'none';
        taskbarEl.classList.remove('active');
      }
    }
  }

  if (window.attachWindowChrome) {
    attachWindowChrome({
      windowEl: wordWindow,
      appId: 'word',
      taskbarId: 'taskbar-word',
      minimizedClass: 'minimized',
      maximizedClass: 'windowed',
      onClose: closeWord,
      getCanDrag: (el) => el.classList.contains('windowed'),
    });
  }

  const docCloseBtn = document.querySelector('.doc-close-btn');
  const menuExit = document.getElementById('menu-file-exit');
  const menuFile = document.getElementById('menu-file');
  if (docCloseBtn) docCloseBtn.addEventListener('click', closeWord);
  if (menuExit) {
    menuExit.addEventListener('click', () => {
      if (menuFile) menuFile.classList.add('hidden');
      closeWord();
    });
  }

  if (window.Windows97) {
    window.Windows97.registerApp({
      id: 'word',
      windowId: 'word-window',
      taskbarId: 'taskbar-word',
      startMenuId: 'start-menu-word',
      openByDefault: false,
    });
  }
})();
