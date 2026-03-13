/**
 * Control Panel – Sounds Properties applet.
 * Shows a list of Windows events with associated sounds; Preview plays
 * a synthesized tone via Web Audio API.
 */
(function () {
  'use strict';

  var cp = window.ControlPanel97;
  if (!cp) return;

  var EVENTS = [
    { name: 'Asterisk',           icon: 'ℹ️',  sound: 'ding'        },
    { name: 'Critical Stop',      icon: '🛑',  sound: 'exclamation' },
    { name: 'Default Beep',       icon: '🔔',  sound: 'ding'        },
    { name: 'Exclamation',        icon: '⚠️',  sound: 'exclamation' },
    { name: 'Exit Windows',       icon: '🪟',  sound: 'chord'       },
    { name: 'Maximize',           icon: '🔳',  sound: ''            },
    { name: 'Minimize',           icon: '🔲',  sound: ''            },
    { name: 'Open Program',       icon: '📂',  sound: ''            },
    { name: 'Program Error',      icon: '❌',  sound: 'exclamation' },
    { name: 'Question',           icon: '❓',  sound: 'ding'        },
    { name: 'Start Windows',      icon: '🏁',  sound: 'tada'        },
    { name: 'Windows Logon',      icon: '🔑',  sound: 'notify'      },
  ];

  var dialog = null;
  var eventsListEl = null;
  var soundSelectEl = null;
  var previewBtn = null;
  var selectedEvent = null;

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

  /* ── Web Audio synthesis ── */
  function playSound(name) {
    if (!name) return;
    var AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    var ctx = new AudioCtx();

    function tone(freq, start, dur, gain) {
      var osc = ctx.createOscillator();
      var env = ctx.createGain();
      osc.connect(env);
      env.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      env.gain.setValueAtTime(gain || 0.3, ctx.currentTime + start);
      env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur + 0.05);
    }

    if (name === 'chord') {
      // C major triad
      tone(261.6, 0,    0.4);
      tone(329.6, 0,    0.4);
      tone(392.0, 0,    0.4);
    } else if (name === 'ding') {
      tone(880, 0, 0.5);
    } else if (name === 'tada') {
      tone(261.6, 0,    0.15);
      tone(329.6, 0.15, 0.15);
      tone(392.0, 0.30, 0.35);
    } else if (name === 'notify') {
      tone(523.3, 0,    0.15);
      tone(392.0, 0.15, 0.25);
    } else if (name === 'exclamation') {
      tone(600, 0,    0.08);
      tone(500, 0.1,  0.12);
      tone(400, 0.24, 0.18);
    }

    // Close AudioContext after sounds finish
    setTimeout(function () { ctx.close(); }, 1000);
  }

  /* ── Build events list ── */
  function buildEventsList() {
    eventsListEl.innerHTML = '';
    EVENTS.forEach(function (ev) {
      var li = document.createElement('li');
      var iconEl = document.createElement('span');
      iconEl.className = 'snd-event-icon';
      iconEl.textContent = ev.icon;
      var nameEl = document.createElement('span');
      nameEl.textContent = ev.name;
      li.appendChild(iconEl);
      li.appendChild(nameEl);
      li.addEventListener('click', function () {
        eventsListEl.querySelectorAll('li').forEach(function (el) { el.classList.remove('snd-selected'); });
        li.classList.add('snd-selected');
        selectedEvent = ev;
        soundSelectEl.value = ev.sound || '';
        if (previewBtn) previewBtn.disabled = !ev.sound;
      });
      eventsListEl.appendChild(li);
    });
  }

  /* ── Open ── */
  function openDialog() {
    if (!dialog) {
      dialog      = document.getElementById('sounds-dialog');
      eventsListEl = document.getElementById('snd-events-list');
      soundSelectEl = document.getElementById('snd-sound-select');
      previewBtn   = document.getElementById('snd-preview-btn');

      buildEventsList();

      previewBtn.addEventListener('click', function () {
        if (selectedEvent) playSound(soundSelectEl.value);
      });
      soundSelectEl.addEventListener('change', function () {
        if (previewBtn) previewBtn.disabled = !this.value;
      });

      document.getElementById('snd-ok-btn').addEventListener('click', closeDialog);
      document.getElementById('snd-cancel-btn').addEventListener('click', closeDialog);
      document.getElementById('snd-close-btn').addEventListener('click', closeDialog);
      document.getElementById('snd-apply-btn').addEventListener('click', function () {
        // No persistent state for sounds — visual only
      });

      addDrag(dialog, dialog.querySelector('.dp-titlebar'));
    }

    selectedEvent = null;
    if (previewBtn) previewBtn.disabled = true;
    eventsListEl.querySelectorAll('li').forEach(function (el) { el.classList.remove('snd-selected'); });

    dialog.removeAttribute('hidden');
    var w = 360;
    dialog.style.left = Math.round((window.innerWidth  - w) / 2) + 'px';
    dialog.style.top  = Math.round((window.innerHeight - (dialog.offsetHeight || 300)) / 2) + 'px';
    var h = dialog.offsetHeight;
    dialog.style.top  = Math.round((window.innerHeight - h) / 2) + 'px';
  }

  function closeDialog() {
    if (dialog) dialog.setAttribute('hidden', '');
  }

  /* ── Wire CP icon ── */
  var icon = document.getElementById('cp-applet-sounds');
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

  cp.openSoundsDialog = openDialog;
})();
