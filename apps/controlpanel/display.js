/**
 * Control Panel – Display Properties applet logic.
 * Handles background/wallpaper selection and applying to the desktop.
 */
(function () {
  'use strict';

  var cp = window.ControlPanel97;
  if (!cp) return;

  var dialog = null;
  var listEl = null;
  var monitorBg = null;
  var monitorImg = null;
  var applyBtn = null;
  var okBtn = null;

  function getDesktopEl() {
    return document.getElementById('desktop') || document.body;
  }

  /* ── Apply wallpaper to desktop ── */
  function applyWallpaper(id) {
    var wp = cp.wallpapers.find(function (w) { return w.id === id; });
    if (!wp) return;
    var desktop = getDesktopEl();
    if (wp.src) {
      desktop.style.backgroundImage = 'url("' + wp.src + '")';
      desktop.style.backgroundSize = 'cover';
      desktop.style.backgroundRepeat = 'no-repeat';
      desktop.style.backgroundPosition = 'center';
    } else {
      desktop.style.backgroundImage = '';
      desktop.style.backgroundSize = '';
      desktop.style.backgroundRepeat = '';
      desktop.style.backgroundPosition = '';
    }
    cp.appliedWallpaper = id;
  }

  /* ── Update monitor preview ── */
  function updatePreview(id) {
    var wp = cp.wallpapers.find(function (w) { return w.id === id; });
    if (!wp) return;
    if (wp.src) {
      monitorImg.src = wp.src;
      monitorImg.classList.add('visible');
      monitorBg.style.background = '';
    } else {
      monitorImg.classList.remove('visible');
      monitorImg.src = '';
      monitorBg.style.background = '#008080';
    }
  }

  /* ── Build wallpaper list ── */
  function buildList() {
    listEl.innerHTML = '';
    cp.wallpapers.forEach(function (wp) {
      var li = document.createElement('li');
      li.dataset.id = wp.id;
      // Small icon: circle with X for none, image icon for others
      var iconSvg = wp.src
        ? '<svg width="14" height="14" viewBox="0 0 14 14"><rect width="14" height="14" rx="1" fill="#87ceeb"/><rect x="0" y="8" width="14" height="6" fill="#5ab"/></svg>'
        : '<svg width="14" height="14" viewBox="0 0 14 14"><rect width="14" height="14" rx="1" fill="#ccc" stroke="#999" stroke-width="1"/><line x1="2" y1="2" x2="12" y2="12" stroke="#999" stroke-width="1.5"/><line x1="12" y1="2" x2="2" y2="12" stroke="#999" stroke-width="1.5"/></svg>';
      li.innerHTML = iconSvg + wp.label;
      if (wp.id === cp.appliedWallpaper) {
        li.classList.add('selected');
      }
      li.addEventListener('click', function () {
        listEl.querySelectorAll('li').forEach(function (el) { el.classList.remove('selected'); });
        li.classList.add('selected');
        cp.pendingWallpaper = wp.id;
        updatePreview(wp.id);
        if (applyBtn) applyBtn.disabled = false;
      });
      listEl.appendChild(li);
    });
  }

  /* ── Open Display Properties dialog ── */
  function openDisplayDialog() {
    if (!dialog) {
      dialog = document.getElementById('display-properties-dialog');
      listEl = document.getElementById('dp-wallpaper-list');
      monitorBg = document.getElementById('dp-monitor-screen');
      monitorImg = document.getElementById('dp-monitor-img');
      applyBtn = document.getElementById('dp-apply-btn');
      okBtn = document.getElementById('dp-ok-btn');

      // Close button
      var closeBtn = document.getElementById('dp-close-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', closeDisplayDialog);
      }
      // Cancel button
      var cancelBtn = document.getElementById('dp-cancel-btn');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', closeDisplayDialog);
      }
      // OK button
      if (okBtn) {
        okBtn.addEventListener('click', function () {
          if (cp.pendingWallpaper !== null) {
            applyWallpaper(cp.pendingWallpaper);
          }
          closeDisplayDialog();
        });
      }
      // Apply button
      if (applyBtn) {
        applyBtn.addEventListener('click', function () {
          if (cp.pendingWallpaper !== null) {
            applyWallpaper(cp.pendingWallpaper);
            applyBtn.disabled = true;
          }
        });
      }

      // Drag to move
      var titlebar = dialog.querySelector('.dp-titlebar');
      if (titlebar) {
        var dragOffsetX = 0, dragOffsetY = 0, dragging = false;
        titlebar.addEventListener('mousedown', function (e) {
          if (e.target.closest('.dp-titlebtn')) return;
          dragging = true;
          var rect = dialog.getBoundingClientRect();
          dragOffsetX = e.clientX - rect.left;
          dragOffsetY = e.clientY - rect.top;
          e.preventDefault();
        });
        document.addEventListener('mousemove', function (e) {
          if (!dragging) return;
          var x = e.clientX - dragOffsetX;
          var y = e.clientY - dragOffsetY;
          // Clamp to viewport
          x = Math.max(0, Math.min(x, window.innerWidth - dialog.offsetWidth));
          y = Math.max(0, Math.min(y, window.innerHeight - dialog.offsetHeight));
          dialog.style.left = x + 'px';
          dialog.style.top = y + 'px';
        });
        document.addEventListener('mouseup', function () { dragging = false; });
      }
    }

    // Center dialog on open (explicit px so drag works correctly)
    dialog.style.left = Math.round((window.innerWidth - 420) / 2) + 'px';
    dialog.style.top = Math.round((window.innerHeight - dialog.offsetHeight || 300) / 2) + 'px';

    // Reset pending to current
    cp.pendingWallpaper = cp.appliedWallpaper;
    buildList();
    updatePreview(cp.appliedWallpaper);
    if (applyBtn) applyBtn.disabled = true;
    dialog.removeAttribute('hidden');

    // Re-center vertically now that dialog is visible and has real height
    var h = dialog.offsetHeight;
    dialog.style.top = Math.round((window.innerHeight - h) / 2) + 'px';
  }

  function closeDisplayDialog() {
    if (dialog) dialog.setAttribute('hidden', '');
    cp.pendingWallpaper = null;
  }

  /* ── Wire up Display icon in Control Panel ── */
  var displayIcon = document.getElementById('cp-applet-display');
  if (displayIcon) {
    var clicks = 0, clickTimer = null;
    displayIcon.addEventListener('click', function () {
      // Select
      document.querySelectorAll('.cp-applet-icon').forEach(function (el) { el.classList.remove('selected'); });
      displayIcon.classList.add('selected');
      clicks++;
      if (clicks === 1) {
        clickTimer = setTimeout(function () { clicks = 0; }, 350);
      } else {
        clearTimeout(clickTimer);
        clicks = 0;
        openDisplayDialog();
      }
    });
  }

  // Expose for shell integration
  cp.openDisplayDialog = openDisplayDialog;
  cp.applyWallpaper = applyWallpaper;
})();
