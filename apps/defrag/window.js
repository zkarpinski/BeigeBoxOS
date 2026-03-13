/**
 * Defrag - Window Registration
 */
(function () {
    'use strict';

    const defragWindow = document.getElementById('defrag-window');
    if (!defragWindow) return;

    function closeDefrag() {
      if (window.Defrag98) {
          window.Defrag98.stop();
      }
      if (window.Windows97) {
        window.Windows97.hideApp('defrag');
      } else {
        defragWindow.style.display = 'none';
        const taskbarEl = document.getElementById('taskbar-defrag');
        if (taskbarEl) {
          taskbarEl.style.display = 'none';
          taskbarEl.classList.remove('active');
        }
      }
    }

    if (window.attachWindowChrome) {
      attachWindowChrome({
        windowEl: defragWindow,
        appId: 'defrag',
        taskbarId: 'taskbar-defrag',
        minimizedClass: 'minimized',
        maximizedClass: 'maximized',
        onClose: closeDefrag,
        getCanDrag: (el) => !el.classList.contains('maximized'),
        allowResize: false
      });
    }

    if (window.Windows97) {
      window.Windows97.registerApp({
        id: 'defrag',
        windowId: 'defrag-window',
        taskbarId: 'taskbar-defrag',
        startMenuId: 'start-menu-defrag',
        openByDefault: false,
      });
    }

    // Desktop icon double-click
    var icon = document.getElementById('defrag-desktop-icon');
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
          if (window.Windows97) {
              window.Windows97.showApp('defrag');
          }
        }
      });

      icon.addEventListener('touchend', function (e) {
        e.preventDefault();
        e.stopPropagation();
        icon.classList.add('selected');
        clearTimeout(clickTimer);
        clickCount = 0;
        if (window.Windows97) {
            window.Windows97.showApp('defrag');
        }
      });

      document.addEventListener('click', function (e) {
        if (!icon.contains(e.target)) icon.classList.remove('selected');
      });
    }
  })();