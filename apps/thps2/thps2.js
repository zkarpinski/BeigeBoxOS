/**
 * Tony Hawk's Pro Skater 2 – desktop easter egg.
 * Double-click the desktop icon → title screen window (3 sec) → BSOD.
 */
(function () {
  'use strict';

  var icon = document.getElementById('thps2-desktop-icon');
  if (!icon) return;

  // ── Desktop icon: single-click selects, double-click launches ────────────

  var clickCount = 0;
  var clickTimer  = null;

  icon.addEventListener('click', function (e) {
    e.stopPropagation();
    icon.classList.add('selected');
    clickCount++;
    if (clickCount === 1) {
      clickTimer = setTimeout(function () { clickCount = 0; }, 350);
    } else {
      clearTimeout(clickTimer);
      clickCount = 0;
      launch();
    }
  });

  icon.addEventListener('touchend', function (e) {
    e.preventDefault();
    e.stopPropagation();
    icon.classList.add('selected');
    clearTimeout(clickTimer);
    clickCount = 0;
    launch();
  });

  document.addEventListener('click', function (e) {
    if (!icon.contains(e.target)) icon.classList.remove('selected');
  });

  // Expose for start menu
  window.launchThps2 = launch;

  // ── Title screen window ───────────────────────────────────────────────────

  function launch() {
    // Don't open twice
    if (document.getElementById('thps2-window')) return;

    var win = document.createElement('div');
    win.id = 'thps2-window';
    win.className = 'thps2-win';

    win.innerHTML =
      '<div class="thps2-titlebar" id="thps2-titlebar">' +
        '<span class="thps2-titlebar-text">' +
          '<img src="apps/thps2/thps2-icon.png" class="thps2-tb-icon" alt=""> ' +
          "Tony Hawk's Pro Skater 2" +
        '</span>' +
        '<button class="thps2-close-btn" id="thps2-close" aria-label="Close">&#x2715;</button>' +
      '</div>' +
      '<div class="thps2-body">' +
        '<img src="apps/thps2/thps2-title-screen.png" class="thps2-screen" alt="THPS2 title screen">' +
      '</div>';

    document.body.appendChild(win);

    // Manual close (cancels BSOD timer)
    var bsodTimer = null;
    var closed = false;

    function closeWindow() {
      if (closed) return;
      closed = true;
      clearTimeout(bsodTimer);
      win.remove();
    }

    document.getElementById('thps2-close').addEventListener('click', closeWindow);

    // Drag
    var titlebar = document.getElementById('thps2-titlebar');
    var dragging = false, dx = 0, dy = 0;
    titlebar.addEventListener('mousedown', function (e) {
      if (e.target.id === 'thps2-close') return;
      dragging = true;
      var r = win.getBoundingClientRect();
      dx = e.clientX - r.left;
      dy = e.clientY - r.top;
      win.style.transform = 'none';
      win.style.left = r.left + 'px';
      win.style.top  = r.top  + 'px';
      e.preventDefault();
    });
    document.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      win.style.left = (e.clientX - dx) + 'px';
      win.style.top  = (e.clientY - dy) + 'px';
    });
    document.addEventListener('mouseup', function () { dragging = false; });

    // BSOD after 3 s
    bsodTimer = setTimeout(function () {
      if (closed) return;
      closeWindow();
      Windows97.bsod({
        message:
          "A fatal exception 0E has occurred at F000:E2C3 in VXD THPS2(0D).\n" +
          "VXDLDR device driver THPS2.VXD failed to initialize.\n\n" +
          "*  Press any key to terminate the current application.\n" +
          "*  Press CTRL+ALT+DEL to restart your computer. You will\n" +
          "   lose any unsaved information in all applications.",
        clearStorage: true,
        reload: true,
      });
    }, 3000);
  }

})();
