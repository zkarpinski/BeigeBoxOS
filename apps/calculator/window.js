/**
 * Calculator - Window Registration
 */
(function () {
    'use strict';

    const calculatorWindow = document.getElementById('calculator-window');
    if (!calculatorWindow) return;

    function closeCalculator() {
        if (window.Windows97) {
            window.Windows97.hideApp('calculator');
        } else {
            calculatorWindow.style.display = 'none';
            const taskbarEl = document.getElementById('taskbar-calculator');
            if (taskbarEl) {
                taskbarEl.style.display = 'none';
                taskbarEl.classList.remove('active');
            }
        }
    }

    if (window.attachWindowChrome) {
        attachWindowChrome({
            windowEl: calculatorWindow,
            appId: 'calculator',
            taskbarId: 'taskbar-calculator',
            minimizedClass: 'minimized',
            maximizedClass: 'maximized',
            onClose: closeCalculator,
            getCanDrag: (el) => !el.classList.contains('maximized'),
            allowResize: false
        });
    }

    if (window.Windows97) {
        window.Windows97.registerApp({
            id: 'calculator',
            windowId: 'calculator-window',
            taskbarId: 'taskbar-calculator',
            startMenuId: 'start-menu-calculator',
            openByDefault: false,
        });
    }

    // Desktop icon double-click
    var icon = document.getElementById('calculator-desktop-icon');
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
                if (window.Windows97) window.Windows97.showApp('calculator');
            }
        });

        icon.addEventListener('touchend', function (e) {
            e.preventDefault();
            e.stopPropagation();
            icon.classList.add('selected');
            clearTimeout(clickTimer);
            clickCount = 0;
            if (window.Windows97) window.Windows97.showApp('calculator');
        });

        document.addEventListener('click', function (e) {
            if (!icon.contains(e.target)) icon.classList.remove('selected');
        });
    }
})();
