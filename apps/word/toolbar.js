/**
 * Word 97 - Standard and formatting toolbar (from word branch, adapted for main DOM).
 */
(function () {
  'use strict';

  const { editor, exec, sanitizeHTML } = window.Word97 || {};
  if (!editor || !exec) return;

  const updateStatusBar = window.Word97 && window.Word97.updateStatusBar;

  // --- Standard toolbar ---
  document.getElementById('cmd-new')?.addEventListener('click', () => {
    if (editor.innerHTML.trim() && !confirm('Do you want to save changes to Document1?')) return;
    editor.innerHTML = '<p><br></p>';
    editor.focus();
    if (updateStatusBar) updateStatusBar();
  });

  document.getElementById('cmd-open')?.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.html,.doc,.rtf';
    input.onchange = (e) => {
      const f = e.target.files?.[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        const text = r.result;
        const isHtml = /<(?:\w+|!\s*DOCTYPE|!\s*--)/i.test(text);
        if (isHtml) {
          editor.innerHTML = sanitizeHTML ? sanitizeHTML(text) : text;
        } else {
          editor.innerText = text;
        }
        if (updateStatusBar) updateStatusBar();
      };
      r.readAsText(f);
    };
    input.click();
  });

  function buildWordDocHtml(bodyContent) {
    return [
      '<!DOCTYPE html>',
      '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">',
      '<head><meta charset="utf-8"><title>Document1</title></head>',
      '<body>',
      bodyContent,
      '</body>',
      '</html>'
    ].join('');
  }

  function saveAsDoc() {
    const docHtml = buildWordDocHtml(editor.innerHTML);
    const blob = new Blob(['\ufeff' + docHtml], { type: 'application/msword;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'Document1.doc';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  if (window.Word97) window.Word97.saveAsDoc = saveAsDoc;

  document.getElementById('cmd-save')?.addEventListener('click', saveAsDoc);

  document.getElementById('cmd-print')?.addEventListener('click', () => window.print());
  document.getElementById('cmd-preview')?.addEventListener('click', () => window.print());

  document.getElementById('cmd-cut')?.addEventListener('click', () => exec('cut'));
  document.getElementById('cmd-copy')?.addEventListener('click', () => exec('copy'));
  document.getElementById('cmd-paste')?.addEventListener('click', () => exec('paste'));
  document.getElementById('cmd-format-painter')?.addEventListener('click', () => exec('copy'));
  document.getElementById('cmd-undo')?.addEventListener('click', () => exec('undo'));
  document.getElementById('cmd-redo')?.addEventListener('click', () => exec('redo'));
  document.getElementById('cmd-spelling')?.addEventListener('click', () => editor.focus());
  document.getElementById('cmd-hyperlink')?.addEventListener('click', () => {
    const url = prompt('Enter URL:');
    if (url) {
      const trimmed = url.trim();
      if (/^https?:\/\//i.test(trimmed)) {
        exec('createLink', trimmed);
      } else {
        alert('URL must start with http:// or https://');
      }
    }
  });
  document.getElementById('cmd-table')?.addEventListener('click', () => {
    const rows = prompt('Number of rows:', '3');
    const cols = prompt('Number of columns:', '3');
    if (rows && cols) {
      let html = '<table border="1" style="border-collapse:collapse;width:100%">';
      for (let r = 0; r < parseInt(rows, 10); r++) {
        html += '<tr>';
        for (let c = 0; c < parseInt(cols, 10); c++) html += '<td>&nbsp;</td>';
        html += '</tr>';
      }
      html += '</table>';
      exec('insertHTML', html);
    }
  });

  document.getElementById('zoom-select')?.addEventListener('change', (e) => {
    const pct = e.target.value;
    const zoomTarget = document.querySelector('.workspace-area') || document.querySelector('.editor-container');
    if (zoomTarget) zoomTarget.style.zoom = pct + '%';
  });

  document.getElementById('cmd-help')?.addEventListener('click', () => editor.focus());

  // --- Formatting toolbar ---
  document.getElementById('cmd-bold')?.addEventListener('click', () => exec('bold'));
  document.getElementById('cmd-italic')?.addEventListener('click', () => exec('italic'));
  document.getElementById('cmd-underline')?.addEventListener('click', () => exec('underline'));
  document.getElementById('cmd-align-left')?.addEventListener('click', () => exec('justifyLeft'));
  document.getElementById('cmd-align-center')?.addEventListener('click', () => exec('justifyCenter'));
  document.getElementById('cmd-align-right')?.addEventListener('click', () => exec('justifyRight'));
  document.getElementById('cmd-justify')?.addEventListener('click', () => exec('justifyFull'));
  document.getElementById('cmd-numbering')?.addEventListener('click', () => exec('insertOrderedList'));
  document.getElementById('cmd-bullets')?.addEventListener('click', () => exec('insertUnorderedList'));
  document.getElementById('cmd-indent-increase')?.addEventListener('click', () => exec('indent'));
  document.getElementById('cmd-indent-decrease')?.addEventListener('click', () => exec('outdent'));

  document.getElementById('font-select')?.addEventListener('change', (e) => exec('fontName', e.target.value));

  const fontSizes = { 8: 1, 9: 2, 10: 3, 11: 3, 12: 4, 14: 4, 16: 5, 18: 5, 24: 6 };
  document.getElementById('font-size-select')?.addEventListener('change', (e) => {
    const size = fontSizes[parseInt(e.target.value, 10)] || 3;
    exec('fontSize', String(size));
  });

  document.getElementById('style-select')?.addEventListener('change', (e) => {
    const v = e.target.value;
    if (v === 'Heading 1') exec('formatBlock', 'h1');
    else if (v === 'Heading 2') exec('formatBlock', 'h2');
    else exec('formatBlock', 'p');
  });

  document.getElementById('cmd-font-color')?.addEventListener('click', () => {
    const color = prompt('Color (e.g. #0000ff or red):', '#0000ff');
    if (color) exec('foreColor', color);
  });
})();
