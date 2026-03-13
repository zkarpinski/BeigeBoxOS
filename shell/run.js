(function () {
  'use strict';

  var dialog  = document.getElementById('run-dialog');
  var input   = document.getElementById('run-input');
  var okBtn   = document.getElementById('run-ok-btn');
  var cancelBtn = document.getElementById('run-cancel-btn');
  var closeBtn  = document.getElementById('run-close-btn');
  if (!dialog) return;

  // ── Command → app id map ──────────────────────────────────────────────────
  var APP_COMMANDS = {
    'winword':    'word',   'winword.exe': 'word',   'word':      'word',
    'notepad':    'notepad','notepad.exe': 'notepad',
    'calc':       'calculator', 'calc.exe': 'calculator', 'calculator': 'calculator',
    'mspaint':    'paint',  'mspaint.exe': 'paint',  'paint':     'paint',
    'winamp':     'winamp', 'winamp.exe':  'winamp',
    'napster':    'napster','napster.exe': 'napster',
    'aim':        'aim',    'aim.exe':     'aim',
    'navigator':  'navigator', 'netscape':  'navigator', 'netscape.exe': 'navigator',
    'iexplore':   'ie5',    'iexplore.exe':'ie5',    'ie5':       'ie5',
    'winmine':    'minesweeper', 'winmine.exe': 'minesweeper', 'minesweeper': 'minesweeper',
    'vb6':        'vb6',    'vb6.exe':     'vb6',
    'thps2':      'thps2',  'thps.exe':    'thps2',
    'defrag':     'defrag', 'defrag.exe':  'defrag',
    'control':    'controlpanel', 'control.exe': 'controlpanel', 'controlpanel': 'controlpanel',
    'explorer':   'mycomputer',   'explorer.exe':'mycomputer',   'mycomputer': 'mycomputer',
  };

  // ── Open / Close ──────────────────────────────────────────────────────────
  function open() {
    dialog.classList.remove('hidden');
    input.value = '';
    // Center explicitly so drag works
    dialog.style.left = Math.round((window.innerWidth  - 380) / 2) + 'px';
    dialog.style.top  = Math.round((window.innerHeight - dialog.offsetHeight || 160) / 2) + 'px';
    dialog.removeAttribute('hidden');
    dialog.classList.remove('hidden');
    // Re-center after paint
    requestAnimationFrame(function () {
      dialog.style.top = Math.round((window.innerHeight - dialog.offsetHeight) / 2) + 'px';
      input.focus();
      input.select();
    });
  }

  function close() {
    dialog.classList.add('hidden');
  }

  // ── Execute command ───────────────────────────────────────────────────────
  function run() {
    var raw = input.value.trim();
    if (!raw) { close(); return; }

    var cmd = raw.toLowerCase().replace(/\s+.*$/, ''); // first token only

    // URL → open in Navigator
    if (/^https?:\/\//i.test(raw) || /^www\./i.test(raw)) {
      close();
      var url = /^https?:\/\//i.test(raw) ? raw : 'https://' + raw;
      if (window.Navigator97 && typeof window.Navigator97.navigateTo === 'function') {
        if (window.Windows97) window.Windows97.showApp('navigator');
        window.Navigator97.navigateTo(url);
      } else if (window.Windows97) {
        window.Windows97.showApp('navigator');
      }
      return;
    }

    var appId = APP_COMMANDS[cmd];
    if (appId && window.Windows97) {
      close();
      window.Windows97.showApp(appId);
      return;
    }

    // Unknown command — show Win97 error dialog
    close();
    if (window.showW97Dialog) {
      window.showW97Dialog({
        title: 'Run',
        icon: 'error',
        message: 'Cannot find \u2018' + raw + '\u2019. Make sure you typed the name correctly, and then try again.',
        buttons: [{ label: 'OK', default: true }],
      });
    }
  }

  // ── Buttons ───────────────────────────────────────────────────────────────
  okBtn.addEventListener('click', run);
  cancelBtn.addEventListener('click', close);
  closeBtn.addEventListener('click', close);

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') run();
    if (e.key === 'Escape') close();
  });

  // ── Drag titlebar ─────────────────────────────────────────────────────────
  var titlebar = dialog.querySelector('.run-titlebar');
  var dragOX = 0, dragOY = 0, dragging = false;
  titlebar.addEventListener('mousedown', function (e) {
    if (e.target.closest('.run-titlebtn')) return;
    dragging = true;
    var r = dialog.getBoundingClientRect();
    dragOX = e.clientX - r.left;
    dragOY = e.clientY - r.top;
    e.preventDefault();
  });
  document.addEventListener('mousemove', function (e) {
    if (!dragging) return;
    var x = Math.max(0, Math.min(e.clientX - dragOX, window.innerWidth  - dialog.offsetWidth));
    var y = Math.max(0, Math.min(e.clientY - dragOY, window.innerHeight - dialog.offsetHeight));
    dialog.style.left = x + 'px';
    dialog.style.top  = y + 'px';
  });
  document.addEventListener('mouseup', function () { dragging = false; });

  // ── Expose open() for taskbar.js ─────────────────────────────────────────
  window.Run97 = { open: open, close: close };
})();
