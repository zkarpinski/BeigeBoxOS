/**
 * Unit tests for Word 97 resume content and state persistence.
 */
import {
  DEFAULT_RESUME_HTML,
  loadWordState,
  saveWordState,
  clearWordState,
  hasMeaningfulContent,
} from './resumeContent';

const STORAGE_KEY = 'word97-state';

describe('resumeContent', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('DEFAULT_RESUME_HTML', () => {
    test('contains expected headings and content', () => {
      expect(DEFAULT_RESUME_HTML).toContain('Zachary Karpinski');
      expect(DEFAULT_RESUME_HTML).toContain('Professional Summary');
      expect(DEFAULT_RESUME_HTML).toContain('Work Experience');
      expect(DEFAULT_RESUME_HTML).toContain('Skills');
      expect(DEFAULT_RESUME_HTML).toContain('Education');
      expect(DEFAULT_RESUME_HTML).toContain('Certifications');
    });
  });

  describe('hasMeaningfulContent', () => {
    test('returns false for empty or whitespace', () => {
      expect(hasMeaningfulContent('')).toBe(false);
      expect(hasMeaningfulContent('   ')).toBe(false);
      expect(hasMeaningfulContent('\n\t')).toBe(false);
    });

    test('returns false for null or non-string', () => {
      expect(hasMeaningfulContent(null as unknown as string)).toBe(false);
      expect(hasMeaningfulContent(undefined as unknown as string)).toBe(false);
    });

    test('returns false for only HTML tags with no text', () => {
      expect(hasMeaningfulContent('<p></p>')).toBe(false);
      expect(hasMeaningfulContent('<p><br></p>')).toBe(false);
      expect(hasMeaningfulContent('  <div>  </div>  ')).toBe(false);
    });

    test('returns true when there is visible text', () => {
      expect(hasMeaningfulContent('hello')).toBe(true);
      expect(hasMeaningfulContent('<p>hello</p>')).toBe(true);
      expect(hasMeaningfulContent('<h1>Title</h1><p>Body</p>')).toBe(true);
    });
  });

  describe('loadWordState / saveWordState', () => {
    test('loadWordState returns null when nothing saved', () => {
      expect(loadWordState()).toBeNull();
    });

    test('save and load round-trip', () => {
      const content = '<p>Test content</p>';
      saveWordState(content);
      const state = loadWordState();
      expect(state).not.toBeNull();
      expect(state!.editorContent).toBe(content);
      expect(state!.stateVersion).toBe(2);
    });

    test('loadWordState returns null for old state version', () => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ stateVersion: 1, editorContent: '<p>old</p>' }),
      );
      expect(loadWordState()).toBeNull();
    });

    test('loadWordState returns null for invalid JSON', () => {
      localStorage.setItem(STORAGE_KEY, 'not json');
      expect(loadWordState()).toBeNull();
    });
  });

  describe('clearWordState', () => {
    test('removes saved state', () => {
      saveWordState('<p>x</p>');
      expect(loadWordState()).not.toBeNull();
      clearWordState();
      expect(loadWordState()).toBeNull();
    });

    test('is safe when nothing is stored', () => {
      expect(() => clearWordState()).not.toThrow();
    });
  });
});
