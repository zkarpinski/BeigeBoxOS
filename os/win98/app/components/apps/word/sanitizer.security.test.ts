/**
 * Security-focused unit tests for Word 97 HTML sanitizer.
 */
import { sanitizeHTML } from './sanitizer';

describe('sanitizer security', () => {
  test('blocks new dangerous tags', () => {
    const html =
      '<form action="/sub"><input name="x"><button>Click</button><select><option>1</option></select><textarea></textarea></form>' +
      '<frame src="a"><frameset><frame src="b"></frameset>' +
      '<video src="c"></video><audio src="d"></audio><canvas></canvas><applet code="e"></applet>';
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

  test('blocks vbscript: protocol', () => {
    const html = '<a href="vbscript:msgbox(1)">Click me</a><img src="vbscript:alert(1)">';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('vbscript:');
  });

  test('blocks dangerous style patterns (behavior, -moz-binding)', () => {
    const html =
      '<div style="behavior: url(xss.htc)">x</div>' +
      '<div style="-moz-binding: url(xss.xml)">y</div>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('behavior:');
    expect(out).not.toContain('-moz-binding:');
  });

  test('blocks javascript: in background attribute', () => {
    const html = '<body background="javascript:alert(1)">';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('background=');
  });

  test('blocks javascript: in xlink:href attribute', () => {
    const html = '<use xlink:href="javascript:alert(1)"></use>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('xlink:href=');
  });

  test('ensures all attributes are processed when multiple malicious attributes exist', () => {
    const html = '<img src="javascript:alert(1)" onerror="alert(2)" onclick="alert(3)">';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('src=');
    expect(out).not.toContain('onerror=');
    expect(out).not.toContain('onclick=');
  });
});
