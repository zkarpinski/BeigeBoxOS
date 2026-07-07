/**
 * Simple HTML sanitizer for Word 97 to prevent XSS.
 */
export function sanitizeHTML(html: string): string {
  if (!html) return '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Blacklist tags that are dangerous or unnecessary for a text editor
  const dangerousTags = [
    'script',
    'object',
    'embed',
    'iframe',
    'base',
    'link',
    'meta',
    'svg',
    'math',
    'form',
    'input',
    'button',
    'select',
    'textarea',
    'frame',
    'frameset',
    'video',
    'audio',
    'canvas',
    'applet',
  ];
  dangerousTags.forEach((tag) => {
    doc.querySelectorAll(tag).forEach((el) => el.remove());
  });

  doc.querySelectorAll('*').forEach((el) => {
    // Convert to array to avoid issues when removing attributes during iteration
    const attrs = Array.from(el.attributes);
    for (const attr of attrs) {
      const attrName = attr.name.toLowerCase();
      const value = attr.value.toLowerCase().replace(/\s/g, '');

      // Remove event handlers
      if (attrName.startsWith('on')) {
        el.removeAttribute(attr.name);
      }
      // Remove dangerous URI protocols from common attributes
      else if (
        ['href', 'src', 'action', 'formaction', 'background', 'xlink:href'].includes(attrName)
      ) {
        if (
          value.startsWith('javascript:') ||
          value.startsWith('data:') ||
          value.startsWith('vbscript:')
        ) {
          el.removeAttribute(attr.name);
        }
      }
      // Sanitize style attributes
      else if (attrName === 'style') {
        if (
          value.includes('url(') ||
          value.includes('expression(') ||
          value.includes('behavior:') ||
          value.includes('-moz-binding:')
        ) {
          el.removeAttribute(attr.name);
        }
      }
    }
  });

  return doc.body ? doc.body.innerHTML : '';
}
