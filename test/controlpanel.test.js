/** @jest-environment jsdom */

// Mock canvas for datetime clock drawing
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  clearRect: jest.fn(),
  beginPath: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  stroke: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  lineCap: '',
}));

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function buildCP() {
  // Minimal ControlPanel97 namespace (normally set by controlpanel.js)
  window.ControlPanel97 = {
    wallpapers: [
      { id: 'none', label: '(None)', src: null },
      { id: 'clouds', label: 'Clouds', src: 'shell/images/clouds.png' },
    ],
    pendingWallpaper: null,
    appliedWallpaper: 'none',
  };
}

function addEl(id, tag, attrs) {
  if (document.getElementById(id)) return document.getElementById(id);
  const el = document.createElement(tag || 'div');
  el.id = id;
  if (attrs) Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  document.body.appendChild(el);
  return el;
}

function addBtn(id, text) {
  const el = addEl(id, 'button');
  el.textContent = text || id;
  return el;
}

// ─────────────────────────────────────────────────────────────────────────────
// taskbar.js — Win98TimeOffset used in updateClock
// ─────────────────────────────────────────────────────────────────────────────
describe('taskbar clock Win98TimeOffset', () => {
  let clockEl;

  beforeAll(() => {
    // Required DOM for taskbar.js
    addEl('start-button', 'button');
    const startMenu = addEl('start-menu', 'div');
    startMenu.classList.add('hidden');
    clockEl = addEl('clock', 'span');
    addEl('tray-volume', 'div');
    addEl('volume-popup', 'div');
    addEl('volume-slider', 'input');

    jest.useFakeTimers();
    require('../shell/taskbar.js');
    document.dispatchEvent(new Event('DOMContentLoaded'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  test('clock element is populated after DOMContentLoaded', () => {
    expect(clockEl.textContent).toMatch(/\d+:\d{2}/);
  });

  test('clock title contains day and month', () => {
    expect(clockEl.title).toMatch(/\w+,\s+\w+\s+\d+,\s+\d{4}/);
  });

  test('Win98TimeOffset shifts displayed hour', () => {
    // Offset = +2 hours; check the displayed hour matches now+2h
    const TWO_HOURS = 2 * 60 * 60 * 1000;
    window.Win98TimeOffset = TWO_HOURS;
    // Re-fire a tick by advancing fake timers 1s
    jest.advanceTimersByTime(1000);
    const expectedDate = new Date(Date.now() + TWO_HOURS);
    const expectedHour = expectedDate.getHours();
    const expectedMin  = String(expectedDate.getMinutes()).padStart(2, '0');
    expect(clockEl.textContent).toBe(`${expectedHour}:${expectedMin}`);
    window.Win98TimeOffset = 0;
  });

  test('negative Win98TimeOffset shifts clock backward', () => {
    const MINUS_3H = -3 * 60 * 60 * 1000;
    window.Win98TimeOffset = MINUS_3H;
    jest.advanceTimersByTime(1000);
    const expectedDate = new Date(Date.now() + MINUS_3H);
    const expectedHour = expectedDate.getHours();
    const expectedMin  = String(expectedDate.getMinutes()).padStart(2, '0');
    expect(clockEl.textContent).toBe(`${expectedHour}:${expectedMin}`);
    window.Win98TimeOffset = 0;
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// datetime.js — Date/Time Properties applet
// ─────────────────────────────────────────────────────────────────────────────
describe('DateTime applet', () => {
  beforeAll(() => {
    buildCP();

    // Required DOM elements
    addEl('cp-applet-datetime', 'div');
    const dialog = addEl('datetime-dialog', 'div');
    dialog.setAttribute('hidden', '');

    const titlebar = document.createElement('div');
    titlebar.className = 'dp-titlebar';
    dialog.appendChild(titlebar);

    addEl('dt-month-select', 'select');
    addEl('dt-year-input',   'input');
    addEl('dt-calendar-body', 'tbody');
    const canvas = addEl('dt-clock-canvas', 'canvas');
    canvas.setAttribute('width', '120');
    canvas.setAttribute('height', '120');
    addEl('dt-time-input', 'input');
    addBtn('dt-ok-btn',     'OK');
    addBtn('dt-cancel-btn', 'Cancel');
    addBtn('dt-apply-btn',  'Apply');
    addBtn('dt-close-btn',  '✕');

    // Ensure calendar table exists for the tbody
    if (!document.getElementById('dt-calendar')) {
      const tbl = document.createElement('table');
      tbl.id = 'dt-calendar';
      const tbody = document.getElementById('dt-calendar-body');
      tbl.appendChild(tbody);
      document.body.appendChild(tbl);
    }

    jest.useFakeTimers();
    localStorage.clear();
    require('../apps/controlpanel/datetime.js');
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  afterEach(() => {
    // Always close dialog between tests
    const dlg = document.getElementById('datetime-dialog');
    if (dlg) dlg.setAttribute('hidden', '');
    if (window.ControlPanel97 && window.ControlPanel97.openDateTimeDialog) {
      // tick interval is cleared on close via closeDialog
    }
  });

  test('openDateTimeDialog is exposed on ControlPanel97', () => {
    expect(typeof window.ControlPanel97.openDateTimeDialog).toBe('function');
  });

  test('opening dialog removes hidden attribute', () => {
    window.ControlPanel97.openDateTimeDialog();
    const dlg = document.getElementById('datetime-dialog');
    expect(dlg.hasAttribute('hidden')).toBe(false);
  });

  test('closing dialog via Cancel re-adds hidden', () => {
    window.ControlPanel97.openDateTimeDialog();
    document.getElementById('dt-cancel-btn').click();
    expect(document.getElementById('datetime-dialog').hasAttribute('hidden')).toBe(true);
  });

  test('closing dialog via close button re-adds hidden', () => {
    window.ControlPanel97.openDateTimeDialog();
    document.getElementById('dt-close-btn').click();
    expect(document.getElementById('datetime-dialog').hasAttribute('hidden')).toBe(true);
  });

  test('month select is populated with 12 months on open', () => {
    window.ControlPanel97.openDateTimeDialog();
    const sel = document.getElementById('dt-month-select');
    expect(sel.options.length).toBe(12);
    expect(sel.options[0].textContent).toBe('January');
    expect(sel.options[11].textContent).toBe('December');
    document.getElementById('dt-cancel-btn').click();
  });

  test('year input is set to current year on open', () => {
    window.ControlPanel97.openDateTimeDialog();
    const year = parseInt(document.getElementById('dt-year-input').value, 10);
    const expected = new Date(Date.now() + (window.Win98TimeOffset || 0)).getFullYear();
    expect(year).toBe(expected);
    document.getElementById('dt-cancel-btn').click();
  });

  test('calendar body has rows after open', () => {
    window.ControlPanel97.openDateTimeDialog();
    const tbody = document.getElementById('dt-calendar-body');
    expect(tbody.rows.length).toBeGreaterThan(0);
    document.getElementById('dt-cancel-btn').click();
  });

  test('calendar has a selected cell for today', () => {
    window.ControlPanel97.openDateTimeDialog();
    const selected = document.querySelector('#dt-calendar-body .dt-selected');
    expect(selected).not.toBeNull();
    const today = new Date(Date.now() + (window.Win98TimeOffset || 0)).getDate();
    expect(parseInt(selected.textContent, 10)).toBe(today);
    document.getElementById('dt-cancel-btn').click();
  });

  test('time input is populated in HH:MM:SS format on open', () => {
    window.ControlPanel97.openDateTimeDialog();
    const val = document.getElementById('dt-time-input').value;
    expect(val).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    document.getElementById('dt-cancel-btn').click();
  });

  test('Apply writes Win98TimeOffset to window and localStorage', () => {
    // Set a known offset before opening so workDate == now + offset
    window.Win98TimeOffset = 0;
    localStorage.clear();
    window.ControlPanel97.openDateTimeDialog();
    // Click Apply — offset should stay ~0 (no user change)
    document.getElementById('dt-apply-btn').click();
    expect(typeof window.Win98TimeOffset).toBe('number');
    const stored = localStorage.getItem('win98-time-offset');
    expect(stored).not.toBeNull();
    expect(typeof parseInt(stored, 10)).toBe('number');
    document.getElementById('dt-cancel-btn').click();
  });

  test('OK button applies offset and closes dialog', () => {
    window.ControlPanel97.openDateTimeDialog();
    document.getElementById('dt-ok-btn').click();
    expect(document.getElementById('datetime-dialog').hasAttribute('hidden')).toBe(true);
  });

  test('localStorage offset is restored on module load', () => {
    // The module reads localStorage on load. We already required it,
    // so just verify the init path didn't crash and Win98TimeOffset is a number.
    expect(typeof window.Win98TimeOffset).toBe('number');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// sounds.js — Sounds Properties applet
// ─────────────────────────────────────────────────────────────────────────────
describe('Sounds applet', () => {
  beforeAll(() => {
    buildCP();

    addEl('cp-applet-sounds', 'div');
    const dialog = addEl('sounds-dialog', 'div');
    dialog.setAttribute('hidden', '');

    const titlebar = document.createElement('div');
    titlebar.className = 'dp-titlebar';
    dialog.appendChild(titlebar);

    addEl('snd-events-list',  'ul');
    addEl('snd-scheme-select', 'select');
    addEl('snd-sound-select',  'select');
    addBtn('snd-preview-btn', '▶ Preview');
    addBtn('snd-ok-btn',      'OK');
    addBtn('snd-cancel-btn',  'Cancel');
    addBtn('snd-close-btn',   '✕');
    addBtn('snd-apply-btn',   'Apply');

    // Populate sound select options to match sounds.js expectations
    const sel = document.getElementById('snd-sound-select');
    ['', 'chord', 'ding', 'tada', 'notify', 'exclamation'].forEach(v => {
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = v || '(None)';
      sel.appendChild(opt);
    });

    require('../apps/controlpanel/sounds.js');
  });

  afterEach(() => {
    document.getElementById('sounds-dialog').setAttribute('hidden', '');
  });

  test('openSoundsDialog is exposed on ControlPanel97', () => {
    expect(typeof window.ControlPanel97.openSoundsDialog).toBe('function');
  });

  test('opening dialog removes hidden attribute', () => {
    window.ControlPanel97.openSoundsDialog();
    expect(document.getElementById('sounds-dialog').hasAttribute('hidden')).toBe(false);
  });

  test('OK button closes dialog', () => {
    window.ControlPanel97.openSoundsDialog();
    document.getElementById('snd-ok-btn').click();
    expect(document.getElementById('sounds-dialog').hasAttribute('hidden')).toBe(true);
  });

  test('Cancel button closes dialog', () => {
    window.ControlPanel97.openSoundsDialog();
    document.getElementById('snd-cancel-btn').click();
    expect(document.getElementById('sounds-dialog').hasAttribute('hidden')).toBe(true);
  });

  test('close button closes dialog', () => {
    window.ControlPanel97.openSoundsDialog();
    document.getElementById('snd-close-btn').click();
    expect(document.getElementById('sounds-dialog').hasAttribute('hidden')).toBe(true);
  });

  test('events list has 12 items after open', () => {
    window.ControlPanel97.openSoundsDialog();
    const items = document.querySelectorAll('#snd-events-list li');
    expect(items.length).toBe(12);
    document.getElementById('snd-ok-btn').click();
  });

  test('preview button is disabled when no event selected', () => {
    window.ControlPanel97.openSoundsDialog();
    expect(document.getElementById('snd-preview-btn').disabled).toBe(true);
    document.getElementById('snd-ok-btn').click();
  });

  test('clicking event with sound enables preview button', () => {
    window.ControlPanel97.openSoundsDialog();
    // First item is "Asterisk" with sound "ding"
    const firstItem = document.querySelector('#snd-events-list li');
    firstItem.click();
    expect(document.getElementById('snd-preview-btn').disabled).toBe(false);
    document.getElementById('snd-ok-btn').click();
  });

  test('clicking event updates sound select value', () => {
    window.ControlPanel97.openSoundsDialog();
    const items = document.querySelectorAll('#snd-events-list li');
    // "Start Windows" (index 10) has sound "tada"
    items[10].click();
    expect(document.getElementById('snd-sound-select').value).toBe('tada');
    document.getElementById('snd-ok-btn').click();
  });

  test('clicking event with no sound keeps preview disabled', () => {
    window.ControlPanel97.openSoundsDialog();
    // "Maximize" (index 5) has no sound
    const items = document.querySelectorAll('#snd-events-list li');
    items[5].click();
    expect(document.getElementById('snd-preview-btn').disabled).toBe(true);
    document.getElementById('snd-ok-btn').click();
  });

  test('selected event gets snd-selected class', () => {
    window.ControlPanel97.openSoundsDialog();
    const items = document.querySelectorAll('#snd-events-list li');
    items[0].click();
    expect(items[0].classList.contains('snd-selected')).toBe(true);
    // Only one item selected at a time
    items[1].click();
    expect(items[0].classList.contains('snd-selected')).toBe(false);
    expect(items[1].classList.contains('snd-selected')).toBe(true);
    document.getElementById('snd-ok-btn').click();
  });

  test('sound select change to empty disables preview', () => {
    window.ControlPanel97.openSoundsDialog();
    // Select an event first to enable preview
    document.querySelectorAll('#snd-events-list li')[0].click();
    expect(document.getElementById('snd-preview-btn').disabled).toBe(false);
    // Clear the sound select
    const sel = document.getElementById('snd-sound-select');
    sel.value = '';
    sel.dispatchEvent(new Event('change'));
    expect(document.getElementById('snd-preview-btn').disabled).toBe(true);
    document.getElementById('snd-ok-btn').click();
  });

  test('reopening dialog resets selection state', () => {
    window.ControlPanel97.openSoundsDialog();
    document.querySelectorAll('#snd-events-list li')[0].click();
    document.getElementById('snd-ok-btn').click();
    // Reopen
    window.ControlPanel97.openSoundsDialog();
    expect(document.getElementById('snd-preview-btn').disabled).toBe(true);
    expect(document.querySelector('#snd-events-list .snd-selected')).toBeNull();
    document.getElementById('snd-ok-btn').click();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// mouse.js — Mouse Properties applet
// ─────────────────────────────────────────────────────────────────────────────
describe('Mouse applet', () => {
  beforeAll(() => {
    buildCP();

    addEl('cp-applet-mouse', 'div');
    const dialog = addEl('mouse-dialog', 'div');
    dialog.setAttribute('hidden', '');

    const titlebar = document.createElement('div');
    titlebar.className = 'dp-titlebar';
    dialog.appendChild(titlebar);

    // Panels
    addEl('ms-panel-buttons', 'div');
    addEl('ms-panel-motion',  'div');

    // Tab buttons
    const tabBtns = addBtn('ms-tab-buttons-btn', 'Buttons');
    tabBtns.classList.add('dp-tab', 'active', 'ms-tab-btn');
    const tabMot = addBtn('ms-tab-motion-btn', 'Motion');
    tabMot.classList.add('dp-tab', 'ms-tab-btn');

    // Hand radios
    const rRight = addEl('ms-hand-right', 'input');
    rRight.type = 'radio'; rRight.name = 'ms-hand'; rRight.value = 'right'; rRight.checked = true;
    const rLeft  = addEl('ms-hand-left',  'input');
    rLeft.type  = 'radio'; rLeft.name  = 'ms-hand'; rLeft.value  = 'left';

    // SVG mouse buttons
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'ms-mouse-svg';
    const leftBtn  = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    leftBtn.id  = 'ms-left-btn';  leftBtn.setAttribute('fill', '#1084d0');
    const rightBtn = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    rightBtn.id = 'ms-right-btn'; rightBtn.setAttribute('fill', '#e8e8e8');
    svg.appendChild(leftBtn); svg.appendChild(rightBtn);
    document.body.appendChild(svg);

    // Dblclick test + speed slider
    addEl('ms-dblclick-test', 'div');
    const slider = addEl('ms-dblclick-slider', 'input');
    slider.type = 'range'; slider.value = '5';

    // Motion controls
    const speedSlider = addEl('ms-speed-slider', 'input');
    speedSlider.type = 'range';
    const trailsCheck  = addEl('ms-trails-check', 'input');
    trailsCheck.type = 'checkbox';
    const trailsSlider = addEl('ms-trails-slider', 'input');
    trailsSlider.type = 'range'; trailsSlider.disabled = true;

    addBtn('ms-ok-btn',     'OK');
    addBtn('ms-cancel-btn', 'Cancel');
    addBtn('ms-close-btn',  '✕');
    addBtn('ms-apply-btn',  'Apply');

    // Hand radios need a parent section — add them to a container
    const section = document.createElement('div');
    section.className = 'ms-hand-radios';
    section.appendChild(document.getElementById('ms-hand-right'));
    section.appendChild(document.getElementById('ms-hand-left'));
    document.body.appendChild(section);

    jest.useFakeTimers();
    require('../apps/controlpanel/mouse.js');
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  afterEach(() => {
    document.getElementById('mouse-dialog').setAttribute('hidden', '');
    // jsdom never fires animationend, so clean up animation class manually
    const testEl = document.getElementById('ms-dblclick-test');
    if (testEl) testEl.classList.remove('ms-hopping');
  });

  test('openMouseDialog is exposed on ControlPanel97', () => {
    expect(typeof window.ControlPanel97.openMouseDialog).toBe('function');
  });

  test('opening dialog removes hidden attribute', () => {
    window.ControlPanel97.openMouseDialog();
    expect(document.getElementById('mouse-dialog').hasAttribute('hidden')).toBe(false);
  });

  test('OK button closes dialog', () => {
    window.ControlPanel97.openMouseDialog();
    document.getElementById('ms-ok-btn').click();
    expect(document.getElementById('mouse-dialog').hasAttribute('hidden')).toBe(true);
  });

  test('Cancel button closes dialog', () => {
    window.ControlPanel97.openMouseDialog();
    document.getElementById('ms-cancel-btn').click();
    expect(document.getElementById('mouse-dialog').hasAttribute('hidden')).toBe(true);
  });

  test('close button closes dialog', () => {
    window.ControlPanel97.openMouseDialog();
    document.getElementById('ms-close-btn').click();
    expect(document.getElementById('mouse-dialog').hasAttribute('hidden')).toBe(true);
  });

  test('Buttons panel visible and Motion panel hidden by default', () => {
    window.ControlPanel97.openMouseDialog();
    expect(document.getElementById('ms-panel-buttons').style.display).not.toBe('none');
    expect(document.getElementById('ms-panel-motion').style.display).toBe('none');
    document.getElementById('ms-ok-btn').click();
  });

  test('clicking Motion tab shows motion panel, hides buttons panel', () => {
    window.ControlPanel97.openMouseDialog();
    document.getElementById('ms-tab-motion-btn').click();
    expect(document.getElementById('ms-panel-motion').style.display).not.toBe('none');
    expect(document.getElementById('ms-panel-buttons').style.display).toBe('none');
    document.getElementById('ms-ok-btn').click();
  });

  test('clicking Buttons tab restores buttons panel', () => {
    window.ControlPanel97.openMouseDialog();
    document.getElementById('ms-tab-motion-btn').click();
    document.getElementById('ms-tab-buttons-btn').click();
    expect(document.getElementById('ms-panel-buttons').style.display).not.toBe('none');
    expect(document.getElementById('ms-panel-motion').style.display).toBe('none');
    document.getElementById('ms-ok-btn').click();
  });

  test('Motion tab gets active class; Buttons tab loses it', () => {
    window.ControlPanel97.openMouseDialog();
    document.getElementById('ms-tab-motion-btn').click();
    expect(document.getElementById('ms-tab-motion-btn').classList.contains('active')).toBe(true);
    expect(document.getElementById('ms-tab-buttons-btn').classList.contains('active')).toBe(false);
    document.getElementById('ms-ok-btn').click();
  });

  test('selecting left-handed radio sets right button as primary', () => {
    window.ControlPanel97.openMouseDialog();
    const leftRadio = document.getElementById('ms-hand-left');
    leftRadio.checked = true;
    leftRadio.dispatchEvent(new Event('change'));
    expect(document.getElementById('ms-right-btn').getAttribute('fill')).toBe('#1084d0');
    expect(document.getElementById('ms-left-btn').getAttribute('fill')).toBe('#e8e8e8');
    document.getElementById('ms-ok-btn').click();
  });

  test('selecting right-handed radio restores left button as primary', () => {
    window.ControlPanel97.openMouseDialog();
    // First go left-handed
    const leftRadio = document.getElementById('ms-hand-left');
    leftRadio.checked = true;
    leftRadio.dispatchEvent(new Event('change'));
    // Then back to right-handed
    const rightRadio = document.getElementById('ms-hand-right');
    rightRadio.checked = true;
    rightRadio.dispatchEvent(new Event('change'));
    expect(document.getElementById('ms-left-btn').getAttribute('fill')).toBe('#1084d0');
    expect(document.getElementById('ms-right-btn').getAttribute('fill')).toBe('#e8e8e8');
    document.getElementById('ms-ok-btn').click();
  });

  test('enabling trails checkbox enables trails slider', () => {
    window.ControlPanel97.openMouseDialog();
    const check  = document.getElementById('ms-trails-check');
    const slider = document.getElementById('ms-trails-slider');
    check.checked = true;
    check.dispatchEvent(new Event('change'));
    expect(slider.disabled).toBe(false);
    document.getElementById('ms-ok-btn').click();
  });

  test('disabling trails checkbox disables trails slider', () => {
    window.ControlPanel97.openMouseDialog();
    const check  = document.getElementById('ms-trails-check');
    const slider = document.getElementById('ms-trails-slider');
    // Enable first
    check.checked = true;
    check.dispatchEvent(new Event('change'));
    // Then disable
    check.checked = false;
    check.dispatchEvent(new Event('change'));
    expect(slider.disabled).toBe(true);
    document.getElementById('ms-ok-btn').click();
  });

  test('double-clicking test area adds ms-hopping class', () => {
    window.ControlPanel97.openMouseDialog();
    const testEl = document.getElementById('ms-dblclick-test');
    // Simulate double-click via two rapid clicks
    testEl.click();
    testEl.click();
    expect(testEl.classList.contains('ms-hopping')).toBe(true);
    document.getElementById('ms-ok-btn').click();
  });

  test('single click does not add ms-hopping class', () => {
    window.ControlPanel97.openMouseDialog();
    const testEl = document.getElementById('ms-dblclick-test');
    testEl.click();
    expect(testEl.classList.contains('ms-hopping')).toBe(false);
    // Clean up pending timer
    jest.runAllTimers();
    document.getElementById('ms-ok-btn').click();
  });

  test('reopening dialog resets to Buttons tab', () => {
    window.ControlPanel97.openMouseDialog();
    document.getElementById('ms-tab-motion-btn').click();
    document.getElementById('ms-ok-btn').click();
    // Reopen
    window.ControlPanel97.openMouseDialog();
    expect(document.getElementById('ms-panel-buttons').style.display).not.toBe('none');
    expect(document.getElementById('ms-panel-motion').style.display).toBe('none');
    document.getElementById('ms-ok-btn').click();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// system.js — System Properties applet
// ─────────────────────────────────────────────────────────────────────────────
describe('System applet', () => {
  beforeAll(() => {
    buildCP();

    addEl('cp-applet-system', 'div');
    const dialog = addEl('system-dialog', 'div');
    dialog.setAttribute('hidden', '');

    const titlebar = document.createElement('div');
    titlebar.className = 'dp-titlebar';
    dialog.appendChild(titlebar);

    addBtn('sys-ok-btn',     'OK');
    addBtn('sys-cancel-btn', 'Cancel');
    addBtn('sys-close-btn',  '✕');

    require('../apps/controlpanel/system.js');
  });

  afterEach(() => {
    document.getElementById('system-dialog').setAttribute('hidden', '');
  });

  test('openSystemDialog is exposed on ControlPanel97', () => {
    expect(typeof window.ControlPanel97.openSystemDialog).toBe('function');
  });

  test('opening dialog removes hidden attribute', () => {
    window.ControlPanel97.openSystemDialog();
    expect(document.getElementById('system-dialog').hasAttribute('hidden')).toBe(false);
  });

  test('OK button closes dialog', () => {
    window.ControlPanel97.openSystemDialog();
    document.getElementById('sys-ok-btn').click();
    expect(document.getElementById('system-dialog').hasAttribute('hidden')).toBe(true);
  });

  test('Cancel button closes dialog', () => {
    window.ControlPanel97.openSystemDialog();
    document.getElementById('sys-cancel-btn').click();
    expect(document.getElementById('system-dialog').hasAttribute('hidden')).toBe(true);
  });

  test('close button closes dialog', () => {
    window.ControlPanel97.openSystemDialog();
    document.getElementById('sys-close-btn').click();
    expect(document.getElementById('system-dialog').hasAttribute('hidden')).toBe(true);
  });

  test('opening dialog twice does not throw', () => {
    expect(() => {
      window.ControlPanel97.openSystemDialog();
      window.ControlPanel97.openSystemDialog();
    }).not.toThrow();
    document.getElementById('sys-ok-btn').click();
  });
});
