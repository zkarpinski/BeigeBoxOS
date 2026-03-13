/** @jest-environment jsdom */

// ─────────────────────────────────────────────────────────────────────────────
// DOM setup
// ─────────────────────────────────────────────────────────────────────────────
function addEl(id, tag, attrs) {
    if (document.getElementById(id)) return document.getElementById(id);
    const el = document.createElement(tag || 'div');
    el.id = id;
    if (attrs) Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    document.body.appendChild(el);
    return el;
}

beforeAll(() => {
    addEl('ie5-iframe', 'iframe');
    addEl('ie5-url-input', 'input');
    addEl('ie5-title-text', 'span');
    addEl('ie5-status-text', 'span');

    window.Windows97 = { showApp: jest.fn() };

    require('../apps/ie5/windowsupdate.js');
});

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────
describe('WindowsUpdate97', () => {
    test('is defined after require', () => {
        expect(window.WindowsUpdate97).toBeDefined();
    });

    test('open is a function', () => {
        expect(typeof window.WindowsUpdate97.open).toBe('function');
    });

    test('open() calls Windows97.showApp("ie5")', () => {
        window.Windows97.showApp.mockClear();
        window.WindowsUpdate97.open();
        expect(window.Windows97.showApp).toHaveBeenCalledWith('ie5');
    });

    test('open() sets iframe srcdoc to non-empty string containing "Windows Update"', () => {
        window.WindowsUpdate97.open();
        const iframe = document.getElementById('ie5-iframe');
        expect(typeof iframe.srcdoc).toBe('string');
        expect(iframe.srcdoc.length).toBeGreaterThan(0);
        expect(iframe.srcdoc).toContain('Windows Update');
    });

    test('open() sets url input to windowsupdate.microsoft.com', () => {
        window.WindowsUpdate97.open();
        const input = document.getElementById('ie5-url-input');
        expect(input.value).toBe('http://windowsupdate.microsoft.com/');
    });

    test('open() sets title text to contain "Windows Update"', () => {
        window.WindowsUpdate97.open();
        const title = document.getElementById('ie5-title-text');
        expect(title.textContent).toContain('Windows Update');
    });

    test('open() sets status text to "Done"', () => {
        window.WindowsUpdate97.open();
        const status = document.getElementById('ie5-status-text');
        expect(status.textContent).toBe('Done');
    });

    describe('getWindowsUpdatePage HTML content', () => {
        let html;
        beforeAll(() => {
            html = window.WindowsUpdate97._getPage();
        });

        test('contains KB813951', () => {
            expect(html).toContain('KB813951');
        });

        test('contains KB828026', () => {
            expect(html).toContain('KB828026');
        });

        test('contains Y2K update', () => {
            expect(html).toContain('Y2K');
        });
    });

    test('calling open() twice does not throw', () => {
        expect(() => {
            window.WindowsUpdate97.open();
            window.WindowsUpdate97.open();
        }).not.toThrow();
    });
});
