/**
 * VB6 - Window via shared chrome. Registers with Windows 97 shell.
 */
(function () {
  'use strict';

  const vb6Window = document.getElementById('vb6-window');
  if (!vb6Window) return;

  if (window.attachWindowChrome) {
    attachWindowChrome({
      windowEl: vb6Window,
      appId: 'vb6',
      taskbarId: 'taskbar-vb6',
      minimizedClass: 'minimized',
      maximizedClass: 'maximized',
      onClose: () => {
        if (window.Windows97) window.Windows97.hideApp('vb6');
      },
      getCanDrag: (el) => !el.classList.contains('maximized'),
    });
  }

  if (window.Windows97) {
    window.Windows97.registerApp({
      id: 'vb6',
      windowId: 'vb6-window',
      taskbarId: 'taskbar-vb6',
      startMenuId: 'start-vb6',
      openByDefault: false,
    });
  }

  // Interactivity for running the application
  const btnStart = document.getElementById('vb6-tb-start');
  const btnEnd = document.getElementById('vb6-tb-end');
  const runWindow = document.getElementById('vb6-run-window');
  const runCloseBtn = document.getElementById('vb6-run-close');
  const ideTitle = document.getElementById('vb6-ide-title');

  const runCmdClick = document.getElementById('vb6-run-cmd-click');
  const runLblText = document.getElementById('vb6-run-lbl-text');

  function startApp() {
    if (ideTitle) ideTitle.textContent = "Project1 - Microsoft Visual Basic [run]";
    if (runWindow) runWindow.classList.remove('hidden');
    if (runLblText) runLblText.textContent = "Label1"; // reset
  }

  function stopApp() {
    if (ideTitle) ideTitle.textContent = "Project1 - Microsoft Visual Basic [design]";
    if (runWindow) runWindow.classList.add('hidden');
  }

  if (btnStart) btnStart.addEventListener('click', startApp);
  if (btnEnd) btnEnd.addEventListener('click', stopApp);
  if (runCloseBtn) runCloseBtn.addEventListener('click', stopApp);

  if (runCmdClick && runLblText) {
    runCmdClick.addEventListener('click', () => {
      runLblText.textContent = "hello world";
    });
  }

  // MDI Window Management (Drag and Z-Index)
  const mdiWindows = document.querySelectorAll('.vb6-mdi-window');
  let topZIndex = 10;

  mdiWindows.forEach(win => {
    // Bring to front on mousedown
    win.addEventListener('mousedown', () => {
      topZIndex++;
      win.style.zIndex = topZIndex;
    });

    const titleBar = win.querySelector('.vb6-mdi-title');
    if (!titleBar) return;

    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    titleBar.addEventListener('mousedown', (e) => {
      // Don't drag if clicking a window control button
      if (e.target.closest('.title-btn')) return;

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;

      const rect = win.getBoundingClientRect();
      const parentRect = win.parentElement.getBoundingClientRect();

      initialLeft = win.offsetLeft;
      initialTop = win.offsetTop;

      e.preventDefault(); // prevent text selection
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      let newLeft = initialLeft + dx;
      let newTop = initialTop + dy;

      const parent = win.parentElement;
      const parentWidth = parent.clientWidth;
      const parentHeight = parent.clientHeight;
      const winWidth = win.offsetWidth;
      const winHeight = win.offsetHeight;

      // Constrain to parent boundaries
      if (newLeft < 0) newLeft = 0;
      if (newTop < 0) newTop = 0;
      if (newLeft + winWidth > parentWidth) newLeft = parentWidth - winWidth;
      if (newTop + winHeight > parentHeight) newTop = parentHeight - winHeight;

      win.style.left = `${newLeft}px`;
      win.style.top = `${newTop}px`;
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  });

})();
