/**
 * HTML sanitizer for Word 97 to prevent XSS.
 * Removes executable scripts, dangerous HTML tags, inline event handlers,
 * and malicious URI schemes in attributes and style rules.
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
    const attrs = Array.from(el.attributes);
    for (let i = 0; i < attrs.length; i++) {
      const attrName = attrs[i].name.toLowerCase();
      const value = attrs[i].value.toLowerCase().replace(/\s/g, '');

      if (attrName.startsWith('on')) {
        el.removeAttribute(attrs[i].name);
      } else if (uriAttrs.includes(attrName) || attrName.startsWith('data-')) {
        if (
          value.startsWith('javascript:') ||
          value.startsWith('data:') ||
          value.startsWith('vbscript:')
        ) {
          el.removeAttribute(attrs[i].name);
        }
      } else if (attrName === 'style') {
        if (
          value.includes('url(') ||
          value.includes('expression(') ||
          value.includes('behavior:') ||
          value.includes('-moz-binding:') ||
          value.includes('vbscript:')
        ) {
          el.removeAttribute(attrs[i].name);
        }
      }
    }
  });

  return doc.body ? doc.body.innerHTML : '';
}
