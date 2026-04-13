import { escapeHtml } from '../../utils/html';

describe('escapeHtml', () => {
  it('should escape HTML special characters', () => {
    expect(escapeHtml('&')).toBe('&amp;');
    expect(escapeHtml('<')).toBe('&lt;');
    expect(escapeHtml('>')).toBe('&gt;');
    expect(escapeHtml('"')).toBe('&quot;');
    expect(escapeHtml("'")).toBe('&#39;');
  });

  it('should escape a complex string', () => {
    const input = '<script>alert("XSS & more");</script>';
    const expected = '&lt;script&gt;alert(&quot;XSS &amp; more&quot;);&lt;/script&gt;';
    expect(escapeHtml(input)).toBe(expected);
  });

  it('should not escape normal characters', () => {
    const input = 'Hello World! 123';
    expect(escapeHtml(input)).toBe(input);
  });
});
