/**
 * Notepad - Window Registration
 */
(function () {
  'use strict';

  const notepadWindow = document.getElementById('notepad-window');
  if (!notepadWindow) return;

  function closeNotepad() {
    if (window.Notepad98 && window.Notepad98.hasUnsavedChanges) {
      if (confirm(`The text in the ${window.Notepad98.currentFile} file has changed.\n\nDo you want to save the changes?`)) {
        if (typeof window.Notepad98.saveFile === 'function') {
          window.Notepad98.saveFile();
        }
      }
    }
    if (window.Windows97) {
      window.Windows97.hideApp('notepad');
    } else {
      notepadWindow.style.display = 'none';
      const taskbarEl = document.getElementById('taskbar-notepad');
      if (taskbarEl) {
        taskbarEl.style.display = 'none';
        taskbarEl.classList.remove('active');
      }
    }
  }

  if (window.attachWindowChrome) {
    attachWindowChrome({
      windowEl: notepadWindow,
      appId: 'notepad',
      taskbarId: 'taskbar-notepad',
      minimizedClass: 'minimized',
      maximizedClass: 'maximized',
      onClose: closeNotepad,
      getCanDrag: (el) => !el.classList.contains('maximized'),
      allowResize: true
    });
  }

  if (window.Windows97) {
    window.Windows97.registerApp({
      id: 'notepad',
      windowId: 'notepad-window',
      taskbarId: 'taskbar-notepad',
      startMenuId: 'start-menu-notepad',
      openByDefault: false,
    });
  }

  // Desktop icon double-click
  var icon = document.getElementById('notepad-desktop-icon');
  if (icon) {
    var clickCount = 0;
    var clickTimer = null;

    icon.addEventListener('click', function (e) {
      e.stopPropagation();
      icon.classList.add('selected');
      clickCount++;
      if (clickCount === 1) {
        clickTimer = setTimeout(function () { clickCount = 0; }, 350);
      } else {
        clearTimeout(clickTimer);
        clickCount = 0;
        if (window.Windows97) window.Windows97.showApp('notepad');
      }
    });

    icon.addEventListener('touchend', function (e) {
      e.preventDefault();
      e.stopPropagation();
      icon.classList.add('selected');
      clearTimeout(clickTimer);
      clickCount = 0;
      if (window.Windows97) window.Windows97.showApp('notepad');
    });

    document.addEventListener('click', function (e) {
      if (!icon.contains(e.target)) icon.classList.remove('selected');
    });
  }
})();
