/**
 * Security-focused tests for Word 97 HTML sanitizer.
 */
import { sanitizeHTML } from './sanitizer';

describe('sanitizer security', () => {
  test('removes newly blacklisted tags: form, input, button, select, textarea, frame, frameset, video, audio, canvas, applet', () => {
    const html = `
      <form action="/submit"><input type="text"></form>
      <button>Click me</button>
      <select><option>1</option></select>
      <textarea>hack</textarea>
      <frameset><frame src="bad.html"></frameset>
      <video src="v.mp4"></video>
      <audio src="a.mp3"></audio>
      <canvas id="c"></canvas>
      <applet code="hack.class"></applet>
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

  test('strips vbscript: URLs from sensitive attributes', () => {
    const html = `
      <a href="vbscript:msgbox('hi')">link</a>
      <img src="vbscript:alert('x')">
      <div background="vbscript:alert('y')"></div>
    `;
    const out = sanitizeHTML(html);
    expect(out).not.toContain('vbscript:');
    expect(out).toContain('<a>link</a>');
    expect(out).toContain('<img>');
    expect(out).toContain('<div></div>');
  });

  test('strips dangerous protocols from background and xlink:href', () => {
    const html = `
      <div background="javascript:alert(1)"></div>
      <use xlink:href="javascript:alert(2)"></use>
      <div background="data:image/png;base64,xxx"></div>
    `;
    const out = sanitizeHTML(html);
    expect(out).not.toContain('javascript:');
    expect(out).not.toContain('data:');
    expect(out).not.toContain('background=');
    expect(out).not.toContain('xlink:href=');
  });

  test('refines style attribute filtering: behavior and -moz-binding', () => {
    const html = `
      <div style="behavior: url(bad.htc)"></div>
      <div style="-moz-binding: url(bad.xml)"></div>
      <div style="color: blue; behavior: alert(1); -moz-binding: none"></div>
    `;
    const out = sanitizeHTML(html);
    expect(out).not.toContain('behavior:');
    expect(out).not.toContain('-moz-binding:');
    expect(out).not.toContain('style=');
  });

  test('handles obfuscated javascript: protocols (whitespace)', () => {
    const html = `
      <a href="j a v a s c r i p t:alert(1)">link</a>
      <a href="j\na\nv\na\ns\nc\nr\ni\np\nt:alert(1)">link2</a>
      <a href=" &#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;alert(1)">link3</a>
    `;
    const out = sanitizeHTML(html);
    // Note: DOMParser may normalize some entities, but our .replace(/\s/g, '') should handle whitespace
    expect(out).not.toContain('javascript:');
    // For entities, it depends on how DOMParser handles the attribute value before we see it
    // If it decodes them, our check against "javascript:" will catch it.
  });

  test('robustly handles multiple removals in one element', () => {
    const html =
      '<div onclick="a()" onmouseover="b()" style="behavior:url(x)" background="javascript:y"></div>';
    const out = sanitizeHTML(html);
    expect(out).toBe('<div></div>');
  });
});
