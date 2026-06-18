/**
 * Security-focused unit tests for Word 97 HTML sanitizer.
 */
import { sanitizeHTML } from './sanitizer';

describe('sanitizer security', () => {
  test('removes newly blocked dangerous tags', () => {
    const tags = [
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
    tags.forEach((tag) => {
      const html = `<p>before</p><${tag}>content</${tag}><p>after</p>`;
      const out = sanitizeHTML(html);
      expect(out).not.toContain(`<${tag}`);
      expect(out).toContain('before');
      expect(out).toContain('after');
    });
  });

  test('strips vbscript: URLs', () => {
    const html = '<a href="vbscript:msgbox(1)">x</a><img src="vbscript:alert(1)">';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('vbscript:');
  });

  test('strips dangerous attributes: background and xlink:href', () => {
    const html =
      '<body background="javascript:alert(1)"><svg><image xlink:href="javascript:alert(1)"></image></svg></body>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('background');
    expect(out).not.toContain('xlink:href');
    expect(out).not.toContain('javascript:');
  });

  test('blocks action and formaction with dangerous schemes', () => {
    // Note: form and button tags are now completely removed, but we test the attribute logic specifically if it were on other tags
    const html = '<div action="javascript:alert(1)" formaction="data:text/html,x"></div>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('action');
    expect(out).not.toContain('formaction');
  });

  test('sanitizes style attribute for IE-specific attacks', () => {
    const html =
      '<div style="behavior: url(x.htc)">behavior</div>' +
      '<div style="-moz-binding: url(x.xml)">binding</div>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('behavior:');
    expect(out).not.toContain('-moz-binding:');
    expect(out).toContain('behavior');
    expect(out).toContain('binding');
  });

  test('robustly handles attribute mutation during sanitization', () => {
    // If the sanitizer were not using Array.from, it might skip the second malicious attribute
    const html = '<div onclick="alert(1)" onmouseover="alert(2)" title="safe"></div>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('onclick');
    expect(out).not.toContain('onmouseover');
    expect(out).toContain('title="safe"');
  });
});
