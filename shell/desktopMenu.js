(function () {
    'use strict';
    var menu = document.getElementById('desktop-context-menu');
    if (!menu) return;

    function showMenu(x, y) {
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        menu.classList.remove('hidden');
        var r = menu.getBoundingClientRect();
        if (r.right > window.innerWidth)  menu.style.left = (x - r.width) + 'px';
        if (r.bottom > window.innerHeight) menu.style.top = (y - r.height) + 'px';
    }

    function hideMenu() { menu.classList.add('hidden'); }

    document.addEventListener('contextmenu', function (e) {
        var target = e.target;
        if (target.closest('#taskbar') || target.closest('.app-window') ||
            target.closest('#start-menu') || target.closest('#boot-screen') ||
            target.closest('#shutdown-overlay') || target.closest('#desktop-context-menu')) return;
        e.preventDefault();
        showMenu(e.clientX, e.clientY);
    });

    document.addEventListener('click', function (e) {
        if (!menu.contains(e.target)) hideMenu();
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') hideMenu();
    });

    // Arrange Icons by Name
    var arrangeNameEl = document.getElementById('ctx-arrange-name');
    if (arrangeNameEl) {
        arrangeNameEl.addEventListener('click', function () {
            var container = document.getElementById('desktop-icons');
            if (!container) { hideMenu(); return; }
            var icons = Array.from(container.children);
            icons.sort(function (a, b) {
                var aText = (a.querySelector('.icon-label, span') || {}).textContent || '';
                var bText = (b.querySelector('.icon-label, span') || {}).textContent || '';
                return aText.localeCompare(bText);
            });
            icons.forEach(function (el) { container.appendChild(el); });
            hideMenu();
        });
    }

    var refreshEl = document.getElementById('ctx-refresh');
    if (refreshEl) {
        refreshEl.addEventListener('click', function () { hideMenu(); });
    }

    ['ctx-new-folder', 'ctx-new-shortcut', 'ctx-new-text'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.addEventListener('click', function () { hideMenu(); });
    });

    var propsEl = document.getElementById('ctx-properties');
    if (propsEl) {
        propsEl.addEventListener('click', function () {
            hideMenu();
            if (window.ControlPanel97 && window.ControlPanel97.openDisplayDialog) {
                window.ControlPanel97.openDisplayDialog();
            }
        });
    }
})();
