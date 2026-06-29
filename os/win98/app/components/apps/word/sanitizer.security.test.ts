/**
 * Security focus unit tests for Word 97 HTML sanitizer.
 */
import { sanitizeHTML } from './sanitizer';

describe('sanitizer security', () => {
  test('blocks dangerous tags not in initial list', () => {
    const dangerous = [
      '<form action="http://evil.com">',
      '<input type="text" value="pwned">',
      '<button>Submit</button>',
      '<select><option>X</option></select>',
      '<textarea>bad</textarea>',
      '<frame src="evil.html">',
      '<frameset></frameset>',
      '<video src="evil.mp4"></video>',
      '<audio src="evil.mp3"></audio>',
      '<canvas></canvas>',
      '<applet code="Evil.class"></applet>',
    ];

    dangerous.forEach((tag) => {
      const out = sanitizeHTML(tag);
      expect(out).not.toContain(
        tag.substring(1, tag.indexOf(' ') > 0 ? tag.indexOf(' ') : tag.indexOf('>')),
      );
    });
  });

  test('blocks vbscript: protocol', () => {
    const html = '<a href="vbscript:msgbox(\'XSS\')">click</a>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('vbscript:');
  });

  test('blocks javascript: in background attribute', () => {
    const html = '<body background="javascript:alert(1)">';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('background=');
  });

  test('blocks xlink:href with javascript:', () => {
    // Note: SVG is blocked, but if someone finds a way to inject it, xlink:href should also be sanitized
    const html = '<svg><image xlink:href="javascript:alert(1)"></image></svg>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('javascript:');
  });

  test('blocks behavior and -moz-binding in style', () => {
    const html = '<div style="behavior: url(xss.htc); -moz-binding: url(xss.xml);"></div>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('behavior');
    expect(out).not.toContain('-moz-binding');
  });

  test('blocks url() with vbscript or data in style', () => {
    const html = '<div style="background: url(vbscript:alert(1))"></div>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('url(');
  });
});
