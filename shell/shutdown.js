/**
 * Shut Down - Windows 95 style "It is now safe to turn off your computer" dialog.
 * Screen dims to black; Clippy is hidden during shutdown.
 */
(function () {
  'use strict';

  const overlay = document.getElementById('shutdown-overlay');
  const startShutdown = document.getElementById('start-shutdown');

  if (!overlay || !startShutdown) return;

  function hideClippy98() {
    if (window.Clippy98Agent && typeof window.Clippy98Agent.hide === 'function') {
      window.Clippy98Agent.hide();
    }
    if (window.BonziAgent && typeof window.BonziAgent.hide === 'function') {
      window.BonziAgent.hide();
    }
  }
  function showClippy98() {
    if (window.Clippy98Agent && typeof window.Clippy98Agent.show === 'function') {
      window.Clippy98Agent.show();
    }
    if (window.BonziAgent && typeof window.BonziAgent.show === 'function') {
      window.BonziAgent.show();
    }
  }

  startShutdown.addEventListener('click', () => {
    hideClippy98();
    document.body.classList.add('shutdown-active');
    overlay.removeAttribute('hidden');
  });

  overlay.addEventListener('click', () => {
    if (window.Word97State && window.Word97State.clearState) {
      window.Word97State.clearState();
    }
    try { localStorage.removeItem('word97-booted'); } catch (_) {}
    document.body.classList.remove('shutdown-active');
    overlay.setAttribute('hidden', '');
    showClippy98();
  });
})();
