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

    test('removes dangerous tags: object, embed, iframe, base, link, meta, svg, math, form, input, button, select, textarea, frame, frameset, video, audio, canvas, applet', () => {
      const html =
        '<object data="x"></object><embed src="y"><iframe src="z"></iframe><base href="/"><link rel="x"><meta http-equiv="refresh"><svg><script>alert(1)</script></svg><math><mi>x</mi></math>' +
        '<form action="x"><input type="text"><button>x</button><select><option>y</option></select><textarea>z</textarea></form>' +
        '<frame src="x"></frame><frameset><frame src="y"></frameset><video src="z"></video><audio src="a"></audio><canvas></canvas><applet code="x.class"></applet>';
      const out = sanitizeHTML(html);
      expect(out).not.toContain('<object');
      expect(out).not.toContain('<embed');
      expect(out).not.toContain('<iframe');
      expect(out).not.toContain('<base');
      expect(out).not.toContain('<link');
      expect(out).not.toContain('<meta');
      expect(out).not.toContain('<svg');
      expect(out).not.toContain('<math');
      expect(out).not.toContain('<form');
      expect(out).not.toContain('<input');
      expect(out).not.toContain('<button');
      expect(out).not.toContain('<select');
      expect(out).not.toContain('<textarea');
      expect(out).not.toContain('<frame');
      expect(out).not.toContain('<frameset');
      expect(out).not.toContain('<video');
      expect(out).not.toContain('<audio');
      expect(out).not.toContain('<canvas');
      expect(out).not.toContain('<applet');
    });

    test('strips event handlers', () => {
      const html = '<div onclick="alert(1)">Click</div><div onload="bad()">x</div>';
      const out = sanitizeHTML(html);
      expect(out).not.toContain('onclick');
      expect(out).not.toContain('onload');
      expect(out).toContain('Click');
    });

    test('strips multiple consecutive event handlers (regression test)', () => {
      const html = '<img onerror="alert(1)" onmouseover="alert(2)" onfocus="alert(3)">';
      const out = sanitizeHTML(html);
      expect(out).not.toContain('onerror');
      expect(out).not.toContain('onmouseover');
      expect(out).not.toContain('onfocus');
    });

    test('strips javascript:, data:, and vbscript: URLs from sensitive attributes', () => {
      const html =
        '<a href="javascript:alert(1)">x</a>' +
        '<a href="data:text/html,<html>">y</a>' +
        '<a href="vbscript:msgbox(1)">z</a>' +
        '<img src="javascript:void(0)">' +
        '<img src="data:image/svg+xml,<svg onload=alert(1)>">' +
        '<div background="javascript:alert(1)"></div>' +
        '<div xlink:href="javascript:alert(1)"></div>';
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
        '<div style="background: url(\'data:image/svg+xml,...\')">z</div>' +
        '<div style="behavior: url(#default#homepage)">w</div>' +
        '<div style="-moz-binding: url(x.xml#y)">v</div>';
      const out = sanitizeHTML(html);
      expect(out).not.toContain('url(');
      expect(out).not.toContain('expression(');
      expect(out).not.toContain('behavior:');
      expect(out).not.toContain('-moz-binding:');
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
