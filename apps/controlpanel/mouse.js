/**
 * Control Panel – Mouse Properties applet.
 * Buttons tab: hand configuration, dblclick speed, 🐰 hop test.
 * Motion tab: pointer speed slider, pointer trails checkbox.
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
      dialog = document.getElementById('mouse-dialog');

      // Tab switching
      var panelButtons = document.getElementById('ms-panel-buttons');
      var panelMotion  = document.getElementById('ms-panel-motion');
      var tabBtnsBtn   = document.getElementById('ms-tab-buttons-btn');
      var tabMotionBtn = document.getElementById('ms-tab-motion-btn');

      tabBtnsBtn.addEventListener('click', function () {
        tabBtnsBtn.classList.add('active');
        tabMotionBtn.classList.remove('active');
        panelButtons.style.display = '';
        panelMotion.style.display  = 'none';
      });
      tabMotionBtn.addEventListener('click', function () {
        tabMotionBtn.classList.add('active');
        tabBtnsBtn.classList.remove('active');
        panelMotion.style.display  = '';
        panelButtons.style.display = 'none';
      });

      // Hand configuration — swap which SVG button looks primary
      var leftBtn  = document.getElementById('ms-left-btn');
      var rightBtn = document.getElementById('ms-right-btn');
      var PRIMARY_COLOR   = '#1084d0';
      var SECONDARY_COLOR = '#e8e8e8';

      document.getElementById('ms-hand-right').addEventListener('change', function () {
        if (this.checked) {
          leftBtn.setAttribute('fill', PRIMARY_COLOR);
          rightBtn.setAttribute('fill', SECONDARY_COLOR);
        }
      });
      document.getElementById('ms-hand-left').addEventListener('change', function () {
        if (this.checked) {
          rightBtn.setAttribute('fill', PRIMARY_COLOR);
          leftBtn.setAttribute('fill', SECONDARY_COLOR);
        }
      });

      // Double-click test — 🐰 hop animation
      var testEl  = document.getElementById('ms-dblclick-test');
      var clickCount = 0, dblTimer = null;
      var sliderEl = document.getElementById('ms-dblclick-slider');

      testEl.addEventListener('click', function () {
        clickCount++;
        if (clickCount === 1) {
          var speed = parseInt(sliderEl.value, 10) || 5;
          var delay = Math.round(700 - speed * 55); // 645ms→145ms range
          dblTimer = setTimeout(function () { clickCount = 0; }, delay);
        } else {
          clearTimeout(dblTimer);
          clickCount = 0;
          testEl.classList.remove('ms-hopping');
          // Force reflow to restart animation
          void testEl.offsetWidth;
          testEl.classList.add('ms-hopping');
          testEl.addEventListener('animationend', function onEnd() {
            testEl.classList.remove('ms-hopping');
            testEl.removeEventListener('animationend', onEnd);
          });
        }
      });

      // Pointer trails toggle enables/disables trail slider
      var trailsCheck  = document.getElementById('ms-trails-check');
      var trailsSlider = document.getElementById('ms-trails-slider');
      trailsCheck.addEventListener('change', function () {
        trailsSlider.disabled = !this.checked;
      });

      document.getElementById('ms-ok-btn').addEventListener('click', closeDialog);
      document.getElementById('ms-cancel-btn').addEventListener('click', closeDialog);
      document.getElementById('ms-close-btn').addEventListener('click', closeDialog);
      document.getElementById('ms-apply-btn').addEventListener('click', function () {
        // Visual-only; no persistent state
      });

      addDrag(dialog, dialog.querySelector('.dp-titlebar'));
    }

    // Reset to Buttons tab
    var panelButtons = document.getElementById('ms-panel-buttons');
    var panelMotion  = document.getElementById('ms-panel-motion');
    panelButtons.style.display = '';
    panelMotion.style.display  = 'none';
    document.getElementById('ms-tab-buttons-btn').classList.add('active');
    document.getElementById('ms-tab-motion-btn').classList.remove('active');

    dialog.removeAttribute('hidden');
    var w = 390;
    dialog.style.left = Math.round((window.innerWidth  - w) / 2) + 'px';
    dialog.style.top  = Math.round((window.innerHeight - (dialog.offsetHeight || 300)) / 2) + 'px';
    var h = dialog.offsetHeight;
    dialog.style.top  = Math.round((window.innerHeight - h) / 2) + 'px';
  }

  function closeDialog() {
    if (dialog) dialog.setAttribute('hidden', '');
  }

  /* ── Wire CP icon ── */
  var icon = document.getElementById('cp-applet-mouse');
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

  cp.openMouseDialog = openDialog;
})();
