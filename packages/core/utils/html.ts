/**
 * Escapes special characters for use in HTML to prevent XSS.
 * Note: React automatically escapes content in standard JSX text nodes.
 * Use this only when you must use dangerouslySetInnerHTML.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
