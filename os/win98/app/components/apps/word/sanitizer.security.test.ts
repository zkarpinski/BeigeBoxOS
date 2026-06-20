/**
 * Exhaustive security tests for Word 97 HTML sanitizer.
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
      const html = `<${tag}>dangerous content</${tag}>`;
      const out = sanitizeHTML(html);
      expect(out).not.toContain(`<${tag}`);
      expect(out).not.toContain(`</${tag}`);
    });
  });

  test('blocks vbscript: URI scheme', () => {
    const html = '<a href="vbscript:msgbox(\'XSS\')">click me</a>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('vbscript:');
    expect(out).not.toContain('href');
  });

  test('blocks dangerous URLs in background and xlink:href', () => {
    const html =
      '<body background="javascript:alert(1)">' +
      '<svg><use xlink:href="javascript:alert(1)"></use></svg>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('background');
    expect(out).not.toContain('xlink:href');
    expect(out).not.toContain('javascript:');
  });

  test('blocks behavior and -moz-binding in style attributes', () => {
    const html =
      '<div style="behavior: url(xss.htc);">x</div>' +
      '<div style="-moz-binding: url(xss.xml#xss);">y</div>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('style');
    expect(out).not.toContain('behavior:');
    expect(out).not.toContain('-moz-binding:');
  });

  test('handles mutated attribute collection correctly (refactored to Array.from)', () => {
    // If we iterate forward and remove attributes, we might skip some.
    // This test ensures all malicious attributes are removed even if they are adjacent.
    const html =
      '<p onclick="alert(1)" onmouseover="alert(2)" style="expression(alert(3))">test</p>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('onclick');
    expect(out).not.toContain('onmouseover');
    expect(out).not.toContain('style');
  });

  test('removes all "on" prefixed attributes', () => {
    const html =
      '<img src="valid.png" onerror="alert(1)" onmouseenter="alert(2)" onfocus="alert(3)">';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('onerror');
    expect(out).not.toContain('onmouseenter');
    expect(out).not.toContain('onfocus');
    expect(out).toContain('src="valid.png"');
  });

  test('blocks javascript: with whitespace or case variations', () => {
    const html =
      '<a href=" j a v a s c r i p t : alert(1)">1</a>' +
      '<a href="JAVAscript:alert(2)">2</a>' +
      '<a href="javascript\n:alert(3)">3</a>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('href');
    expect(out).not.toContain('javascript');
  });
});
