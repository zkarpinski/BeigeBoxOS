/**
 * Unit tests for Windows 97 shell (show/hide/focus, taskbar, Start menu).
 */
describe('Windows97 shell', () => {
  beforeAll(() => {
    require('../shell/windows97.js');
    window.Windows97.registerApp({
      id: 'word',
      windowId: 'word-window',
      taskbarId: 'taskbar-word',
      startMenuId: 'start-menu-word',
      openByDefault: true,
    });
    window.Windows97.registerApp({
      id: 'vb6',
      windowId: 'vb6-window',
      taskbarId: 'taskbar-vb6',
      startMenuId: 'start-vb6',
      openByDefault: false,
    });
  });

  beforeEach(() => {
    document.getElementById('word-window').classList.remove('app-window-hidden');
    document.getElementById('word-window').style.display = 'flex';
    document.getElementById('taskbar-word').classList.remove('app-taskbar-hidden');
    document.getElementById('taskbar-word').classList.add('active');
    document.getElementById('vb6-window').classList.add('app-window-hidden');
    document.getElementById('taskbar-vb6').classList.add('app-taskbar-hidden');
  });

  test('Windows97 is defined', () => {
    expect(window.Windows97).toBeDefined();
    expect(typeof window.Windows97.registerApp).toBe('function');
    expect(typeof window.Windows97.showApp).toBe('function');
    expect(typeof window.Windows97.hideApp).toBe('function');
    expect(typeof window.Windows97.focusApp).toBe('function');
    expect(typeof window.Windows97.handleStartMenuItem).toBe('function');
    expect(typeof window.Windows97.isAppVisible).toBe('function');
  });

  test('showApp makes window and taskbar visible', () => {
    const vb6Window = document.getElementById('vb6-window');
    const vb6Task = document.getElementById('taskbar-vb6');
    vb6Window.classList.add('app-window-hidden');
    vb6Task.classList.add('app-taskbar-hidden');

    window.Windows97.showApp('vb6');

    expect(vb6Window.classList.contains('app-window-hidden')).toBe(false);
    expect(vb6Task.classList.contains('app-taskbar-hidden')).toBe(false);
    expect(vb6Window.style.display).toBe('flex');
  });

  test('hideApp hides window and taskbar', () => {
    const wordWindow = document.getElementById('word-window');
    const wordTask = document.getElementById('taskbar-word');

    window.Windows97.hideApp('word');

    expect(wordWindow.classList.contains('app-window-hidden')).toBe(true);
    expect(wordTask.classList.contains('app-taskbar-hidden')).toBe(true);
  });

  test('focusApp sets z-index and active class', () => {
    const wordWindow = document.getElementById('word-window');
    const wordTask = document.getElementById('taskbar-word');
    const vb6Task = document.getElementById('taskbar-vb6');
    vb6Task.classList.add('active');

    window.Windows97.focusApp('word');

    expect(wordWindow.style.zIndex).toBe('11');
    expect(wordTask.classList.contains('active')).toBe(true);
    expect(vb6Task.classList.contains('active')).toBe(false);
  });

  test('isAppVisible returns false when window has app-window-hidden', () => {
    document.getElementById('word-window').classList.add('app-window-hidden');
    expect(window.Windows97.isAppVisible('word')).toBe(false);

    document.getElementById('word-window').classList.remove('app-window-hidden');
    expect(window.Windows97.isAppVisible('word')).toBe(true);
  });

  test('handleStartMenuItem shows app when not visible', () => {
    document.getElementById('word-window').classList.add('app-window-hidden');
    document.getElementById('taskbar-word').classList.add('app-taskbar-hidden');

    const result = window.Windows97.handleStartMenuItem('start-menu-word');

    expect(result).toBe(true);
    expect(document.getElementById('word-window').classList.contains('app-window-hidden')).toBe(false);
  });

  test('handleStartMenuItem focuses app when already visible', () => {
    document.getElementById('vb6-window').classList.remove('app-window-hidden');
    document.getElementById('vb6-window').style.display = 'flex';
    document.getElementById('taskbar-vb6').classList.remove('app-taskbar-hidden');
    window.Windows97.focusApp('vb6');

    const result = window.Windows97.handleStartMenuItem('start-menu-word');

    expect(result).toBe(true);
    expect(document.getElementById('word-window').style.zIndex).toBe('11');
  });

  test('handleStartMenuItem returns false for unknown menu id', () => {
    const result = window.Windows97.handleStartMenuItem('start-menu-nonexistent');
    expect(result).toBe(false);
  });

  test('taskbar click when window minimized removes minimized and focuses', () => {
    const wordWindow = document.getElementById('word-window');
    wordWindow.classList.add('minimized');
    wordWindow.style.display = 'none';

    document.getElementById('taskbar-word').click();

    expect(wordWindow.classList.contains('minimized')).toBe(false);
    expect(wordWindow.style.display).toBe('');
    expect(wordWindow.style.zIndex).toBe('11');
  });

  test('hideApp when active refocuses another visible app', () => {
    const vb6Window = document.getElementById('vb6-window');
    const vb6Task = document.getElementById('taskbar-vb6');
    vb6Window.classList.remove('app-window-hidden');
    vb6Window.style.display = 'flex';
    vb6Task.classList.remove('app-taskbar-hidden');

    window.Windows97.hideApp('word');

    expect(document.getElementById('word-window').classList.contains('app-window-hidden')).toBe(true);
    expect(vb6Window.style.zIndex).toBe('11');
    expect(vb6Task.classList.contains('active')).toBe(true);
  });

  test('showApp for vb6 removes vb6-hidden from window and taskbar', () => {
    const vb6Window = document.getElementById('vb6-window');
    const vb6Task = document.getElementById('taskbar-vb6');
    vb6Window.classList.add('vb6-hidden');
    vb6Task.classList.add('vb6-hidden');
    vb6Window.classList.add('app-window-hidden');
    vb6Task.classList.add('app-taskbar-hidden');

    window.Windows97.showApp('vb6');

    expect(vb6Window.classList.contains('vb6-hidden')).toBe(false);
    expect(vb6Task.classList.contains('vb6-hidden')).toBe(false);
  });

  test('showApp with unknown id does not throw', () => {
    expect(() => window.Windows97.showApp('nonexistent-app')).not.toThrow();
  });

  test('focusApp when window hidden does not bring to front', () => {
    document.getElementById('vb6-window').classList.add('app-window-hidden');
    window.Windows97.focusApp('word');

    window.Windows97.focusApp('vb6');

    expect(document.getElementById('vb6-window').style.zIndex).not.toBe('11');
  });

  test('registerApp with missing window element does not register', () => {
    const bogusId = 'shell-test-bogus-' + Date.now();
    window.Windows97.registerApp({
      id: bogusId,
      windowId: 'id-that-does-not-exist',
      taskbarId: 'taskbar-word',
      startMenuId: 'start-menu-word',
      openByDefault: false,
    });
    expect(window.Windows97.apps[bogusId]).toBeUndefined();
  });

  test('activeAppId getter returns current focused app', () => {
    window.Windows97.focusApp('word');
    expect(window.Windows97.activeAppId).toBe('word');
    document.getElementById('vb6-window').classList.remove('app-window-hidden');
    document.getElementById('vb6-window').style.display = 'flex';
    document.getElementById('taskbar-vb6').classList.remove('app-taskbar-hidden');
    window.Windows97.focusApp('vb6');
    expect(window.Windows97.activeAppId).toBe('vb6');
  });
});
