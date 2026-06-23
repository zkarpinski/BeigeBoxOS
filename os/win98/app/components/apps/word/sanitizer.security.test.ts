/**
 * Security-focused unit tests for Word 97 HTML sanitizer.
 */
import { sanitizeHTML } from './sanitizer';

describe('sanitizer security', () => {
  test('removes more dangerous tags: form, input, button, select, textarea, frame, video, audio, canvas, applet', () => {
    const html = `
      <form action="/"><input name="x"><button>Click</button></form>
      <select><option>1</option></select><textarea>foo</textarea>
      <frameset><frame src="x"></frameset>
      <video src="y"></video><audio src="z"></audio>
      <canvas id="c"></canvas><applet code="A.class"></applet>
    `;
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

  test('strips vbscript: URLs', () => {
    const html = '<a href="vbscript:msgbox(\'hi\')">Click me</a><img src="vbscript:something">';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('vbscript:');
  });

  test('strips dangerous protocols from background and xlink:href attributes', () => {
    const html = `
      <body background="javascript:alert(1)">
      <use xlink:href="javascript:alert(2)">
    `;
    const out = sanitizeHTML(html);
    expect(out).not.toContain('javascript:');
    expect(out).not.toContain('background');
    expect(out).not.toContain('xlink:href');
  });

  test('blocks more dangerous style properties: behavior, -moz-binding', () => {
    const html = `
      <div style="behavior: url(xss.htc)">x</div>
      <div style="-moz-binding: url(xss.xml#xss)">y</div>
    `;
    const out = sanitizeHTML(html);
    expect(out).not.toContain('style');
    expect(out).not.toContain('behavior');
    expect(out).not.toContain('-moz-binding');
  });

  test('is robust against attribute modification during iteration', () => {
    // Some sanitizers miss attributes if they remove them while iterating forward
    const html = '<img src="javascript:alert(1)" onerror="alert(2)" onclick="alert(3)">';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('javascript:');
    expect(out).not.toContain('onerror');
    expect(out).not.toContain('onclick');
    expect(out).not.toContain('src');
  });
});
