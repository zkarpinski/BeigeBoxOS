/**
 * Security-focused tests for Word 97 HTML sanitizer.
 */
import { sanitizeHTML } from './sanitizer';

describe('sanitizer security', () => {
  test('blocks new dangerous tags', () => {
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
      const html = `<${tag}>dangerous</${tag}>`;
      const out = sanitizeHTML(html);
      expect(out).not.toContain(`<${tag}`);
    });
  });

  test('blocks vbscript: protocol', () => {
    const html = '<a href="vbscript:msgbox(1)">click me</a>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('vbscript:');
  });

  test('blocks background and xlink:href attributes with malicious URLs', () => {
    const html =
      '<body background="javascript:alert(1)">' +
      '<svg><use xlink:href="javascript:alert(1)"></use></svg>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('javascript:');
  });

  test('blocks advanced CSS attacks in style attribute', () => {
    const html =
      '<div style="behavior: url(xss.htc);">behavior</div>' +
      '<div style="-moz-binding: url(xss.xml);">moz-binding</div>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('behavior:');
    expect(out).not.toContain('-moz-binding:');
  });

  test('handles attribute mutation bypasses', () => {
    // If the sanitizer iterates forward and removes an attribute,
    // it might skip the next one if it doesn't handle the live collection correctly.
    const html = '<img onerror="alert(1)" src="javascript:alert(2)" title="safe">';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('onerror');
    expect(out).not.toContain('javascript:');
    expect(out).toContain('title="safe"');
  });

  test('blocks nested dangerous tags', () => {
    const html =
      '<div><script>alert(1)</script><p><iframe src="javascript:alert(2)"></iframe></p></div>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('<script');
    expect(out).not.toContain('<iframe');
    expect(out).toContain('<div>');
    expect(out).toContain('<p>');
  });
});
