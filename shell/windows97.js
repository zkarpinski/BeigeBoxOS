/**
 * Windows 97 - Shell: app window management, taskbar, Start menu.
 * Apps register here; shell handles show/hide/focus and taskbar/Start menu.
 */
(function () {
  'use strict';

  const Z_INDEX_BASE = 10;
  const Z_INDEX_FOCUSED = 11;

  const apps = {};
  let activeAppId = null;

  function registerApp(config) {
    const {
      id,
      windowId,
      taskbarId,
      startMenuId,
      openByDefault = false,
    } = config;
    const windowEl = document.getElementById(windowId);
    const taskbarEl = document.getElementById(taskbarId);
    if (!windowEl || !taskbarEl) return;

    const app = {
      id,
      windowEl,
      taskbarEl,
      startMenuId,
      openByDefault,
    };
    apps[id] = app;

    if (!openByDefault) {
      windowEl.classList.add('app-window-hidden');
      taskbarEl.classList.add('app-taskbar-hidden');
    } else {
      activeAppId = id;
      windowEl.classList.remove('app-window-hidden');
      windowEl.style.zIndex = Z_INDEX_FOCUSED;
      windowEl.style.display = 'flex';
      taskbarEl.classList.remove('app-taskbar-hidden');
      taskbarEl.classList.add('active');
    }

    taskbarEl.addEventListener('click', () => {
      if (windowEl.classList.contains('app-window-hidden')) {
        showApp(id);
      } else {
        if (windowEl.classList.contains('minimized')) {
          windowEl.classList.remove('minimized');
          windowEl.style.display = '';
        }
        focusApp(id);
      }
    });

    return app;
  }

  function showApp(id) {
    const app = apps[id];
    if (!app) return;
    const { windowEl, taskbarEl } = app;
    windowEl.classList.remove('app-window-hidden');
    windowEl.classList.remove('minimized');
    if (id === 'vb6') {
      windowEl.classList.remove('vb6-hidden');
      taskbarEl.classList.remove('vb6-hidden');
    }
    windowEl.style.display = 'flex';
    taskbarEl.classList.remove('app-taskbar-hidden');
    focusApp(id);
    let ns = null;
    if (id === 'word') ns = window.Word97;
    else if (id === 'vb6') ns = window.VB6;
    else if (id === 'defrag') ns = window.Defrag98;
    else if (id === 'msdos') ns = window.MSDOS98;
    else if (id === 'ie5') ns = window.IE597;

    if (ns && typeof ns.onShow === 'function') ns.onShow();
  }

  function hideApp(id) {
    const app = apps[id];
    if (!app) return;
    const { windowEl, taskbarEl } = app;
    windowEl.classList.add('app-window-hidden');
    windowEl.style.display = 'none';
    taskbarEl.classList.add('app-taskbar-hidden');
    taskbarEl.classList.remove('active');
    if (id === 'vb6') {
      windowEl.classList.add('vb6-hidden');
      taskbarEl.classList.add('vb6-hidden');
    }
    if (activeAppId === id) {
      activeAppId = null;
      const any = Object.keys(apps).find(
        (k) => !apps[k].windowEl.classList.contains('app-window-hidden')
      );
      if (any) focusApp(any);
    }
  }

  function focusApp(id) {
    const app = apps[id];
    if (!app) return;
    const { windowEl, taskbarEl } = app;
    if (windowEl.classList.contains('app-window-hidden')) return;
    activeAppId = id;
    Object.values(apps).forEach((a) => {
      a.windowEl.style.zIndex = Z_INDEX_BASE;
      a.taskbarEl.classList.remove('active');
    });
    windowEl.style.zIndex = Z_INDEX_FOCUSED;
    taskbarEl.classList.add('active');
  }

  function isAppVisible(id) {
    const app = apps[id];
    return app && !app.windowEl.classList.contains('app-window-hidden');
  }

  function handleStartMenuItem(clickedId) {
    const app = Object.values(apps).find((a) => a.startMenuId === clickedId);
    if (app) {
      if (isAppVisible(app.id)) {
        focusApp(app.id);
      } else {
        showApp(app.id);
      }
      return true;
    }
    return false;
  }

  window.Windows97 = {
    apps,
    registerApp,
    showApp,
    hideApp,
    focusApp,
    isAppVisible,
    handleStartMenuItem,
    get activeAppId() {
      return activeAppId;
    },
  };
})();
