/**
 * Persist user state locally (localStorage) so returning users resume where they left off.
 * Shutdown clears state so next visit starts fresh. All data stays on device.
 */
(function () {
  'use strict';

  const KEY = 'word97-state';
  const STATE_VERSION = 2; // Bump when default content changes (e.g. new resume) so old saved content isn't restored
  const SAVE_DEBOUNCE_MS = 1000;
  const SAVE_INTERVAL_MS = 5000;
  let saveTimer = null;

  function loadState() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function getCurrentState() {
    const editor = document.getElementById('editor');
    const wordWindow = document.getElementById('word-window');
    const vb6Window = document.getElementById('vb6-window');
    const clippy97 = document.getElementById('clippy-97-window');

    return {
      stateVersion: STATE_VERSION,
      editorContent: editor ? editor.innerHTML : '',
      wordWindowed: wordWindow ? wordWindow.classList.contains('windowed') : false,
      vb6Visible: vb6Window ? !vb6Window.classList.contains('app-window-hidden') : false,
      clippy97Visible: clippy97 ? clippy97.style.display !== 'none' : true,
    };
  }

  function saveState() {
    try {
      const state = getCurrentState();
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (_) {}
  }

  function clearState() {
    try {
      localStorage.removeItem(KEY);
    } catch (e) {
      console.error('Failed to clear state:', e);
    }
  }

  function applyState(state) {
    if (!state) return;
    const editor = document.getElementById('editor');
    const wordWindow = document.getElementById('word-window');
    const vb6Window = document.getElementById('vb6-window');
    const clippy97 = document.getElementById('clippy-97-window');

    // Only restore editor content if state is current version (avoids restoring old "sample" after default resume change)
    const isCurrentVersion = state.stateVersion >= STATE_VERSION;
    if (isCurrentVersion && state.editorContent != null && editor) {
      editor.innerHTML = state.editorContent;
      if (window.Word97 && window.Word97.updateStatusBar) {
        window.Word97.updateStatusBar();
      }
    }
    if (wordWindow && state.wordWindowed != null) {
      if (state.wordWindowed) wordWindow.classList.add('windowed');
      else wordWindow.classList.remove('windowed');
    }
    if (vb6Window != null && window.Windows97 && state.vb6Visible != null) {
      if (state.vb6Visible) window.Windows97.showApp('vb6');
      else window.Windows97.hideApp('vb6');
    }
    if (clippy97 && state.clippy97Visible != null) {
      clippy97.style.display = state.clippy97Visible ? '' : 'none';
    }
  }

  function debouncedSave() {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveTimer = null;
      saveState();
    }, SAVE_DEBOUNCE_MS);
  }

  // Restore on load (after DOM ready; runs after resume.js may have set default)
  function tryRestore() {
    const state = loadState();
    if (state) applyState(state);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryRestore);
  } else {
    tryRestore();
  }

  // Save on editor input (debounced)
  document.addEventListener('input', (e) => {
    if (e.target.id === 'editor') debouncedSave();
  });

  // Save periodically and on page unload
  setInterval(saveState, SAVE_INTERVAL_MS);
  window.addEventListener('beforeunload', saveState);

  // Expose for shutdown (clear) and for resume.js (skip default if we have state)
  window.Word97State = {
    loadState,
    clearState,
    saveState,
  };
})();
