/**
 * Word 97 - Menu bar dropdowns and menu item actions.
 */
(function () {
  'use strict';

  const Word97 = window.Word97 || {};
  const exec = Word97.exec;

  const menuIds = ['file', 'edit', 'view', 'insert', 'format', 'tools', 'table', 'window', 'help'];
  let activeMenu = null;

  function positionMenu(menuEl, anchor) {
    if (!menuEl || !anchor) return;
    const r = anchor.getBoundingClientRect();
    menuEl.style.left = r.left + 'px';
    menuEl.style.top = (r.bottom + 2) + 'px';
  }

  function closeMenus() {
    menuIds.forEach((name) => {
      const m = document.getElementById('menu-' + name);
      if (m) m.classList.add('hidden');
    });
    activeMenu = null;
  }

  // Open a menu (file = inline dropdown; others = fixed positioned)
  function openMenu(name) {
    const btn = document.querySelector('.menu-item[data-menu="' + name + '"]');
    const menu = document.getElementById('menu-' + name);
    if (!btn || !menu) return;
    activeMenu = name;
    menu.classList.remove('hidden');
    if (menu.classList.contains('menu-dropdown-fixed')) {
      positionMenu(menu, btn);
    }
  }

  menuIds.forEach((name) => {
    const btn = document.querySelector('.menu-item[data-menu="' + name + '"]');
    const menu = document.getElementById('menu-' + name);
    if (!btn || !menu) return;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (activeMenu === name) {
        closeMenus();
        return;
      }
      closeMenus();
      openMenu(name);
    });
  });

  // Menu item actions (all dropdowns: .menu-dropdown-item)
  document.querySelectorAll('.menu-dropdown').forEach((dropdown) => {
    dropdown.addEventListener('click', (e) => {
      const item = e.target.closest('.menu-dropdown-item');
      if (!item) return;
      const text = (item.textContent || '').trim();
      const cmd = item.getAttribute('data-cmd');

      if (cmd === 'hyperlink') {
        const url = prompt('Enter URL:');
        if (url && exec) exec('createLink', url);
      } else if (cmd === 'table') {
        document.getElementById('cmd-table')?.click();
      } else if (text === 'Save' || text === 'Exit') {
        document.getElementById('cmd-save')?.click();
      } else if (text === 'Print...' || text === 'Print Preview') {
        document.getElementById('cmd-print')?.click();
      } else if (text === 'Cut' && exec) exec('cut');
      else if (text === 'Copy' && exec) exec('copy');
      else if (text === 'Paste' && exec) exec('paste');
      else if (text === 'Undo' && exec) exec('undo');
      else if (text === 'Normal') document.getElementById('view-normal')?.click();
      else if (text === 'Page Layout') document.getElementById('view-print')?.click();
      else if (text === 'About Microsoft Word' || item.id === 'menu-about-word') {
        const aboutDialog = document.getElementById('about-dialog');
        if (aboutDialog) {
          aboutDialog.removeAttribute('hidden');
        }
      }

      closeMenus();
    });
  });

  document.addEventListener('click', (e) => {
    if (e.target.closest('.menu-bar') || e.target.closest('.menu-dropdown')) return;
    closeMenus();
  });

  document.getElementById('about-ok-btn')?.addEventListener('click', () => {
    const d = document.getElementById('about-dialog');
    if (d) d.setAttribute('hidden', '');
  });

  document.getElementById('about-word-icon')?.addEventListener('click', (e) => {
    if (e.ctrlKey && e.shiftKey && typeof window.openPinball === 'function') {
      document.getElementById('about-dialog')?.setAttribute('hidden', '');
      window.openPinball();
    }
  });
})();
