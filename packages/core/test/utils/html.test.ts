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
    const input = '<script>alert("xss & stuff")</script>';
    const expected = '&lt;script&gt;alert(&quot;xss &amp; stuff&quot;)&lt;/script&gt;';
    expect(escapeHtml(input)).toBe(expected);
  });

  it('handles empty strings', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('handles non-string inputs gracefully', () => {
    // @ts-ignore
    expect(escapeHtml(null)).toBe('');
    // @ts-ignore
    expect(escapeHtml(undefined)).toBe('');
  });
});
