/**
 * Reusable window chrome: title-bar min/max/close, focus, drag (move), and resize.
 * Use data-win-min, data-win-max, data-win-close on buttons inside the window.
 * Use .title-bar for drag handle; window must have position fixed/absolute and size for drag/resize.
 *
 * @param {Object} options
 * @param {HTMLElement} options.windowEl - The app window element (e.g. #word-window, #vb6-window)
 * @param {string} [options.appId] - App id for shell (e.g. 'word', 'vb6')
 * @param {string} [options.taskbarId] - Taskbar button id (e.g. 'taskbar-word')
 * @param {string} [options.minimizedClass='minimized'] - Class to add when minimized
 * @param {string} [options.maximizedClass] - Class to toggle for maximize (e.g. 'windowed' for Word, 'maximized' for VB6)
 * @param {function} [options.onClose] - Called when close is clicked (if not set, uses Windows97.hideApp(appId))
 * @param {function} [options.getCanDrag] - (windowEl) => boolean. If false, title-bar drag is disabled. Default: () => true
 * @param {boolean} [options.allowResize=false] - If true, appends a bottom-right resize grip
 */
function attachWindowChrome(options) {
  const {
    windowEl,
    appId,
    taskbarId,
    minimizedClass = 'minimized',
    maximizedClass = 'windowed',
    onClose,
    getCanDrag = () => true,
    allowResize = false,
  } = options;

  if (!windowEl) return;

  const btnMin = windowEl.querySelector('[data-win-min]');
  const btnMax = windowEl.querySelector('[data-win-max]');
  const btnClose = windowEl.querySelector('[data-win-close]');
  const titleBar = windowEl.querySelector('.title-bar');
  const taskbarEl = taskbarId ? document.getElementById(taskbarId) : null;

  if (btnMin) {
    btnMin.addEventListener('click', () => {
      if (windowEl.classList.contains('win-minimizing')) return;
      windowEl.classList.add('win-minimizing');
      if (taskbarEl) taskbarEl.classList.remove('active');

      let done = false;
      const onEnd = () => {
        if (done) return;
        done = true;
        windowEl.removeEventListener('transitionend', onEnd);
        windowEl.classList.remove('win-minimizing');
        windowEl.classList.add(minimizedClass);
        windowEl.style.display = 'none';
      };
      windowEl.addEventListener('transitionend', onEnd);
      setTimeout(onEnd, 320);
    });
  }

  if (btnMax && maximizedClass) {
    btnMax.addEventListener('click', () => {
      windowEl.classList.toggle(maximizedClass);
    });
  }

  if (btnClose) {
    btnClose.addEventListener('click', () => {
      if (typeof onClose === 'function') {
        onClose();
      } else if (window.Windows97 && appId) {
        window.Windows97.hideApp(appId);
      }
    });
  }

  windowEl.addEventListener('mousedown', () => {
    if (window.Windows97 && appId) {
      window.Windows97.focusApp(appId);
    }
  });

  /* Bottom-right resize grip */
  if (allowResize) {
    const grip = document.createElement('div');
    grip.className = 'win-resize-grip';
    windowEl.appendChild(grip);

    grip.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      if (windowEl.classList.contains(maximizedClass)) return;
      e.preventDefault();
      e.stopPropagation();

      const startX = e.clientX;
      const startY = e.clientY;
      const rect = windowEl.getBoundingClientRect();
      const startW = rect.width;
      const startH = rect.height;
      const MIN_W = 320;
      const MIN_H = 200;

      function onMove(e) {
        const newW = Math.max(MIN_W, startW + (e.clientX - startX));
        const newH = Math.max(MIN_H, startH + (e.clientY - startY));
        windowEl.style.width = newW + 'px';
        windowEl.style.height = newH + 'px';
      }
      function onUp() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  /* Title-bar drag to move window */
  if (titleBar) {
    titleBar.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      if (e.target.closest('.title-bar-controls')) return;
      if (!getCanDrag(windowEl)) return;

      e.preventDefault();
      const startX = e.clientX;
      const startY = e.clientY;
      const rect = windowEl.getBoundingClientRect();
      let startLeft = rect.left;
      let startTop = rect.top;

      function onMove(e) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const newLeft = Math.max(0, startLeft + dx);
        const newTop = Math.max(0, startTop + dy);
        windowEl.style.left = newLeft + 'px';
        windowEl.style.top = newTop + 'px';
      }
      function onUp() {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }
}

if (typeof window !== 'undefined') {
  window.attachWindowChrome = attachWindowChrome;
}
