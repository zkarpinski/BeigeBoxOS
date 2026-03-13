/**
 * @jest-environment node
 */
/**
 * Tests for shell/state.js loadState function.
 */

describe('loadState', () => {
  let Word97State;
  let mockLocalStorage;

  beforeAll(() => {
    // Mock minimal DOM environment
    global.window = {
      addEventListener: jest.fn(),
      Word97State: {}
    };
    global.document = {
      readyState: 'complete',
      addEventListener: jest.fn(),
      getElementById: jest.fn(),
    };
    global.setInterval = jest.fn();
    global.setTimeout = jest.fn();
    global.clearTimeout = jest.fn();

    mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };

    // Need to use defineProperty to mock global.localStorage since it's a readonly property in jsdom
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });

    // Load the file
    require('../shell/state.js');
    Word97State = global.window.Word97State;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReset();
    mockLocalStorage.setItem.mockReset();
    mockLocalStorage.removeItem.mockReset();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  test('loadState returns parsed object when valid JSON exists in localStorage', () => {
    const mockData = { stateVersion: 2, editorContent: 'hello' };
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(mockData));

    const result = Word97State.loadState();

    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('word97-state');
    expect(result).toEqual(mockData);
  });

  test('loadState returns null when localStorage item is missing', () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    const result = Word97State.loadState();

    expect(result).toBeNull();
  });

  test('loadState returns null when localStorage contains invalid JSON', () => {
    mockLocalStorage.getItem.mockReturnValue('invalid-json');

    const result = Word97State.loadState();

    expect(result).toBeNull();
  });

  test('loadState returns null when localStorage.getItem throws', () => {
    mockLocalStorage.getItem.mockImplementation(() => {
      throw new Error('localStorage error');
    });

    const result = Word97State.loadState();

    expect(result).toBeNull();
  });
});

describe('saveState', () => {
  let Word97State;
  let mockElements;
  let mockLocalStorage;

  beforeAll(() => {
    // Reset any previous mocks
    jest.restoreAllMocks();

    global.window = {
      addEventListener: jest.fn(),
      Word97State: {}
    };

    mockElements = {
      editor: { innerHTML: '<p>Test content</p>' },
      'word-window': { classList: { contains: jest.fn().mockReturnValue(true) } },
      'vb6-window': { classList: { contains: jest.fn().mockReturnValue(false) } },
      'clippy-97-window': { style: { display: '' } }
    };

    global.document = {
      readyState: 'complete',
      addEventListener: jest.fn(),
      getElementById: jest.fn((id) => mockElements[id] || null),
    };

    global.setInterval = jest.fn();
    global.setTimeout = jest.fn();
    global.clearTimeout = jest.fn();

    mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });

    // Reload the file so it uses the updated global document
    jest.isolateModules(() => {
      require('../shell/state.js');
      Word97State = global.window.Word97State;
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.setItem.mockReset();

    // Reset default mock returns
    mockElements['word-window'].classList.contains.mockReturnValue(true);
    mockElements['vb6-window'].classList.contains.mockReturnValue(false);
    mockElements['clippy-97-window'].style.display = '';
    mockElements['editor'].innerHTML = '<p>Test content</p>';
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  test('saveState saves current state to localStorage correctly', () => {
    // Make sure we provide elements correctly
    global.document.getElementById = jest.fn((id) => mockElements[id] || null);

    Word97State.saveState();

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'word97-state',
      JSON.stringify({
        stateVersion: 2,
        editorContent: '<p>Test content</p>',
        wordWindowed: true,
        vb6Visible: true, // !contains('app-window-hidden') is true when contains returns false
        clippy97Visible: true // display !== 'none' is true when display is ''
      })
    );
  });

  test('saveState handles missing elements gracefully', () => {
    // Override getElementById to return null
    global.document.getElementById = jest.fn().mockReturnValue(null);

    Word97State.saveState();

    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'word97-state',
      JSON.stringify({
        stateVersion: 2,
        editorContent: '',
        wordWindowed: false,
        vb6Visible: false,
        clippy97Visible: true // clippy is assumed visible by default if element is missing
      })
    );

    // Restore the mock
    global.document.getElementById = jest.fn((id) => mockElements[id] || null);
  });

  test('saveState catches and ignores localStorage errors', () => {
    mockLocalStorage.setItem.mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    expect(() => {
      Word97State.saveState();
    }).not.toThrow();
  });
});

describe('clearState', () => {
  let Word97State;
  let mockLocalStorage;
  let originalConsoleError;

  beforeAll(() => {
    originalConsoleError = console.error;
    console.error = jest.fn();

    global.window = {
      addEventListener: jest.fn(),
      Word97State: {}
    };

    global.document = {
      readyState: 'complete',
      addEventListener: jest.fn(),
      getElementById: jest.fn(),
    };

    global.setInterval = jest.fn();
    global.setTimeout = jest.fn();
    global.clearTimeout = jest.fn();

    mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });

    jest.isolateModules(() => {
      require('../shell/state.js');
      Word97State = global.window.Word97State;
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.removeItem.mockReset();
  });

  afterAll(() => {
    console.error = originalConsoleError;
    jest.restoreAllMocks();
  });

  test('clearState removes item from localStorage', () => {
    Word97State.clearState();
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('word97-state');
  });

  test('clearState logs error when localStorage.removeItem throws', () => {
    const error = new Error('localStorage error');
    mockLocalStorage.removeItem.mockImplementation(() => {
      throw error;
    });

    Word97State.clearState();

    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('word97-state');
    expect(console.error).toHaveBeenCalledWith('Failed to clear state:', error);
  });
});

describe('tryRestore / applyState', () => {
  let mockEditor;
  let mockWordWindow;
  let mockVb6Window;
  let mockClippy97;
  let mockShowApp;
  let mockHideApp;
  let mockUpdateStatusBar;
  let mockLocalStorage;

  beforeAll(() => {
    jest.restoreAllMocks();
    mockEditor = { innerHTML: '' };
    mockWordWindow = { classList: { add: jest.fn(), remove: jest.fn() } };
    mockVb6Window = {};
    mockClippy97 = { style: { display: '' } };
    mockShowApp = jest.fn();
    mockHideApp = jest.fn();
    mockUpdateStatusBar = jest.fn();

    global.window = {
      addEventListener: jest.fn(),
      Word97: { updateStatusBar: mockUpdateStatusBar },
      Windows97: { showApp: mockShowApp, hideApp: mockHideApp },
    };
    global.document = {
      readyState: 'complete',
      addEventListener: jest.fn(),
      getElementById: jest.fn((id) => {
        if (id === 'editor') return mockEditor;
        if (id === 'word-window') return mockWordWindow;
        if (id === 'vb6-window') return mockVb6Window;
        if (id === 'clippy-97-window') return mockClippy97;
        return null;
      }),
    };
    global.setInterval = jest.fn();
    global.setTimeout = jest.fn();
    global.clearTimeout = jest.fn();
    mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockEditor.innerHTML = '';
    mockWordWindow.classList.add.mockClear();
    mockWordWindow.classList.remove.mockClear();
    mockClippy97.style.display = '';
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  test('tryRestore applies state and restores editor content', () => {
    const savedState = {
      stateVersion: 2,
      editorContent: '<p>Restored text</p>',
      wordWindowed: true,
      vb6Visible: true,
      clippy97Visible: true,
    };
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedState));

    jest.isolateModules(() => {
      require('../shell/state.js');
    });

    expect(mockEditor.innerHTML).toBe('<p>Restored text</p>');
    expect(mockUpdateStatusBar).toHaveBeenCalled();
    expect(mockWordWindow.classList.add).toHaveBeenCalledWith('windowed');
    expect(mockShowApp).toHaveBeenCalledWith('vb6');
    expect(mockClippy97.style.display).toBe('');
  });

  test('tryRestore applies state with vb6 hidden and clippy hidden', () => {
    const savedState = {
      stateVersion: 2,
      editorContent: '',
      wordWindowed: false,
      vb6Visible: false,
      clippy97Visible: false,
    };
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedState));

    jest.isolateModules(() => {
      require('../shell/state.js');
    });

    expect(mockWordWindow.classList.remove).toHaveBeenCalledWith('windowed');
    expect(mockHideApp).toHaveBeenCalledWith('vb6');
    expect(mockClippy97.style.display).toBe('none');
  });

  test('tryRestore does not restore editor when state version is old', () => {
    mockEditor.innerHTML = '<p>existing</p>';
    mockLocalStorage.getItem.mockReturnValue(
      JSON.stringify({ stateVersion: 1, editorContent: '<p>old</p>' })
    );

    jest.isolateModules(() => {
      require('../shell/state.js');
    });

    expect(mockEditor.innerHTML).toBe('<p>existing</p>');
  });
});
