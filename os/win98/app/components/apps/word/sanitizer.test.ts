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

    test('removes dangerous tags: object, embed, iframe, base, link, meta, svg, math, style, etc.', () => {
      const html =
        '<object data="x"></object><embed src="y"><iframe src="z"></iframe><base href="/"><link rel="x"><meta http-equiv="refresh">' +
        '<svg><circle cx="50" cy="50" r="40" /></svg><math><mi>x</mi></math><style>body { color: red; }</style>' +
        '<form action="/test"><input name="q"></form><applet code="X.class"></applet><canvas></canvas><video></video><audio></audio><details></details>';
      const out = sanitizeHTML(html);
      expect(out).not.toContain('<object');
      expect(out).not.toContain('<embed');
      expect(out).not.toContain('<iframe');
      expect(out).not.toContain('<base');
      expect(out).not.toContain('<link');
      expect(out).not.toContain('<meta');
      expect(out).not.toContain('<svg');
      expect(out).not.toContain('<math');
      expect(out).not.toContain('<style');
      expect(out).not.toContain('<form');
      expect(out).not.toContain('<applet');
      expect(out).not.toContain('<canvas');
      expect(out).not.toContain('<video');
      expect(out).not.toContain('<audio');
      expect(out).not.toContain('<details');
    });

    test('strips onclick and other event handlers', () => {
      const html = '<button onclick="alert(1)">Click</button><div onload="bad()">x</div>';
      const out = sanitizeHTML(html);
      expect(out).not.toContain('onclick');
      expect(out).not.toContain('onload');
      expect(out).toContain('Click');
    });

    test('strips javascript: URLs from href', () => {
      const html = '<a href="javascript:alert(1)">x</a>';
      const out = sanitizeHTML(html);
      expect(out).not.toMatch(/href="javascript:/i);
      expect(out).toContain('<a');
    });

    test('strips javascript: URLs from src', () => {
      const html = '<img src="javascript:void(0)">';
      const out = sanitizeHTML(html);
      expect(out).not.toMatch(/src="javascript:/i);
    });

    test('allows http and https URLs', () => {
      const html = '<a href="http://example.com">a</a><a href="https://safe.com">b</a>';
      const out = sanitizeHTML(html);
      expect(out).toContain('href="http://example.com"');
      expect(out).toContain('href="https://safe.com"');
    });

    test('strips malicious style attributes', () => {
      const html =
        '<div style="color: blue; background-image: url(javascript:alert(1))">1</div>' +
        '<div style="width: expression(alert(1))">2</div>' +
        '<div style="-moz-binding: url(xss.xml#xss)">3</div>';
      const out = sanitizeHTML(html);
      expect(out).not.toContain('style');
      expect(out).toContain('<div>1</div>');
      expect(out).toContain('<div>2</div>');
      expect(out).toContain('<div>3</div>');
    });

    test('allows safe style attributes', () => {
      const html = '<div style="color: blue; font-weight: bold;">Safe</div>';
      const out = sanitizeHTML(html);
      expect(out).toContain('style="color: blue; font-weight: bold;"');
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
