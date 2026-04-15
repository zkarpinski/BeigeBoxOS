import { escapeHtml } from '../utils/html';

describe('escapeHtml', () => {
  it('escapes special characters', () => {
    expect(escapeHtml('&')).toBe('&amp;');
    expect(escapeHtml('<')).toBe('&lt;');
    expect(escapeHtml('>')).toBe('&gt;');
    expect(escapeHtml('"')).toBe('&quot;');
    expect(escapeHtml("'")).toBe('&#039;');
  });

  it('escapes a complex string', () => {
    const input = '<script>alert("XSS & fun");</script>';
    const expected = '&lt;script&gt;alert(&quot;XSS &amp; fun&quot;);&lt;/script&gt;';
    expect(escapeHtml(input)).toBe(expected);
  });

  it('leaves normal characters alone', () => {
    const input = 'Hello World 123!';
    expect(escapeHtml(input)).toBe(input);
  });
});
