/**
 * Jest setup: minimal DOM for shell and Word tests.
 * Uses Jest's built-in jsdom; adds required elements if missing.
 */
(function () {
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
  ensure('taskbar-word', 'div', (el) => { el.className = 'taskbar-task'; });
  ensure('taskbar-vb6', 'div', (el) => { el.className = 'taskbar-task app-taskbar-hidden'; });
  ensure('vb6-window', 'div', (el) => { el.className = 'vb6-window app-window-hidden'; });
  ensure('pinball-overlay', 'div', (el) => { el.setAttribute('hidden', ''); });
  ensure('shutdown-overlay', 'div', (el) => { el.setAttribute('hidden', ''); });
  ensure('start-shutdown', 'div');
  ensure('menu-file', 'div');
  ensure('about-dialog', 'div', (el) => { el.setAttribute('hidden', ''); });
})();
