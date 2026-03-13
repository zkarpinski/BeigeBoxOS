/**
 * Simple HTML sanitizer for Word 97 to prevent XSS.
 */
(function () {
  'use strict';

  /**
   * Sanitizes an HTML string by removing scripts, event handlers, and javascript: URLs.
   * @param {string} html
   * @returns {string}
   */
  function sanitizeHTML(html) {
    if (!html) return '';

    const parser = new DOMParser();
    // Parse the HTML string
    const doc = parser.parseFromString(html, 'text/html');

    // Remove dangerous tags
    const dangerousTags = ['script', 'object', 'embed', 'iframe', 'base', 'link', 'meta'];
    dangerousTags.forEach(tag => {
      doc.querySelectorAll(tag).forEach(el => el.remove());
    });

    // Remove event handlers and javascript: URLs from all elements
    const allElements = doc.querySelectorAll('*');
    allElements.forEach(el => {
      const attrs = el.attributes;
      for (let i = attrs.length - 1; i >= 0; i--) {
        const attrName = attrs[i].name.toLowerCase();
        // Remove event handlers (onclick, onload, etc.)
        if (attrName.startsWith('on')) {
          el.removeAttribute(attrs[i].name);
        }
        // Remove javascript: URLs in common attributes
        else if (['href', 'src', 'action', 'formaction'].includes(attrName)) {
          const value = attrs[i].value.toLowerCase().replace(/\s/g, '');
          if (value.startsWith('javascript:')) {
            el.removeAttribute(attrs[i].name);
          }
        }
      }
    });

    // Return the sanitized body content
    return doc.body ? doc.body.innerHTML : '';
  }

  if (window.Word97) {
    window.Word97.sanitizeHTML = sanitizeHTML;
  } else {
    window.Word97 = { sanitizeHTML };
  }
})();
