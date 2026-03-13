/**
 * Clippy 97 - Classic Office Assistant (flat style, draggable). From word branch.
 * Clippy 98 is the CDN clippyjs (newer 3D version), loaded separately.
 */
(function () {
  'use strict';

  const win = document.getElementById('clippy-97-window');
  const titleBar = document.getElementById('clippy-97-title-bar');
  const wordWindow = document.getElementById('word-window');
  const closeBtn = document.getElementById('clippy-97-close');
  const clippyBody = document.getElementById('clippy-97-body');
  const popup = document.getElementById('clippy-97-popup');
  const popupX = document.getElementById('clippy-97-popup-x');
  const popupCloseBtn = document.getElementById('clippy-97-popup-close');

  if (!win || !titleBar || !wordWindow) return;

  let dragStartX = 0, dragStartY = 0, winStartLeft = 0, winStartTop = 0, isDragging = false;

  function getRect(el) { return el.getBoundingClientRect(); }
  function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }

  function applyPosition(left, top) {
    const wr = getRect(wordWindow);
    const ww = win.offsetWidth, wh = win.offsetHeight;
    win.style.right = 'auto';
    win.style.bottom = 'auto';
    const rightBound = Math.max(0, wr.width - ww);
    const bottomBound = Math.max(0, wr.height - wh);
    win.style.left = clamp(left, 0, rightBound) + 'px';
    win.style.top = clamp(top, 0, bottomBound) + 'px';
  }

  titleBar.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    isDragging = true;
    const r = win.getBoundingClientRect();
    const wr = wordWindow.getBoundingClientRect();
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    winStartLeft = r.left - wr.left;
    winStartTop = r.top - wr.top;
    e.preventDefault();
  });
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const wr = wordWindow.getBoundingClientRect();
    const dx = e.clientX - dragStartX, dy = e.clientY - dragStartY;
    applyPosition(winStartLeft + dx, winStartTop + dy);
  });
  document.addEventListener('mouseup', () => { isDragging = false; });

  function showClippy97() { win.style.display = ''; }
  function hideClippy97() { win.style.display = 'none'; }
  function toggleClippy97() {
    if (win.style.display === 'none') showClippy97();
    else hideClippy97();
  }

  function positionBottomRight() {
    const wr = wordWindow.getBoundingClientRect();
    const ww = win.offsetWidth, wh = win.offsetHeight;
    const left = wr.width - ww - 24;
    const top = wr.height - wh - 50;
    applyPosition(Math.max(0, left), Math.max(0, top));
  }

  closeBtn.addEventListener('click', hideClippy97);

  document.getElementById('cmd-help')?.addEventListener('click', () => {
    toggleClippy97();
  });

  const POPUP_TITLE_DEFAULT = 'What would you like to do?';
  const POPUP_TITLE_LETTER = "It looks like you're writing a letter. Would you like help?";
  const POPUP_TITLE_LINKEDIN = "It looks like you're viewing Zach's LinkedIn page. Would you like to add him as a friend?";
  const WEBAPP_TIPS = [
    "Use Shut Down from the Start menu to clear your saved session and start fresh—your document and window positions will reset.",
    "Did you find the Pinball easter egg? Try Help → About Microsoft Word, then hold Ctrl+Shift and click the Word icon!",
    "It looks like you're viewing Zach's LinkedIn page. Would you like to add him as a friend?",
    "Save your document as a .doc file with the Save button or File → Save—it downloads as Word-style HTML.",
    "You can open .doc, .rtf, .html, or .txt files with File → Open.",
    "Drag the Word window by its title bar to move it; use the corners to resize when it's not maximized.",
    "Click the taskbar button to minimize or restore the Word window.",
  ];
  const popupTitleEl = popup?.querySelector('.clippy-97-popup-title');

  function setPopupTitle(text) { if (popupTitleEl) popupTitleEl.textContent = text; }
  function showRandomTip() {
    if (WEBAPP_TIPS.length) setPopupTitle(WEBAPP_TIPS[Math.floor(Math.random() * WEBAPP_TIPS.length)]);
  }
  function showPopup() {
    if (!popup) return;
    popup.removeAttribute('hidden');
    popup.style.display = 'block';
  }
  function hidePopup() {
    if (!popup) return;
    popup.setAttribute('hidden', '');
    popup.style.display = '';
  }
  function togglePopup() {
    if (!popup) return;
    if (popup.hasAttribute('hidden')) {
      setPopupTitle(POPUP_TITLE_DEFAULT);
      showPopup();
      const input = document.getElementById('clippy-97-popup-input');
      if (input) { input.value = ''; input.focus(); }
    } else hidePopup();
  }

  win.addEventListener('click', (e) => {
    if (e.target.closest('.clippy-97-close') || e.target.closest('.clippy-97-popup')) return;
    if (!e.target.closest('.clippy-97-body')) return;
    e.stopPropagation();
    e.preventDefault();
    togglePopup();
  });
  if (clippyBody) clippyBody.style.cursor = 'pointer';
  popup?.addEventListener('click', (e) => e.stopPropagation());
  popupX?.addEventListener('click', (e) => { e.preventDefault(); hidePopup(); });
  popupCloseBtn?.addEventListener('click', (e) => { e.preventDefault(); hidePopup(); });

  document.getElementById('clippy-97-popup-search')?.addEventListener('click', () => {
    const input = document.getElementById('clippy-97-popup-input');
    const query = input?.value?.trim();
    if (query) alert('Search for "' + query + '" (Help content would go here.)');
  });
  document.getElementById('clippy-97-popup-tips')?.addEventListener('click', () => {
    showRandomTip();
  });
  document.getElementById('clippy-97-popup-options')?.addEventListener('click', () => {
    alert('Office Assistant options (Options dialog would go here.)');
  });

  /* Contextual tips when user types certain words */
  let letterTipShown = false;
  let linkedInTipShown = false;
  let letterCheckTimer = null;
  const editor = window.Word97?.editor;
  if (editor) {
    editor.addEventListener('input', () => {
      if (letterCheckTimer) clearTimeout(letterCheckTimer);
      letterCheckTimer = setTimeout(() => {
        letterCheckTimer = null;
        const text = (editor.innerText || editor.textContent || '').toLowerCase();
        if (!letterTipShown && /\b(dear|letter)\b/.test(text)) {
          letterTipShown = true;
          setPopupTitle(POPUP_TITLE_LETTER);
          showClippy97();
          showPopup();
        } else if (!linkedInTipShown && /\b(linkedin|zach|zachary)\b/.test(text)) {
          linkedInTipShown = true;
          setPopupTitle(POPUP_TITLE_LINKEDIN);
          showClippy97();
          showPopup();
        }
      }, 400);
    });
  }

  showClippy97();
  if (document.readyState === 'complete') {
    requestAnimationFrame(positionBottomRight);
  } else {
    window.addEventListener('load', () => requestAnimationFrame(positionBottomRight));
  }
  window.addEventListener('resize', () => {
    if (win.style.display !== 'none') positionBottomRight();
  });
})();
