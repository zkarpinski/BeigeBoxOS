/**
 * Control Panel – System Properties applet.
 * Static Pentium II / Windows 98 SE information panel.
 */
(function () {
  'use strict';

  var cp = window.ControlPanel97;
  if (!cp) return;

  var dialog = null;

  /* ── Drag helper ── */
  function addDrag(dlg, handle) {
    var ox = 0, oy = 0, dragging = false;
    handle.addEventListener('mousedown', function (e) {
      if (e.target.closest('.dp-titlebtn')) return;
      dragging = true;
      var r = dlg.getBoundingClientRect();
      ox = e.clientX - r.left;
      oy = e.clientY - r.top;
      e.preventDefault();
    });
    document.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      var x = Math.max(0, Math.min(e.clientX - ox, window.innerWidth  - dlg.offsetWidth));
      var y = Math.max(0, Math.min(e.clientY - oy, window.innerHeight - dlg.offsetHeight));
      dlg.style.left = x + 'px';
      dlg.style.top  = y + 'px';
    });
    document.addEventListener('mouseup', function () { dragging = false; });
  }

  /* ── Open ── */
  function openDialog() {
    if (!dialog) {
      dialog = document.getElementById('system-dialog');

      document.getElementById('sys-ok-btn').addEventListener('click', closeDialog);
      document.getElementById('sys-cancel-btn').addEventListener('click', closeDialog);
      document.getElementById('sys-close-btn').addEventListener('click', closeDialog);

      addDrag(dialog, dialog.querySelector('.dp-titlebar'));
    }

    dialog.removeAttribute('hidden');
    var w = 420;
    dialog.style.left = Math.round((window.innerWidth  - w) / 2) + 'px';
    dialog.style.top  = Math.round((window.innerHeight - (dialog.offsetHeight || 300)) / 2) + 'px';
    var h = dialog.offsetHeight;
    dialog.style.top  = Math.round((window.innerHeight - h) / 2) + 'px';
  }

  function closeDialog() {
    if (dialog) dialog.setAttribute('hidden', '');
  }

  /* ── Wire CP icon ── */
  var icon = document.getElementById('cp-applet-system');
  if (icon) {
    var clicks = 0, clickTimer = null;
    icon.addEventListener('click', function () {
      document.querySelectorAll('.cp-applet-icon').forEach(function (el) { el.classList.remove('selected'); });
      icon.classList.add('selected');
      clicks++;
      if (clicks === 1) {
        clickTimer = setTimeout(function () { clicks = 0; }, 350);
      } else {
        clearTimeout(clickTimer);
        clicks = 0;
        openDialog();
      }
    });
    icon.addEventListener('touchend', function (e) {
      e.preventDefault();
      e.stopPropagation();
      document.querySelectorAll('.cp-applet-icon').forEach(function (el) { el.classList.remove('selected'); });
      icon.classList.add('selected');
      clearTimeout(clickTimer);
      clicks = 0;
      openDialog();
    });
  }

  cp.openSystemDialog = openDialog;
})();
