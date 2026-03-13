/**
 * Internet Explorer 5 - Shell registration and window chrome.
 */
(function () {
    'use strict';

    const { ie5Window } = window.IE597 || {};
    if (!ie5Window) return;

    if (window.attachWindowChrome) {
      attachWindowChrome({
        windowEl: ie5Window,
        appId: 'ie5',
        taskbarId: 'taskbar-ie5',
        minimizedClass: 'minimized',
        maximizedClass: 'maximized',
        allowResize: true,
        onClose: function () {
          if (window.Windows97) window.Windows97.hideApp('ie5');
        },
        getCanDrag: function (el) {
          return !el.classList.contains('maximized');
        },
      });
    }

    if (window.Windows97) {
      window.Windows97.registerApp({
        id: 'ie5',
        windowId: 'ie5-window',
        taskbarId: 'taskbar-ie5',
        startMenuId: 'start-menu-ie',
        openByDefault: false,
      });
    }

    /* Internet Explorer desktop icon — double-click logic */
    var icon = document.getElementById('ie5-desktop-icon');
    if (icon) {
        var clicks = 0, timer = null;

        icon.addEventListener('click', function (e) {
            e.stopPropagation();
            icon.classList.add('selected');
            clicks++;
            if (clicks === 1) {
                timer = setTimeout(function () { clicks = 0; }, 350);
            } else {
                clearTimeout(timer);
                clicks = 0;
                if (window.Windows97) window.Windows97.showApp('ie5');
            }
        });

        icon.addEventListener('touchend', function (e) {
            e.preventDefault();
            e.stopPropagation();
            icon.classList.add('selected');
            clearTimeout(clickTimer);
            clickCount = 0;
            if (window.Windows97) window.Windows97.showApp('ie5');
        });

        document.addEventListener('click', function (e) {
            if (!icon.contains(e.target)) icon.classList.remove('selected');
        });
    }
  })();