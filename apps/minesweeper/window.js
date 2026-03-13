/**
 * Minesweeper - Window Registration
 */
(function () {
    'use strict';

    const minesweeperWindow = document.getElementById('minesweeper-window');
    if (!minesweeperWindow) return;

    function closeMinesweeper() {
      if (window.Windows97) {
        window.Windows97.hideApp('minesweeper');
      } else {
        minesweeperWindow.style.display = 'none';
        const taskbarEl = document.getElementById('taskbar-minesweeper');
        if (taskbarEl) {
          taskbarEl.style.display = 'none';
          taskbarEl.classList.remove('active');
        }
      }
    }

    if (window.attachWindowChrome) {
      attachWindowChrome({
        windowEl: minesweeperWindow,
        appId: 'minesweeper',
        taskbarId: 'taskbar-minesweeper',
        minimizedClass: 'minimized',
        onClose: closeMinesweeper,
        getCanDrag: () => true,
        allowResize: false
      });
    }

    if (window.Windows97) {
      window.Windows97.registerApp({
        id: 'minesweeper',
        windowId: 'minesweeper-window',
        taskbarId: 'taskbar-minesweeper',
        startMenuId: 'start-minesweeper',
        openByDefault: false,
      });
    }

    // Desktop icon double-click
    var icon = document.getElementById('minesweeper-desktop-icon');
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
          if (window.Windows97) window.Windows97.showApp('minesweeper');
          if (window.Minesweeper98 && window.Minesweeper98.init) {
              window.Minesweeper98.init();
          }
        }
      });

      icon.addEventListener('touchend', function (e) {
        e.preventDefault();
        e.stopPropagation();
        icon.classList.add('selected');
        clearTimeout(clickTimer);
        clickCount = 0;
        if (window.Windows97) window.Windows97.showApp('minesweeper');
      });

      document.addEventListener('click', function (e) {
        if (!icon.contains(e.target)) icon.classList.remove('selected');
      });
    }

    // Initialize initial size and board if needed when app is opened via Start menu
    const startItem = document.getElementById('start-minesweeper');
    if (startItem) {
        startItem.addEventListener('click', () => {
            if (window.Minesweeper98 && window.Minesweeper98.init) {
                window.Minesweeper98.init();
            }
        });
    }

  })();