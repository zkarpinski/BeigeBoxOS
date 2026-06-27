/**
 * Unit tests for Word 97 HTML sanitizer.
 */
import { sanitizeHTML } from './sanitizer';

describe('sanitizer', () => {
  describe('sanitizeHTML', () => {
    test('returns empty string for empty input', () => {
      expect(sanitizeHTML('')).toBe('');
      expect(sanitizeHTML(null as unknown as string)).toBe('');
      expect(sanitizeHTML(undefined as unknown as string)).toBe('');
    });

    test('preserves safe HTML', () => {
      const html = '<p>Hello</p><a href="https://example.com">link</a>';
      const out = sanitizeHTML(html);
      expect(out).toContain('<p>Hello</p>');
      expect(out).toContain('href="https://example.com"');
    });

    test('removes script tags', () => {
      const html = '<p>OK</p><script>alert(1)</script><span>end</span>';
      const out = sanitizeHTML(html);
      expect(out).not.toContain('<script>');
      expect(out).not.toContain('alert(1)');
      expect(out).toContain('<p>OK</p>');
      expect(out).toContain('<span>end</span>');
    });

    test('removes dangerous tags', () => {
      const tags = [
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
      ];
      tags.forEach((tag) => {
        const html = `<p>before</p><${tag}>content</${tag}><p>after</p>`;
        const out = sanitizeHTML(html);
        expect(out).not.toContain(`<${tag}`);
        expect(out).toContain('<p>before</p>');
        expect(out).toContain('<p>after</p>');
      });
    });

    test('strips onclick and other event handlers from safe tags', () => {
      // Changed from <button> to <div> because <button> is now blocked
      const html = '<div onclick="alert(1)">Click</div><div onload="bad()">x</div>';
      const out = sanitizeHTML(html);
      expect(out).not.toContain('onclick');
      expect(out).not.toContain('onload');
      expect(out).toContain('Click');
    });

    test('strips javascript:, data:, and vbscript: URLs from sensitive attributes', () => {
      const html =
        '<a href="javascript:alert(1)">x</a>' +
        '<a href="data:text/html,<html>">y</a>' +
        '<a href="vbscript:msgbox(1)">v</a>' +
        '<img src="javascript:void(0)">' +
        '<img src="data:image/svg+xml,<svg onload=alert(1)>">' +
        '<div background="javascript:alert(1)">bg</div>' +
        '<a xlink:href="javascript:alert(1)">xlink</a>';

      const out = sanitizeHTML(html);
      expect(out).not.toContain('javascript:');
      expect(out).not.toContain('data:');
      expect(out).not.toContain('vbscript:');
    });

    test('sanitizes style attribute', () => {
      const html =
        '<div style="color: red">safe</div>' +
        '<div style="background-image: url(javascript:alert(1))">x</div>' +
        '<div style="width: expression(alert(1))">y</div>' +
        '<div style="behavior: url(#default#homepage)">b</div>' +
        '<div style="-moz-binding: url(x.xml#y)">m</div>';
      const out = sanitizeHTML(html);
      expect(out).not.toContain('url(');
      expect(out).not.toContain('expression(');
      expect(out).not.toContain('behavior');
      expect(out).not.toContain('-moz-binding');
      expect(out).toContain('color: red');
    });

    test('allows http and https URLs', () => {
      const html = '<a href="http://example.com">a</a><a href="https://safe.com">b</a>';
      const out = sanitizeHTML(html);
      expect(out).toContain('href="http://example.com"');
      expect(out).toContain('href="https://safe.com"');
    });

    test('returns body innerHTML only (no full document)', () => {
      const html = '<html><head><title>X</title></head><body><p>Y</p></body></html>';
      const out = sanitizeHTML(html);
      expect(out).not.toContain('<html>');
      expect(out).not.toContain('<head>');
      expect(out).toContain('<p>Y</p>');
    });

    test('correctly handles attribute removal with multiple attributes (iteration safety)', () => {
      // Test that removing one attribute doesn't cause the loop to skip others.
      const html = '<div onclick="a()" onmouseover="b()" onmouseout="c()">test</div>';
      const out = sanitizeHTML(html);
      expect(out).not.toContain('onclick');
      expect(out).not.toContain('onmouseover');
      expect(out).not.toContain('onmouseout');
      expect(out).toContain('test');
    });
  });
});
