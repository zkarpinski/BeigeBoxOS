/**
 * Security-focused unit tests for Word 97 HTML sanitizer.
 */
import { sanitizeHTML } from './sanitizer';

describe('sanitizer security', () => {
  test('strips vbscript: URLs', () => {
    const html = '<a href="vbscript:msgbox(1)">click me</a><img src="vbscript:alert(1)">';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('vbscript:');
  });

  test('removes more dangerous tags: form, input, button, select, textarea, frame, frameset', () => {
    const html = `
      <form action="/search"><input name="q"></form>
      <button onclick="alert(1)">Submit</button>
      <select><option>1</option></select>
      <textarea>bad</textarea>
      <frameset><frame src="javascript:alert(1)"></frameset>
    `;
    const out = sanitizeHTML(html);
    expect(out).not.toContain('<form');
    expect(out).not.toContain('<input');
    expect(out).not.toContain('<button');
    expect(out).not.toContain('<select');
    expect(out).not.toContain('<textarea');
    expect(out).not.toContain('<frame');
    expect(out).not.toContain('<frameset');
  });

  test('removes media and graphics tags: video, audio, canvas, applet', () => {
    const html =
      '<video src="v.mp4"></video><audio src="a.mp3"></audio><canvas></canvas><applet code="x.class"></applet>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('<video');
    expect(out).not.toContain('<audio');
    expect(out).not.toContain('<canvas');
    expect(out).not.toContain('<applet');
  });

  test('sanitizes background and xlink:href attributes', () => {
    const html =
      '<div background="javascript:alert(1)"></div><a xlink:href="javascript:alert(1)">x</a>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('javascript:');
    expect(out).not.toContain('background=');
    expect(out).not.toContain('xlink:href=');
  });

  test('blocks behavior and -moz-binding in style', () => {
    const html = '<div style="behavior: url(xss.htc); -moz-binding: url(xss.xml);"></div>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('behavior:');
    expect(out).not.toContain('-moz-binding:');
    expect(out).not.toContain('style=');
  });

  test('handles attribute mutation bypass (Array.from)', () => {
    // If iterating over a live NamedNodeMap while removing items, some might be skipped.
    const html = '<img onerror="alert(1)" src="javascript:alert(2)" title="safe">';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('onerror');
    expect(out).not.toContain('javascript:');
    expect(out).toContain('title="safe"');
  });
});
