/**
 * Word 97 - Status bar: line/col, page stats, view buttons, mode toggles (REC, TRK, etc.).
 */
(function () {
  'use strict';

  const { editor, wordWindow } = window.Word97 || {};
  if (!editor) return;

  function getCaretLineAndColumn() {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return { line: 1, col: 1 };
    const range = sel.getRangeAt(0);
    const caretNode = range.startContainer;
    const caretOffset = range.startOffset;
    if (!editor.contains(caretNode) && caretNode !== editor) {
      return { line: 1, col: 1 };
    }

    // Build string from start of editor up to caret, inserting \n at block boundaries,
    // so we get correct line/col for contenteditable (p, div, br, etc.)
    const blockTags = /^(P|DIV|H[1-6]|LI|TR|BLOCKQUOTE|HR)$/i;
    const strParts = [];
    let hasContent = false;

    function traverse(node, atBlockStart) {
      if (node === caretNode) {
        if (node.nodeType === Node.TEXT_NODE) {
          strParts.push(node.textContent.substring(0, caretOffset));
          hasContent = true;
          return true;
        }
        if (node.nodeType === Node.ELEMENT_NODE) {
          for (let i = 0, len = node.childNodes.length; i < caretOffset && i < len; i++) {
            if (traverse(node.childNodes[i], false)) return true;
          }
          return true;
        }
      }

      if (node.nodeType === Node.TEXT_NODE) {
        strParts.push(node.textContent);
        hasContent = true;
        return false;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return false;

      if (node.tagName === 'BR') {
        strParts.push('\n');
        hasContent = true;
        return false;
      }
      const isBlock = blockTags.test(node.tagName);
      if (isBlock && !atBlockStart && hasContent) {
        strParts.push('\n');
      }
      for (let i = 0, len = node.childNodes.length; i < len; i++) {
        if (traverse(node.childNodes[i], isBlock)) return true;
      }
      return false;
    }

    traverse(editor, true);
    const str = strParts.join('');
    const lines = str.split('\n');
    const line = lines.length;
    const col = (lines[lines.length - 1] || '').length + 1;
    return { line, col };
  }

  function updateStatusBar() {
    const { line, col } = getCaretLineAndColumn();
    const pageEl = document.getElementById('status-page');
    const secEl = document.getElementById('status-sec');
    const pagesEl = document.getElementById('status-pages');
    const atEl = document.getElementById('status-at');
    const lnEl = document.getElementById('status-ln');
    const colEl = document.getElementById('status-col');
    if (pageEl) pageEl.textContent = 'Page 1';
    if (secEl) secEl.textContent = 'Sec 1';
    if (pagesEl) pagesEl.textContent = '1/1';
    if (atEl) atEl.textContent = 'At 2.5cm';
    if (lnEl) lnEl.textContent = 'Ln ' + line;
    if (colEl) colEl.textContent = 'Col ' + col;
  }

  window.Word97.updateStatusBar = updateStatusBar;
  window.Word97.getCaretLineAndColumn = getCaretLineAndColumn;

  editor.addEventListener('input', updateStatusBar);
  editor.addEventListener('keyup', updateStatusBar);
  editor.addEventListener('click', updateStatusBar);
  editor.addEventListener('focus', updateStatusBar);

  // Initial update
  updateStatusBar();

  // View buttons: active state + wordWindow view class
  const viewIds = ['view-normal', 'view-web', 'view-print', 'view-outline'];
  viewIds.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('click', () => {
      viewIds.forEach((v) => document.getElementById(v)?.classList.remove('active'));
      el.classList.add('active');
      if (wordWindow) {
        wordWindow.classList.remove('view-print', 'view-web', 'view-outline');
        if (id === 'view-print') wordWindow.classList.add('view-print');
        if (id === 'view-web') wordWindow.classList.add('view-web');
        if (id === 'view-outline') wordWindow.classList.add('view-outline');
      }
    });
  });

  // Mode toggles (REC, TRK, EXT, OVR, WPH) – double-click to toggle active
  ['mode-rec', 'mode-trk', 'mode-ext', 'mode-ovr', 'mode-wph'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('dblclick', () => {
      el.classList.toggle('active');
    });
  });
})();
