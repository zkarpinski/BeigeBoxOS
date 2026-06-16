/**
 * Security-focused unit tests for Word 97 HTML sanitizer.
 */
import { sanitizeHTML } from './sanitizer';

describe('sanitizer security hardening', () => {
  test('blocks vbscript: protocol', () => {
    const html = '<a href="vbscript:msgbox(1)">Click me</a>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('vbscript:');
  });

  test('blocks more dangerous tags', () => {
    const tags = [
      'form',
      'input',
      'button',
      'select',
      'textarea',
      'applet',
      'video',
      'audio',
      'canvas',
      'frame',
      'frameset',
    ];
    tags.forEach((tag) => {
      const html = `<${tag}>test</${tag}>`;
      const out = sanitizeHTML(html);
      expect(out).not.toContain(`<${tag}`);
    });
  });

  test('blocks advanced style-based XSS', () => {
    const payloads = [
      '<div style="behavior: url(xss.htc);"></div>',
      '<div style="-moz-binding: url(xss.xml#xss);"></div>',
      '<div style="background: url(&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;&#97;&#108;&#101;&#114;&#116;&#40;&#49;&#41;)"></div>',
    ];
    payloads.forEach((payload) => {
      const out = sanitizeHTML(payload);
      expect(out).not.toContain('behavior');
      expect(out).not.toContain('-moz-binding');
      expect(out).not.toContain('url(');
    });
  });

  test('handles attribute mutation bypasses correctly', () => {
    // If the sanitizer uses a live collection incorrectly, it might skip attributes
    const html = '<img src="javascript:alert(1)" onmouseover="alert(2)" title="safe">';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('javascript:');
    expect(out).not.toContain('onmouseover');
    expect(out).toContain('title="safe"');
  });

  test('blocks xlink:href in SVG (though SVG is already blocked, testing attribute check)', () => {
    const html = '<a xlink:href="javascript:alert(1)">click</a>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('javascript:');
  });
});
