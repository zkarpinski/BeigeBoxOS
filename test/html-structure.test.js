/**
 * Structural integrity tests for index.html.
 *
 * Catches bugs like unclosed app-window divs where key elements
 * (overlays, dialogs, scripts) accidentally become children of an
 * app window and get hidden by its display:none style.
 */
const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const { document } = new JSDOM(html).window;

// ─────────────────────────────────────────────────────────────────────────────
// App window nesting
// ─────────────────────────────────────────────────────────────────────────────
describe('app-window nesting', () => {
    test('no .app-window contains another .app-window', () => {
        const appWindows = [...document.querySelectorAll('.app-window')];
        expect(appWindows.length).toBeGreaterThan(0);
        for (const win of appWindows) {
            const nested = win.querySelectorAll('.app-window');
            expect(nested.length).toBe(0);
        }
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// Critical top-level elements are not inside any app-window
// ─────────────────────────────────────────────────────────────────────────────
describe('top-level elements not inside app-window', () => {
    const ids = [
        // Shell overlays
        'shutdown-overlay',
        'start-menu',
        // Control Panel applet dialogs
        'datetime-dialog',
        'sounds-dialog',
        'mouse-dialog',
        'system-dialog',
    ];

    test.each(ids)('#%s is not a descendant of any .app-window', (id) => {
        const el = document.getElementById(id);
        expect(el).not.toBeNull();
        expect(el.closest('.app-window')).toBeNull();
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// All registered app windows exist in the DOM
// ─────────────────────────────────────────────────────────────────────────────
describe('app windows present in DOM', () => {
    const expectedWindows = [
        'ie5-window',
        'msdos-window',
        'controlpanel-window',
        'shutdown-overlay',
    ];

    test.each(expectedWindows)('#%s exists', (id) => {
        expect(document.getElementById(id)).not.toBeNull();
    });
});
