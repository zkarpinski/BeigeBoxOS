import { escapeHtml } from '../../utils/html';

describe('escapeHtml', () => {
  it('should escape special HTML characters', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;',
    );
    expect(escapeHtml('Hello & welcome')).toBe('Hello &amp; welcome');
    expect(escapeHtml("It's a trap")).toBe('It&#039;s a trap');
  });

  it('should handle empty strings', () => {
    expect(escapeHtml('')).toBe('');
  });

  it('should not escape already escaped characters (it is naive)', () => {
    expect(escapeHtml('&lt;')).toBe('&amp;lt;');
  });
});
