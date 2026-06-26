/**
 * Security-focused unit tests for Word 97 HTML sanitizer.
 */
import { sanitizeHTML } from './sanitizer';

describe('sanitizer security', () => {
  describe('sanitizeHTML', () => {
    test('removes advanced dangerous tags: form, input, button, select, textarea, frame, frameset, video, audio, canvas, applet', () => {
      const html =
        '<form action="x"><input type="text"><button>ok</button><select><option>1</option></select><textarea></textarea></form>' +
        '<frameset><frame src="x"></frameset>' +
        '<video src="v"></video><audio src="a"></audio><canvas></canvas><applet code="c"></applet>';
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
      const html = '<a href="vbscript:alert(1)">x</a>' + '<img src="vbscript:msgbox(1)">';
      const out = sanitizeHTML(html);
      expect(out).not.toContain('vbscript:');
    });

    test('sanitizes style attribute for advanced attacks', () => {
      const html =
        '<div style="behavior: url(#default#download)">x</div>' +
        '<div style="-moz-binding: url(http://ha.ckers.org/xssmoz.xml#xss)">y</div>';
      const out = sanitizeHTML(html);
      expect(out).not.toContain('behavior:');
      expect(out).not.toContain('-moz-binding:');
    });

    test('prevents attribute mutation bypass (stripping all attributes if multiple are malicious)', () => {
      // If we iterate forwards and remove attributes, we might skip some.
      const html = '<div onclick="alert(1)" onmouseover="alert(2)" onfocus="alert(3)">x</div>';
      const out = sanitizeHTML(html);
      expect(out).not.toContain('onclick');
      expect(out).not.toContain('onmouseover');
      expect(out).not.toContain('onfocus');
    });

    test('blocks xlink:href in SVG (though SVG is already blocked, this is depth)', () => {
      const html =
        '<svg><a xlink:href="javascript:alert(1)"><rect width="10" height="10"/></a></svg>';
      const out = sanitizeHTML(html);
      expect(out).not.toContain('xlink:href');
      expect(out).not.toContain('javascript:');
    });

    test('blocks background attribute with javascript/data URLs', () => {
      const html = '<table background="javascript:alert(1)"><tr><td>x</td></tr></table>';
      const out = sanitizeHTML(html);
      expect(out).not.toContain('background=');
    });
  });
});
