/**
 * Escapes HTML special characters in a string to prevent XSS.
 *
 * @param str The string to escape.
 * @returns The escaped string.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
