/**
 * Pure helpers for Word 97 editor (caret/selection).
 */
export function getCaretLineAndColumn(editor: HTMLElement): { line: number; col: number } {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return { line: 1, col: 1 };
  const range = sel.getRangeAt(0);
  const caretNode = range.startContainer;
  const caretOffset = range.startOffset;
  if (!editor.contains(caretNode) && caretNode !== editor) {
    return { line: 1, col: 1 };
  }
  const blockTags = /^(P|DIV|H[1-6]|LI|TR|BLOCKQUOTE|HR)$/i;
  const strParts: string[] = [];
  let hasContent = false;

  function traverse(node: Node, atBlockStart: boolean): boolean {
    if (node === caretNode) {
      if (node.nodeType === Node.TEXT_NODE) {
        strParts.push(node.textContent?.substring(0, caretOffset) ?? '');
        hasContent = true;
        return true;
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as Element;
        for (let i = 0; i < caretOffset && i < el.childNodes.length; i++) {
          if (traverse(el.childNodes[i], false)) return true;
        }
        return true;
      }
    }
    if (node.nodeType === Node.TEXT_NODE) {
      strParts.push(node.textContent ?? '');
      hasContent = true;
      return false;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return false;
    if ((node as Element).tagName === 'BR') {
      strParts.push('\n');
      hasContent = true;
      return false;
    }
    const isBlock = blockTags.test((node as Element).tagName);
    if (isBlock && !atBlockStart && hasContent) {
      strParts.push('\n');
    }
    const el = node as Element;
    for (let i = 0; i < el.childNodes.length; i++) {
      if (traverse(el.childNodes[i], isBlock)) return true;
    }
    return false;
  }

  traverse(editor, true);
  const str = strParts.join('');
  const lines = str.split('\n');
  const line = lines.length;
  const col = (lines[lines.length - 1] ?? '').length + 1;
  return { line, col };
}
