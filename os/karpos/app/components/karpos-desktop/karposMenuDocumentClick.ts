/**
 * Used by {@link KarposTaskbar} to decide if a document-level click should dismiss
 * the Applications menu. Prefer `Node.contains` + `composedPath()` over `Element.closest`
 * so Text targets, retargeting, and pointer-events quirks still count as "inside menu".
 */
export function shouldKeepMenuOpenOnDocumentClick(
  e: Pick<MouseEvent, 'target' | 'composedPath'>,
  menuEl: HTMLElement | null,
  startButtonEl: HTMLElement | null,
): boolean {
  const menu = menuEl;
  const startBtn = startButtonEl;

  const t = e.target;
  if (t instanceof Node) {
    if (menu?.contains(t)) return true;
    if (startBtn?.contains(t)) return true;
  }

  if (typeof e.composedPath === 'function') {
    for (const n of e.composedPath()) {
      if (n instanceof Node && menu?.contains(n)) return true;
      if (n instanceof Node && startBtn?.contains(n)) return true;
    }
  }

  return false;
}
