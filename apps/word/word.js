/**
 * Word 97 - Shared refs (editor, window). Used by toolbar and editor helpers.
 */
(function () {
  'use strict';

  const editor = document.getElementById('editor');
  const wordWindow = document.getElementById('word-window');

  window.Word97 = {
    editor,
    wordWindow,
  };
})();
