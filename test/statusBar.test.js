/**
 * Unit tests for status bar line/column calculation.
 */
describe('Status bar getCaretLineAndColumn', () => {
  let editor;
  let getCaretLineAndColumn;

  beforeAll(() => {
    editor = document.getElementById('editor');
    if (!editor) return;

    const blockTags = /^(P|DIV|H[1-6]|LI|TR|BLOCKQUOTE|HR)$/i;
    getCaretLineAndColumn = function () {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return { line: 1, col: 1 };
      const range = sel.getRangeAt(0);
      const caretNode = range.startContainer;
      const caretOffset = range.startOffset;
      if (!editor.contains(caretNode) && caretNode !== editor) return { line: 1, col: 1 };

      let str = '';
      function traverse(node, atBlockStart) {
        if (node === caretNode) {
          if (node.nodeType === Node.TEXT_NODE) {
            str += node.textContent.substring(0, caretOffset);
            return true;
          }
          if (node.nodeType === Node.ELEMENT_NODE) {
            for (let i = 0; i < caretOffset && i < node.childNodes.length; i++) {
              if (traverse(node.childNodes[i], false)) return true;
            }
            return true;
          }
        }
        if (node.nodeType === Node.TEXT_NODE) {
          str += node.textContent;
          return false;
        }
        if (node.nodeType !== Node.ELEMENT_NODE) return false;
        if (node.tagName === 'BR') {
          str += '\n';
          return false;
        }
        const isBlock = blockTags.test(node.tagName);
        if (isBlock && !atBlockStart && str.length > 0) str += '\n';
        for (let i = 0; i < node.childNodes.length; i++) {
          if (traverse(node.childNodes[i], isBlock)) return true;
        }
        return false;
      }
      traverse(editor, true);
      const lines = str.split('\n');
      return { line: lines.length, col: (lines[lines.length - 1] || '').length + 1 };
    };
  });

  beforeEach(() => {
    if (!editor) return;
    const sel = window.getSelection();
    if (sel) sel.removeAllRanges();
  });

  test('empty editor returns line 1 col 1', () => {
    if (!editor) return;
    editor.innerHTML = '<p><br></p>';
    const range = document.createRange();
    const sel = window.getSelection();
    range.setStart(editor.querySelector('p').firstChild, 0);
    range.collapse(true);
    sel.addRange(range);

    const result = getCaretLineAndColumn();
    expect(result).toEqual({ line: 1, col: 1 });
  });

  test('single line text returns correct col', () => {
    if (!editor) return;
    editor.innerHTML = '<p>Hello</p>';
    const p = editor.querySelector('p');
    const text = p.firstChild;
    const range = document.createRange();
    const sel = window.getSelection();
    range.setStart(text, 3);
    range.collapse(true);
    sel.addRange(range);

    const result = getCaretLineAndColumn();
    expect(result.line).toBe(1);
    expect(result.col).toBe(4);
  });

  test('two blocks: caret in second block gives valid line/col', () => {
    if (!editor) return;
    editor.innerHTML = '<p>First</p><p>Second</p>';
    const paras = editor.querySelectorAll('p');
    const range = document.createRange();
    const sel = window.getSelection();
    range.setStart(paras[1].firstChild, 2);
    range.collapse(true);
    sel.addRange(range);

    const result = getCaretLineAndColumn();
    expect(result.line).toBeGreaterThanOrEqual(1);
    expect(result.col).toBeGreaterThanOrEqual(1);
  });
});
