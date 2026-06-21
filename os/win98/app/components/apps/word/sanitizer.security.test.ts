/**
 * Security-focused tests for Word 97 HTML sanitizer.
 */
import { sanitizeHTML } from './sanitizer';

describe('sanitizer security hardening', () => {
  test('blocks vbscript: protocol', () => {
    const html = '<a href="vbscript:msgbox(\'XSS\')">click</a>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('vbscript:');
    expect(out).not.toContain('href');
  });

  test('blocks obfuscated protocols with backslashes', () => {
    const html = '<a href="j\\av\\as\\cr\\ip\\t:alert(1)">click</a>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('href');
  });

  test('blocks additional dangerous tags', () => {
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
      const html = `<${tag}>dangerous</${tag}>`;
      const out = sanitizeHTML(html);
      expect(out).not.toContain(`<${tag}`);
    });
  });

  test('blocks background and xlink:href attributes with dangerous protocols', () => {
    const html =
      '<body background="javascript:alert(1)"><svg><use xlink:href="javascript:alert(2)" /></svg></body>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('background');
    expect(out).not.toContain('xlink:href');
    expect(out).not.toContain('javascript:');
  });

  test('blocks dangerous style properties like behavior and -moz-binding', () => {
    const html = '<div style="behavior: url(xss.htc); -moz-binding: url(xss.xml)">safe</div>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('style');
    expect(out).toContain('safe');
  });

  test('blocks obfuscated style properties with backslashes', () => {
    const html = '<div style="wid\\th: expr\\essi\\on(alert(1))">safe</div>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('style');
  });

  test('processes all attributes even when some are removed', () => {
    // This tests the Array.from(el.attributes) fix
    const html = '<img onmouseover="alert(1)" src="javascript:alert(2)" onclick="alert(3)">';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('onmouseover');
    expect(out).not.toContain('src');
    expect(out).not.toContain('onclick');
  });
});
