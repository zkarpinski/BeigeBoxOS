/**
 * HTML sanitizer for Word 97 to prevent XSS and malicious HTML injection.
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

  const urlAttrs = [
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
      const value = attr.value.toLowerCase().replace(/[\s\x00-\x20]/g, '');

      if (attrName.startsWith('on')) {
        el.removeAttribute(attr.name);
      } else if (urlAttrs.includes(attrName) || attrName.startsWith('data-')) {
        if (
          value.startsWith('javascript:') ||
          value.startsWith('vbscript:') ||
          value.startsWith('data:')
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
