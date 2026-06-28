/**
 * Security-focused unit tests for Word 97 HTML sanitizer.
 */
import { sanitizeHTML } from './sanitizer';

describe('sanitizer security', () => {
  test('removes newly blacklisted tags: form, input, button, select, textarea', () => {
    const html =
      '<form><input type="text"><button>Click</button><select><option>X</option></select><textarea></textarea></form>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('<form');
    expect(out).not.toContain('<input');
    expect(out).not.toContain('<button');
    expect(out).not.toContain('<select');
    expect(out).not.toContain('<textarea');
  });

  test('removes frame related tags: frame, frameset', () => {
    const html = '<frameset><frame src="x"></frameset>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('<frameset');
    expect(out).not.toContain('<frame');
  });

  test('removes media and drawing tags: video, audio, canvas, applet', () => {
    const html =
      '<video src="x"></video><audio src="y"></audio><canvas></canvas><applet code="z"></applet>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('<video');
    expect(out).not.toContain('<audio');
    expect(out).not.toContain('<canvas');
    expect(out).not.toContain('<applet');
  });

  test('strips vbscript: URLs', () => {
    const html = '<a href="vbscript:msgbox(1)">click</a><img src="vbscript:foo">';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('vbscript:');
  });

  test('sanitizes additional URL attributes: background, poster, xlink:href', () => {
    const html =
      '<div background="javascript:alert(1)"></div>' +
      '<video poster="javascript:alert(2)"></video>' +
      '<svg><use xlink:href="javascript:alert(3)"></use></svg>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('javascript:');
    // Note: video and svg/use are also removed by tag blacklist, but we check attribute stripping too
  });

  test('blocks behavior: and -moz-binding: in style attribute', () => {
    const html =
      '<div style="behavior: url(#default#download)"></div>' +
      '<div style="-moz-binding: url(x.xml)"></div>' +
      '<div style="color: blue; behavior: url(y)">z</div>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('behavior:');
    expect(out).not.toContain('-moz-binding:');
    expect(out).not.toContain('style'); // Should remove the whole style attribute if it contains blocked patterns
  });

  test('robustness: handles attribute removal during iteration', () => {
    // Some sanitizers fail if multiple attributes need removal because they iterate forward on a live collection
    const html = '<div onclick="a" onmouseover="b" style="behavior:url(c)" title="safe"></div>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('onclick');
    expect(out).not.toContain('onmouseover');
    expect(out).not.toContain('style');
    expect(out).toContain('title="safe"');
  });
});
