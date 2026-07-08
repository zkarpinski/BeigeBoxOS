import { sanitizeHTML } from './sanitizer';

describe('sanitizer security', () => {
  test('removes all blacklisted dangerous tags', () => {
    const dangerousTags = [
      'script',
      'object',
      'embed',
      'iframe',
      'base',
      'link',
      'meta',
      'svg',
      'math',
      'form',
      'input',
      'button',
      'select',
      'textarea',
      'frame',
      'frameset',
      'video',
      'audio',
      'canvas',
      'applet',
      'template',
    ];

    dangerousTags.forEach((tag) => {
      const html = `<p>before</p><${tag}>content</${tag}><p>after</p>`;
      const out = sanitizeHTML(html);
      // The tag itself should be gone.
      // Note: DOMParser might hoist text content out of some removed tags depending on how they are parsed,
      // but the important thing is the tag and its dangerous capabilities are gone.
      expect(out).not.toContain(`<${tag}`);
      expect(out).not.toContain(`</${tag}>`);
    });
  });

  test('strips vbscript: protocol from attributes', () => {
    const html = '<a href="vbscript:msgbox(1)">click</a><img src="vbscript:alert(1)">';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('vbscript:');
    expect(out).toContain('<a>click</a>');
  });

  test('strips background and xlink:href attributes', () => {
    const html =
      '<body background="javascript:alert(1)"><svg><use xlink:href="javascript:alert(1)"></use></svg></body>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('background=');
    expect(out).not.toContain('xlink:href=');
    // Note: svg is also blacklisted so the use tag will be gone anyway
    expect(out).not.toContain('<svg');
  });

  test('harden style attribute against various bypasses', () => {
    const bypasses = [
      'behavior: url(xss.htc)',
      '-moz-binding: url(xss.xml)',
      'background-image: url("vbscript:msgbox(1)")',
      'list-style-image: url("javascript:alert(1)")',
      'width: expression(alert(1))',
    ];

    bypasses.forEach((bypass) => {
      const html = `<div style='${bypass}'>content</div>`;
      const out = sanitizeHTML(html);
      expect(out).not.toContain('style=');
      // Use string matching that is less sensitive to how the parser handles broken attributes
      expect(out).toContain('content</div>');
      expect(out).not.toContain(bypass);
    });
  });

  test('handles live attribute collection mutation safely (multiple on* attributes)', () => {
    const html = '<div onclick="a()" onmouseover="b()" onmouseout="c()">content</div>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('onclick');
    expect(out).not.toContain('onmouseover');
    expect(out).not.toContain('onmouseout');
    expect(out).toBe('<div>content</div>');
  });

  test('blocks action and formaction even if tags were somehow preserved', () => {
    // Even if we missed form/button in the tag blacklist, the attribute blacklist should catch these
    const html = '<div action="javascript:alert(1)" formaction="javascript:alert(2)"></div>';
    const out = sanitizeHTML(html);
    expect(out).not.toContain('action=');
    expect(out).not.toContain('formaction=');
  });
});
