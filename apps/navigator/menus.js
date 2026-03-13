/**
 * Netscape Navigator 97 - Menu bar dropdowns.
 */
(function () {
  'use strict';

  var ns = window.Navigator97;
  if (!ns || !ns.navWindow) return;

  var navWindow = ns.navWindow;
  var activeMenu = null;

  /* ── Dropdown toggle ── */

  function openMenu(menuItem) {
    closeAllMenus();
    var menuId = menuItem.getAttribute('data-menu');
    var dropdown = document.getElementById(menuId);
    if (!dropdown) return;
    menuItem.classList.add('active');
    var rect = menuItem.getBoundingClientRect();
    dropdown.style.left = rect.left + 'px';
    dropdown.style.top = rect.bottom + 'px';
    dropdown.classList.add('open');
    activeMenu = { item: menuItem, dropdown: dropdown };
  }

  function closeAllMenus() {
    navWindow.querySelectorAll('.nav-menu-item.active').forEach(function (el) {
      el.classList.remove('active');
    });
    navWindow.querySelectorAll('.nav-menu-dropdown.open').forEach(function (el) {
      el.classList.remove('open');
    });
    activeMenu = null;
  }

  navWindow.querySelectorAll('.nav-menu-item[data-menu]').forEach(function (item) {
    item.addEventListener('click', function (e) {
      e.stopPropagation();
      if (activeMenu && activeMenu.item === item) {
        closeAllMenus();
      } else {
        openMenu(item);
      }
    });
    // Hover opens if another menu is already open
    item.addEventListener('mouseenter', function () {
      if (activeMenu) openMenu(item);
    });
  });

  document.addEventListener('click', function () {
    closeAllMenus();
  });

  /* ── Menu item actions ── */

  function handleMenuAction(id) {
    var navigate = ns.navigate;
    closeAllMenus();

    switch (id) {
      case 'nav-menu-file-open':
        var url = prompt('Open Location:', 'https://');
        if (url && navigate) navigate(url);
        break;
      case 'nav-menu-file-new':
        if (window.Windows97) {
          window.Windows97.showApp('navigator');
          if (navigate) navigate('about:home');
        }
        break;
      case 'nav-menu-file-save':
        alert('Save As is not implemented in Netscape Navigator 97.');
        break;
      case 'nav-menu-file-print':
        try {
          ns.navIframe && ns.navIframe.contentWindow && ns.navIframe.contentWindow.print();
        } catch (e) { window.print(); }
        break;
      case 'nav-menu-file-offline':
        alert('Go Offline mode is not available in this version.');
        break;
      case 'nav-menu-file-close':
        if (window.Windows97) window.Windows97.hideApp('navigator');
        break;
      case 'nav-menu-edit-find':
        var term = prompt('Find in page:');
        if (term) {
          try {
            ns.navIframe && ns.navIframe.contentWindow && ns.navIframe.contentWindow.find(term);
          } catch (e) {
            console.warn('Error during find operation:', e);
          }
        }
        break;
      case 'nav-menu-edit-prefs':
        alert('Preferences\n\nProxy: api.allorigins.win\nHome: about:home\nSecurity: Standard');
        break;
      case 'nav-menu-view-reload':
        if (ns.navUrlInput && navigate) navigate(ns.navUrlInput.value, false);
        break;
      case 'nav-menu-view-stop':
        var btnStop = ns.navBtnStop || document.getElementById('nav-btn-stop');
        if (btnStop) btnStop.click();
        break;
      case 'nav-menu-view-source':
        alert('View Source is not implemented. Open developer tools to view source.');
        break;
      case 'nav-menu-go-back':
        var btnBack = ns.navBtnBack || document.getElementById('nav-btn-back');
        if (btnBack) btnBack.click();
        break;
      case 'nav-menu-go-forward':
        var btnForward = ns.navBtnForward || document.getElementById('nav-btn-forward');
        if (btnForward) btnForward.click();
        break;
      case 'nav-menu-go-home':
        if (navigate) navigate('about:home');
        break;
      case 'nav-menu-go-search':
        if (navigate) navigate('https://www.google.com');
        break;
      case 'nav-menu-comm-navigator':
        if (window.Windows97) window.Windows97.showApp('navigator');
        break;
      case 'nav-menu-comm-word':
        if (window.Windows97) window.Windows97.showApp('word');
        break;
      case 'nav-menu-comm-vb6':
        if (window.Windows97) window.Windows97.showApp('vb6');
        break;
      case 'nav-menu-help-about':
        alert(
          'Netscape Navigator\nVersion 4.0 (Windows)\n\n' +
          'Copyright \u00a9 1994\u20131997 Netscape Communications Corporation.\n' +
          'All Rights Reserved.\n\n' +
          'This product is licensed under the terms of your\n' +
          'Netscape License Agreement.'
        );
        break;
      case 'nav-menu-help-contents':
        if (navigate) navigate('https://en.wikipedia.org/wiki/Netscape_Navigator');
        break;
    }
  }

  navWindow.querySelectorAll('.nav-menu-dropdown-item[data-action]').forEach(function (item) {
    item.addEventListener('click', function (e) {
      e.stopPropagation();
      handleMenuAction(item.getAttribute('data-action'));
    });
  });
})();
