/**
 * MS-DOS Prompt - Window Registration
 */
(function () {
    'use strict';

    const msdosWindow = document.getElementById('msdos-window');
    const msdosInput = document.getElementById('msdos-input-field');

    if (!msdosWindow) return;

    if (window.attachWindowChrome) {
        attachWindowChrome({
            windowEl: msdosWindow,
            appId: 'msdos',
            taskbarId: 'taskbar-msdos',
            minimizedClass: 'minimized',
            maximizedClass: 'maximized',
            onClose: function () {
                if (window.Windows97) window.Windows97.hideApp('msdos');
            },
            getCanDrag: function (el) {
                return !el.classList.contains('maximized');
            },
            allowResize: true
        });
    }

    if (window.Windows97) {
        window.Windows97.registerApp({
            id: 'msdos',
            windowId: 'msdos-window',
            taskbarId: 'taskbar-msdos',
            startMenuId: 'start-menu-msdos',
            openByDefault: false,
        });

        // Add to global namespace for shell to trigger onShow hook when app opens
        window.MSDOS98 = window.MSDOS98 || {};
        window.MSDOS98.onShow = function() {
            if (msdosInput) {
                msdosInput.focus();
            }
        };
    }

    // Desktop icon double-click
    var icon = document.getElementById('msdos-desktop-icon');
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
                if (window.Windows97) window.Windows97.showApp('msdos');
            }
        });

        icon.addEventListener('touchend', function (e) {
            e.preventDefault();
            e.stopPropagation();
            icon.classList.add('selected');
            clearTimeout(clickTimer);
            clickCount = 0;
            if (window.Windows97) window.Windows97.showApp('msdos');
        });

        document.addEventListener('click', function (e) {
            if (!icon.contains(e.target)) icon.classList.remove('selected');
        });
    }
})();