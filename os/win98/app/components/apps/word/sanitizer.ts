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
  ];
  dangerousTags.forEach((tag) => {
    doc.querySelectorAll(tag).forEach((el) => el.remove());
  });

  doc.querySelectorAll('*').forEach((el) => {
    const attrs = el.attributes;
    for (let i = attrs.length - 1; i >= 0; i--) {
      const attrName = attrs[i].name.toLowerCase();
      if (attrName.startsWith('on')) {
        el.removeAttribute(attrs[i].name);
      } else if (['href', 'src', 'action', 'formaction'].includes(attrName)) {
        const value = attrs[i].value.toLowerCase().replace(/\s/g, '');
        if (value.startsWith('javascript:') || value.startsWith('data:')) {
          el.removeAttribute(attrs[i].name);
        }
      } else if (attrName === 'style') {
        const value = attrs[i].value.toLowerCase();
        if (value.includes('url(') || value.includes('expression(')) {
          el.removeAttribute(attrs[i].name);
        }
      }
    }
  });

  return doc.body ? doc.body.innerHTML : '';
}
