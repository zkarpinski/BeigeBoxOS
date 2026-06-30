/**
 * Security-focused unit tests for Word 97 HTML sanitizer.
 */
import { sanitizeHTML } from './sanitizer';

describe('sanitizer security', () => {
  test('removes newly added dangerous tags: form, input, button, select, textarea, frame, frameset, video, audio, canvas, applet', () => {
    const html =
      '<form action="x"></form><input value="y"><button>z</button><select><option>1</option></select><textarea>a</textarea><frame src="b"><frameset></frameset><video src="c"></video><audio src="d"></audio><canvas></canvas><applet code="e"></applet>';
    const out = sanitizeHTML(html);
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

  test('strips vbscript: URLs from sensitive attributes', () => {
    const html = '<a href="vbscript:msgbox(1)">x</a><img src="vbscript:alert(1)">';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('vbscript:');
  });

  test('strips javascript: and data: URLs from newly added attributes background and xlink:href', () => {
    const html =
      '<body background="javascript:alert(1)"></body><use xlink:href="javascript:alert(1)"></use>' +
      '<table background="data:text/html,x"></table>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('background=');
    expect(out).not.toContain('xlink:href=');
  });

  test('blocks behavior: and -moz-binding: in style attribute', () => {
    const html =
      '<div style="behavior: url(x.htc)">x</div><div style="-moz-binding: url(y.xml)">y</div>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('style=');
  });

  test('safely iterates through multiple malicious attributes', () => {
    // This tests the Array.from(el.attributes) refactor
    const html =
      '<div onclick="alert(1)" onmouseover="alert(2)" style="expression(alert(3))" href="javascript:alert(4)">x</div>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('onclick');
    expect(out).not.toContain('onmouseover');
    expect(out).not.toContain('style');
    expect(out).not.toContain('href');
  });
});
