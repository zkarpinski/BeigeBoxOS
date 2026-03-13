/**
 * Unit tests for Word97 editor and exec helper.
 */
describe('Word97 editor', () => {
  beforeAll(() => {
    if (!document.getElementById('editor')) {
      const wrap = document.createElement('div');
      wrap.id = 'word-window';
      const ed = document.createElement('div');
      ed.id = 'editor';
      ed.contentEditable = 'true';
      wrap.appendChild(ed);
      document.body.appendChild(wrap);
    }
    require('../apps/word/word.js');
    require('../apps/word/editor.js');
  });

  test('Word97 is defined with editor and wordWindow', () => {
    expect(window.Word97).toBeDefined();
    expect(window.Word97.editor).toBeDefined();
    expect(window.Word97.wordWindow).toBeDefined();
    expect(window.Word97.exec).toBeDefined();
  });

  test('exec is a function', () => {
    expect(typeof window.Word97.exec).toBe('function');
  });

  test('getSelectionOrDocument is a function', () => {
    expect(typeof window.Word97.getSelectionOrDocument).toBe('function');
  });
});

describe('Word97 toolbar hyperlink validation', () => {
  let promptSpy;
  let alertSpy;
  let execSpy;

  beforeAll(() => {
    if (!document.getElementById('cmd-hyperlink')) {
      const btn = document.createElement('button');
      btn.id = 'cmd-hyperlink';
      document.body.appendChild(btn);
    }
    // Load the toolbar script so the event listener attaches
    require('../apps/word/toolbar.js');
  });

  beforeEach(() => {
    promptSpy = jest.spyOn(window, 'prompt').mockImplementation(() => null);
    alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    // Mock document.execCommand to prevent the TypeError inside Word97.exec,
    // or just mock Word97.exec itself if it's called.
    // In toolbar.js, it captures `const { exec } = window.Word97` at load time,
    // so spying on window.Word97.exec won't affect the reference held by toolbar.js.
    // Instead, we mock document.execCommand directly.
    document.execCommand = jest.fn();
    execSpy = jest.spyOn(document, 'execCommand');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('allows safe http:// URL', () => {
    promptSpy.mockReturnValue('http://example.com');
    document.getElementById('cmd-hyperlink').click();
    expect(execSpy).toHaveBeenCalledWith('createLink', false, 'http://example.com');
    expect(alertSpy).not.toHaveBeenCalled();
  });

  test('allows safe https:// URL with whitespace', () => {
    promptSpy.mockReturnValue('  https://example.com  ');
    document.getElementById('cmd-hyperlink').click();
    expect(execSpy).toHaveBeenCalledWith('createLink', false, 'https://example.com');
    expect(alertSpy).not.toHaveBeenCalled();
  });

  test('rejects javascript: URL', () => {
    promptSpy.mockReturnValue('javascript:alert(1)');
    document.getElementById('cmd-hyperlink').click();
    expect(execSpy).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith('URL must start with http:// or https://');
  });

  test('rejects data: URL', () => {
    promptSpy.mockReturnValue('data:text/html,<script>alert(1)</script>');
    document.getElementById('cmd-hyperlink').click();
    expect(execSpy).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith('URL must start with http:// or https://');
  });

  test('does nothing if prompt is cancelled', () => {
    promptSpy.mockReturnValue(null);
    document.getElementById('cmd-hyperlink').click();
    expect(execSpy).not.toHaveBeenCalled();
    expect(alertSpy).not.toHaveBeenCalled();
  });
});
