import { escapeHtml } from '../../utils/html';

describe('escapeHtml', () => {
  it('escapes special characters', () => {
    expect(escapeHtml('&')).toBe('&amp;');
    expect(escapeHtml('<')).toBe('&lt;');
    expect(escapeHtml('>')).toBe('&gt;');
    expect(escapeHtml('"')).toBe('&quot;');
    expect(escapeHtml("'")).toBe('&#039;');
  });

  it('escapes a complex string', () => {
    const input = '<script>alert("XSS & more");</script>';
    const expected = '&lt;script&gt;alert(&quot;XSS &amp; more&quot;);&lt;/script&gt;';
    expect(escapeHtml(input)).toBe(expected);
  });
});
