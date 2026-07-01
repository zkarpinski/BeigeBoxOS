/**
 * Security-focused unit tests for Word 97 HTML sanitizer.
 */
import { sanitizeHTML } from './sanitizer';

describe('sanitizer security hardening', () => {
  test('blocks additional dangerous tags', () => {
    const dangerousTags = [
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
      const html = `<${tag}>Should be removed</${tag}>`;
      const out = sanitizeHTML(html);
      expect(out).not.toContain(`<${tag}`);
    });
  });

  test('blocks vbscript: protocol', () => {
    const html = '<a href="vbscript:alert(1)">Click me</a>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('vbscript:');
    expect(out).toContain('Click me');
  });

  test('sanitizes background and xlink:href attributes', () => {
    const html =
      '<body background="javascript:alert(1)">' + '<use xlink:href="javascript:alert(1)"></use>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('javascript:');
    expect(out).not.toContain('background');
    expect(out).not.toContain('xlink:href');
  });

  test('blocks behavior and -moz-binding in style attribute', () => {
    const html =
      '<div style="behavior: url(xss.htc);">x</div>' +
      '<div style="-moz-binding: url(xss.xml);">y</div>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('behavior:');
    expect(out).not.toContain('-moz-binding:');
    expect(out).not.toContain('style');
  });

  test('handles whitespace in protocols correctly', () => {
    const html = '<a href=" java\nscript : alert(1) ">Link</a>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('href');
    expect(out).toContain('Link');
  });

  test('correctly handles live attribute collection mutation', () => {
    // This test ensures that when multiple malicious attributes are present,
    // all are removed even if the collection is being mutated.
    const html =
      '<div onclick="alert(1)" onmouseover="alert(2)" onmouseout="alert(3)">Target</div>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('onclick');
    expect(out).not.toContain('onmouseover');
    expect(out).not.toContain('onmouseout');
    expect(out).toContain('Target');
  });
});
