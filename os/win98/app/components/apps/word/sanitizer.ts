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
    'template',
  ];
  dangerousTags.forEach((tag) => {
    doc.querySelectorAll(tag).forEach((el) => el.remove());
  });

  const uriAttrs = [
    'href',
    'src',
    'action',
    'formaction',
    'background',
    'xlink:href',
    'lowsrc',
    'dynsrc',
  ];

  doc.querySelectorAll('*').forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      const attrName = attr.name.toLowerCase();
      const value = attr.value.toLowerCase().replace(/\s/g, '');

      if (attrName.startsWith('on')) {
        el.removeAttribute(attr.name);
      } else if (uriAttrs.includes(attrName) || attrName.startsWith('data-')) {
        if (
          value.startsWith('javascript:') ||
          value.startsWith('data:') ||
          value.startsWith('vbscript:')
        ) {
          el.removeAttribute(attr.name);
        }
      } else if (attrName === 'style') {
        if (
          value.includes('url(') ||
          value.includes('expression(') ||
          value.includes('behavior:') ||
          value.includes('-moz-binding:') ||
          value.includes('vbscript:')
        ) {
          el.removeAttribute(attr.name);
        }
      }
    });
  });

  return doc.body ? doc.body.innerHTML : '';
}
