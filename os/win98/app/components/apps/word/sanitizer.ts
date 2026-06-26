/**
 * Simple HTML sanitizer for Word 97 to prevent XSS.
 */
export function sanitizeHTML(html: string): string {
  if (!html) return '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

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
    // Convert to array to avoid issues with live NamedNodeMap during mutation
    Array.from(el.attributes).forEach((attr) => {
      const attrName = attr.name.toLowerCase();
      const value = attr.value.toLowerCase().replace(/\s/g, '');

      // Block all event handlers
      if (attrName.startsWith('on')) {
        el.removeAttribute(attr.name);
        return;
      }

      // Block dangerous URL schemes in common attributes
      if (['href', 'src', 'action', 'formaction', 'background', 'xlink:href'].includes(attrName)) {
        if (
          value.startsWith('javascript:') ||
          value.startsWith('data:') ||
          value.startsWith('vbscript:')
        ) {
          el.removeAttribute(attr.name);
          return;
        }
      }

      // Block dangerous style patterns
      if (attrName === 'style') {
        if (
          value.includes('url(') ||
          value.includes('expression(') ||
          value.includes('behavior:') ||
          value.includes('-moz-binding:')
        ) {
          el.removeAttribute(attr.name);
        }
      }
    });
  });

  return doc.body ? doc.body.innerHTML : '';
}
