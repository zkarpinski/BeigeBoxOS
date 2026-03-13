/**
 * MS Paint 98 - Window Registration
 */
(function() {
    'use strict';

    const paintWindow = document.getElementById('paint-window');
    if (!paintWindow) return;

    function closePaint() {
        if (window.Windows97) {
            window.Windows97.hideApp('paint');
        } else {
            paintWindow.style.display = 'none';
            const taskbarEl = document.getElementById('taskbar-paint');
            if (taskbarEl) {
                taskbarEl.style.display = 'none';
                taskbarEl.classList.remove('active');
            }
        }
    }

    if (window.attachWindowChrome) {
        attachWindowChrome({
            windowEl: paintWindow,
            appId: 'paint',
            taskbarId: 'taskbar-paint',
            minimizedClass: 'minimized',
            maximizedClass: 'maximized',
            onClose: closePaint,
            getCanDrag: (el) => !el.classList.contains('maximized'),
            allowResize: true
        });
    }

    if (window.Windows97) {
        window.Windows97.registerApp({
            id: 'paint',
            windowId: 'paint-window',
            taskbarId: 'taskbar-paint',
            startMenuId: 'start-menu-paint',
            openByDefault: false,
            onOpen: function() {
                if (window.Paint98 && window.Paint98.historyStep === -1) {
                    window.Paint98.init();
                }
            }
        });
    }

    // Desktop icon double-click
    var icon = document.getElementById('paint-desktop-icon');
    if (icon) {
        var clickCount = 0;
        var clickTimer = null;

        icon.addEventListener('click', function(e) {
            e.stopPropagation();
            icon.classList.add('selected');
            clickCount++;
            if (clickCount === 1) {
                clickTimer = setTimeout(function() { clickCount = 0; }, 350);
            } else {
                clearTimeout(clickTimer);
                clickCount = 0;
                if (window.Windows97) window.Windows97.showApp('paint');
            }
        });

        icon.addEventListener('touchend', function(e) {
            e.preventDefault();
            e.stopPropagation();
            icon.classList.add('selected');
            clearTimeout(clickTimer);
            clickCount = 0;
            if (window.Windows97) window.Windows97.showApp('paint');
        });

        document.addEventListener('click', function(e) {
            if (!icon.contains(e.target)) icon.classList.remove('selected');
        });
    }
})();
