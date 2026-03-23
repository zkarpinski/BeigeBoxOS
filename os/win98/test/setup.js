/**
 * Jest setup: minimal DOM for shell and Word tests.
 * Uses Jest's built-in jsdom; adds required elements if missing.
 */
require('@testing-library/jest-dom');

(function () {
  if (typeof document !== 'undefined' && !document.elementFromPoint) {
    document.elementFromPoint = function () {
      return null;
    };
  }
  if (typeof document !== 'undefined' && typeof document.execCommand !== 'function') {
    document.execCommand = function () {
      return true;
    };
  }
  if (typeof document !== 'undefined' && typeof document.queryCommandState !== 'function') {
    document.queryCommandState = function () {
      return false;
    };
  }
  if (typeof global.TextEncoder === 'undefined') {
    const util = require('util');
    global.TextEncoder = util.TextEncoder;
    global.TextDecoder = util.TextDecoder;
  }
  if (typeof document === 'undefined' || !document.body) return;
  const body = document.body;

  function ensure(id, tag, fn) {
    if (document.getElementById(id)) return;
    const el = document.createElement(tag || 'div');
    el.id = id;
    if (fn) fn(el);
    body.appendChild(el);
  }

  ensure('word-window', 'div', (el) => {
    el.style.display = 'flex';
    const editor = document.createElement('div');
    editor.id = 'editor';
    editor.contentEditable = 'true';
    el.appendChild(editor);
  });
  ensure('taskbar-word', 'div', (el) => {
    el.className = 'taskbar-task';
  });
  ensure('shutdown-overlay', 'div', (el) => {
    el.setAttribute('hidden', '');
  });
  ensure('start-shutdown', 'div');
  ensure('menu-file', 'div');
  ensure('about-dialog', 'div', (el) => {
    el.setAttribute('hidden', '');
  });
})();
