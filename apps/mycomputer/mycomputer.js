/**
 * My Computer — filesystem tree and navigation logic.
 */
(function () {
  'use strict';

  var win = document.getElementById('mycomputer-window');
  if (!win) return;

  // ── Fake filesystem ───────────────────────────────────────────────────────
  var FOLDER_ICON = 'assets/icons/folder-0.png';

  var FS_ROOT = [
    {
      id: 'floppy',
      name: '3½ Floppy (A:)',
      type: 'drive',
      icon: 'assets/icons/floppy_drive-0.png',
      children: null, // no disk
    },
    {
      id: 'c',
      name: 'Local Disk (C:)',
      type: 'drive',
      icon: 'assets/icons/hard_disk_drive-0.png',
      children: [
        {
          id: 'mydocs',
          name: 'My Documents',
          type: 'folder',
          icon: 'assets/icons/folder_document-0.png',
          children: [
            {
              id: 'resume',
              name: 'My Resume.doc',
              type: 'file',
              icon: 'assets/icons/microsoft_word-2.png',
              action: 'word',
            },
          ],
        },
        {
          id: 'progfiles',
          name: 'Program Files',
          type: 'folder',
          icon: FOLDER_ICON,
          children: [
            { id: 'msoffice',  name: 'Microsoft Office',         type: 'folder', icon: FOLDER_ICON, children: [] },
            { id: 'netscape',  name: 'Netscape Communicator',    type: 'folder', icon: FOLDER_ICON, children: [] },
            { id: 'aim_dir',   name: 'AIM',                      type: 'folder', icon: FOLDER_ICON, children: [] },
            { id: 'winamp_dir',name: 'Winamp',                   type: 'folder', icon: FOLDER_ICON, children: [] },
            { id: 'napster_dir',name: 'Napster',                 type: 'folder', icon: FOLDER_ICON, children: [] },
          ],
        },
        {
          id: 'windows',
          name: 'Windows',
          type: 'folder',
          icon: 'assets/icons/windows_program_manager-0.png',
          children: [
            { id: 'system', name: 'System',  type: 'folder', icon: FOLDER_ICON, children: [] },
            { id: 'temp',   name: 'Temp',    type: 'folder', icon: FOLDER_ICON, children: [] },
            { id: 'fonts',  name: 'Fonts',   type: 'folder', icon: FOLDER_ICON, children: [] },
          ],
        },
      ],
    },
    {
      id: 'cdrom',
      name: 'CD-ROM Drive (D:)',
      type: 'drive',
      icon: 'assets/icons/cd_drive-0.png',
      children: null, // no disc
    },
  ];

  // ── State ─────────────────────────────────────────────────────────────────
  var history = [null]; // null = My Computer root
  var histPos = 0;
  var currentNode = null;

  // ── DOM refs ──────────────────────────────────────────────────────────────
  var contentEl  = document.getElementById('mc-content');
  var addressEl  = document.getElementById('mc-address');
  var statusEl   = document.getElementById('mc-status-text');
  var titleEl    = document.getElementById('mc-title-text');
  var btnBack    = document.getElementById('mc-btn-back');
  var btnFwd     = document.getElementById('mc-btn-fwd');
  var btnUp      = document.getElementById('mc-btn-up');

  // ── Navigation ────────────────────────────────────────────────────────────
  function getItems(node) {
    if (!node) return FS_ROOT;
    return node.children || [];
  }

  function getLabel(node) {
    return node ? node.name : 'My Computer';
  }

  function navigate(node) {
    history = history.slice(0, histPos + 1);
    history.push(node);
    histPos++;
    currentNode = node;
    render();
  }

  function goBack() {
    if (histPos <= 0) return;
    histPos--;
    currentNode = history[histPos];
    render();
  }

  function goForward() {
    if (histPos >= history.length - 1) return;
    histPos++;
    currentNode = history[histPos];
    render();
  }

  function goUp() {
    if (!currentNode) return;
    // Find parent by searching the tree
    var parent = findParent(FS_ROOT, currentNode);
    navigate(parent); // parent may be null (= root)
  }

  function findParent(items, target) {
    for (var i = 0; i < items.length; i++) {
      if (items[i] === target) return null; // direct child of root
      if (items[i].children) {
        for (var j = 0; j < items[i].children.length; j++) {
          if (items[i].children[j] === target) return items[i];
          var deeper = findParentIn(items[i].children, target);
          if (deeper !== undefined) return deeper;
        }
      }
    }
    return null;
  }

  function findParentIn(items, target) {
    for (var i = 0; i < items.length; i++) {
      if (items[i] === target) return items[i]; // placeholder; caller checks children
      if (items[i].children) {
        for (var j = 0; j < items[i].children.length; j++) {
          if (items[i].children[j] === target) return items[i];
          var r = findParentIn(items[i].children, target);
          if (r !== undefined) return r;
        }
      }
    }
    return undefined;
  }

  // ── Render ────────────────────────────────────────────────────────────────
  function render() {
    var items = getItems(currentNode);
    var label = getLabel(currentNode);

    addressEl.textContent = label;
    if (titleEl) titleEl.textContent = label;

    btnBack.disabled = histPos <= 0;
    btnFwd.disabled  = histPos >= history.length - 1;
    btnUp.disabled   = !currentNode;

    contentEl.innerHTML = '';

    if (!items || items.length === 0) {
      var empty = document.createElement('div');
      empty.style.cssText = 'padding:12px;font-size:11px;color:#666;';
      empty.textContent = 'This folder is empty.';
      contentEl.appendChild(empty);
      statusEl.textContent = '0 object(s)';
      return;
    }

    items.forEach(function (item) {
      var el = document.createElement('div');
      el.className = 'mc-icon';

      var img = document.createElement('img');
      img.src = item.icon;
      img.alt = item.name;
      el.appendChild(img);

      var lbl = document.createElement('div');
      lbl.className = 'mc-icon-label';
      lbl.textContent = item.name;
      el.appendChild(lbl);

      var clicks = 0, timer = null;
      el.addEventListener('click', function (e) {
        e.stopPropagation();
        contentEl.querySelectorAll('.mc-icon.selected').forEach(function (s) {
          s.classList.remove('selected');
        });
        el.classList.add('selected');
        statusEl.textContent = item.name;
        clicks++;
        if (clicks === 1) {
          timer = setTimeout(function () { clicks = 0; }, 400);
        } else {
          clearTimeout(timer);
          clicks = 0;
          openItem(item);
        }
      });

      contentEl.appendChild(el);
    });

    // Deselect on background click
    contentEl.addEventListener('click', function (e) {
      if (e.target === contentEl) {
        contentEl.querySelectorAll('.mc-icon.selected').forEach(function (s) {
          s.classList.remove('selected');
        });
        statusEl.textContent = items.length + ' object(s)';
      }
    });

    statusEl.textContent = items.length + ' object(s)';
  }

  function openItem(item) {
    if (item.type === 'drive' && item.children === null) {
      if (window.Windows97) {
        window.Windows97.alert(
          'My Computer',
          'There is no disk in drive ' + item.id.toUpperCase() + ':\\.\n\nInsert a disk, and then try again.',
          'error'
        );
      }
      return;
    }
    if (item.type === 'folder' || item.type === 'drive') {
      navigate(item);
      return;
    }
    if (item.type === 'file' && item.action) {
      if (window.Windows97) window.Windows97.showApp(item.action);
      return;
    }
  }

  // ── Toolbar buttons ───────────────────────────────────────────────────────
  btnBack.addEventListener('click', goBack);
  btnFwd.addEventListener('click', goForward);
  btnUp.addEventListener('click', goUp);

  // ── Initial render ────────────────────────────────────────────────────────
  render();

  // ── Public API ────────────────────────────────────────────────────────────
  window.MyComputer97 = {
    navigate: navigate,
    goBack: goBack,
    goForward: goForward,
    goUp: goUp,
    reset: function () {
      history = [null];
      histPos = 0;
      currentNode = null;
      render();
    },
  };
})();
