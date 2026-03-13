/**
 * Word 97 - Editor helpers (execCommand, selection).
 */
(function () {
  'use strict';

  const { editor } = window.Word97 || {};
  if (!editor) return;

  function exec(cmd, value) {
    document.execCommand(cmd, false, value == null ? null : value);
    editor.focus();
  }

  function getSelectionOrDocument() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) return sel.getRangeAt(0);
    return null;
  }

  window.Word97.exec = exec;
  window.Word97.getSelectionOrDocument = getSelectionOrDocument;
})();
