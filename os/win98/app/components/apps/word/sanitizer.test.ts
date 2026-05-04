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
      expect(sanitizeHTML(html)).toContain('<p>Hello</p>');
      expect(sanitizeHTML(html)).toContain('href="https://example.com"');
    });

    test('removes script tags', () => {
      const html = '<p>OK</p><script>alert(1)</script><span>end</span>';
      const out = sanitizeHTML(html);
      expect(out).not.toContain('<script>');
      expect(out).not.toContain('alert(1)');
      expect(out).toContain('<p>OK</p>');
      expect(out).toContain('<span>end</span>');
    });

    test('removes dangerous tags: object, embed, iframe, base, link, meta, svg, math', () => {
      const html =
        '<object data="x"></object><embed src="y"><iframe src="z"></iframe><base href="/"><link rel="x"><meta http-equiv="refresh"><svg><script>alert(1)</script></svg><math><mi>x</mi></math>';
      const out = sanitizeHTML(html);
      expect(out).not.toContain('<object');
      expect(out).not.toContain('<embed');
      expect(out).not.toContain('<iframe');
      expect(out).not.toContain('<base');
      expect(out).not.toContain('<link');
      expect(out).not.toContain('<meta');
      expect(out).not.toContain('<svg');
      expect(out).not.toContain('<math');
    });

    test('strips onclick and other event handlers', () => {
      const html = '<button onclick="alert(1)">Click</button><div onload="bad()">x</div>';
      const out = sanitizeHTML(html);
      expect(out).not.toContain('onclick');
      expect(out).not.toContain('onload');
      expect(out).toContain('Click');
    });

    test('strips javascript: and data: URLs from sensitive attributes', () => {
      const html =
        '<a href="javascript:alert(1)">x</a>' +
        '<a href="data:text/html,<html>">y</a>' +
        '<img src="javascript:void(0)">' +
        '<img src="data:image/svg+xml,<svg onload=alert(1)>">' +
        '<form action="javascript:alert(1)">' +
        '<button formaction="javascript:alert(1)">';
      const out = sanitizeHTML(html);
      expect(out).not.toContain('javascript:');
      expect(out).not.toContain('data:');
    });

    test('sanitizes style attribute', () => {
      const html =
        '<div style="color: red">safe</div>' +
        '<div style="background-image: url(javascript:alert(1))">x</div>' +
        '<div style="width: expression(alert(1))">y</div>' +
        '<div style="background: url(\'data:image/svg+xml,...\')">z</div>';
      const out = sanitizeHTML(html);
      expect(out).not.toContain('url(');
      expect(out).not.toContain('expression(');
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
  });
});
