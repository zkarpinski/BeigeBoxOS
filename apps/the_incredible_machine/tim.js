/**
 * The Incredible Machine – desktop easter egg.
 * Double-click the desktop icon → window with Sierra logo + audio → fatal error.
 */
(function () {
  'use strict';

  var icon = document.getElementById('tim-desktop-icon');
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
  window.launchTim = launch;

  // ── Window ───────────────────────────────────────────────────────────────

  function launch() {
    // Don't open twice
    if (document.getElementById('tim-window')) return;

    var win = document.createElement('div');
    win.id = 'tim-window';
    win.className = 'tim-win app-window';

    win.innerHTML =
      '<div class="title-bar" id="tim-titlebar">' +
        '<div class="title-bar-text">' +
          '<img src="apps/the_incredible_machine/tim-icon.png" alt="TIM" style="width:16px;height:16px;margin-right:4px;">' +
          '<span class="title-text">The Incredible Machine</span>' +
        '</div>' +
        '<div class="title-bar-controls">' +
          '<button class="win-btn title-btn" id="tim-close" title="Close" aria-label="Close"><span class="icon-close">X</span></button>' +
        '</div>' +
      '</div>' +
      '<div class="tim-body">' +
        '<img src="apps/the_incredible_machine/logo.png" class="tim-screen" alt="Sierra Logo">' +
        '<audio id="tim-audio" src="apps/the_incredible_machine/sierra.mp3" autoplay></audio>' +
      '</div>';

    document.body.appendChild(win);

    // Manual close (cancels crash timer)
    var bsodTimer = null;
    var closed = false;

    function closeWindow() {
      if (closed) return;
      closed = true;
      clearTimeout(bsodTimer);
      win.remove();
    }

    document.getElementById('tim-close').addEventListener('click', closeWindow);

    // Drag
    var titlebar = document.getElementById('tim-titlebar');
    var dragging = false, dx = 0, dy = 0;
    titlebar.addEventListener('mousedown', function (e) {
      if (e.target.id === 'tim-close') return;
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

    // Audio playback and fatal error after audio finishes (or fallback after 20s)
    var audio = document.getElementById('tim-audio');

    // Play the audio explicitly to ensure it starts (autoplay may be blocked)
    audio.play().catch(function(e) {
      console.warn("Audio play blocked", e);
    });

    var triggerBsod = function() {
      if (closed) return;
      closeWindow();
      Windows97.fatalError({
        program: 'The Incredible Machine',
        details:
          "The Incredible Machine caused an invalid page fault in\n" +
          "module THEINCREDIBLEMACHINE.EXE at 0177:00c03a2f.\n" +
          "\n" +
          "Registers:\n" +
          "EAX=1c8a329d CS=0177 EIP=00c03a2f EFLGS=00010246\n" +
          "EBX=00000000 SS=017f ESP=00b4ef28 EBP=00b4ef58\n" +
          "ECX=43a7f200 DS=017f ESI=011e329c FS=3eaf\n" +
          "EDX=00000068 ES=017f EDI=00000000 GS=0000\n" +
          "\n" +
          "Bytes at CS:EIP:\n" +
          "8b 45 f4 8b 55 08 89 02 8b 45 0c 85 c0 74 0a 8b",
      });
    };

    // Trigger fatal error when audio ends, or fallback timer in case of audio issues
    audio.addEventListener('ended', triggerBsod);
    bsodTimer = setTimeout(triggerBsod, 20000); // 20s fallback
  }

})();
