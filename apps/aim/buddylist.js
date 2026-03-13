/**
 * AIM 97 – Buddy list logic.
 * Group expand/collapse, buddy double-click to chat, menus, away message.
 */
(function () {
  'use strict';

  var ns = window.AIM97;
  if (!ns) return;

  /* ── Group toggle ── */
  document.querySelectorAll('.aim-group-header').forEach(function (header) {
    header.addEventListener('click', function () {
      var group = header.closest('.aim-group');
      if (group) group.classList.toggle('collapsed');
    });
  });

  /* ── Open chat on buddy double-click ── */
  var allBuddyItems = document.querySelectorAll('.aim-buddy-item');
  document.querySelectorAll('.aim-buddy-item.online, .aim-buddy-item.away').forEach(function (item) {
    item.addEventListener('dblclick', function () {
      var buddyName = item.getAttribute('data-buddy');
      openChat(buddyName);
    });
    // Single click selects
    item.addEventListener('click', function () {
      allBuddyItems.forEach(function (b) {
        b.style.background = '';
        b.style.color = '';
      });
      item.style.background = '#0000a0';
      item.style.color = '#fff';
    });
  });

  function openChat(buddyName) {
    var chatWindow = ns.chatWindow;
    if (!chatWindow) return;
    var buddy = ns.buddies.find(function (b) { return b.name === buddyName; });
    if (!buddy) return;

    // Update chat window title
    var titleText = chatWindow.querySelector('.title-text');
    if (titleText) titleText.textContent = buddyName + ' - Instant Message';

    // Update warning label
    var warnLabel = chatWindow.querySelector('.aim-chat-warning-label');
    if (warnLabel) warnLabel.textContent = buddyName + "'s Warning Level: 0%";

    // Show away notice if buddy is away
    var chatLog = document.getElementById('aim-chat-log');
    if (chatLog && !ns.chatOpen) {
      chatLog.innerHTML = '';
      if (buddy.status === 'away') {
        var awayNotice = document.createElement('div');
        awayNotice.className = 'aim-msg system';
        awayNotice.textContent = buddyName + ' is away. You may still send messages.';
        chatLog.appendChild(awayNotice);
      }
    }

    ns.chatOpen = true;
    ns.currentBuddy = buddy;
    chatWindow.style.display = 'flex';
    chatWindow.style.zIndex = 50;

    // Focus input
    var input = document.getElementById('aim-chat-input');
    if (input) input.focus();

    // Flash buddy in list
    allBuddyItems.forEach(function (b) {
      b.style.background = '';
      b.style.color = '';
    });
  }

  ns.openChat = openChat;

  /* ── Menu bar ── */
  var activeMenu = null;

  function openAimMenu(menuItem) {
    closeAimMenus();
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

  function closeAimMenus() {
    document.querySelectorAll('.aim-menu-item.active').forEach(function (el) {
      el.classList.remove('active');
    });
    document.querySelectorAll('.aim-menu-dropdown.open').forEach(function (el) {
      el.classList.remove('open');
    });
    activeMenu = null;
  }

  var aimWindow = ns.aimWindow;
  if (aimWindow) {
    aimWindow.querySelectorAll('.aim-menu-item[data-menu]').forEach(function (item) {
      item.addEventListener('click', function (e) {
        e.stopPropagation();
        if (activeMenu && activeMenu.item === item) {
          closeAimMenus();
        } else {
          openAimMenu(item);
        }
      });
      item.addEventListener('mouseenter', function () {
        if (activeMenu) openAimMenu(item);
      });
    });
  }

  document.addEventListener('click', closeAimMenus);

  /* ── Menu actions ── */
  function handleAimMenuAction(action) {
    closeAimMenus();
    switch (action) {
      case 'aim-set-away':
        openAwayDialog();
        break;
      case 'aim-cancel-away':
        setAway(null);
        break;
      case 'aim-edit-profile':
        alert('Edit Profile\n\nScreen Name: ' + ns.screenName + '\n\nProfile editing is not supported in this version.');
        break;
      case 'aim-sign-off':
        if (window.Windows97) window.Windows97.hideApp('aim');
        if (ns.chatWindow) ns.chatWindow.style.display = 'none';
        break;
      case 'aim-send-im':
        var name = prompt('Send Instant Message to:');
        if (name) ns.openChat({ name: name, status: 'offline' });
        break;
      case 'aim-add-buddy':
        alert('Add Buddy\n\nBuddy list management is not available in this version.');
        break;
    }
  }

  document.querySelectorAll('.aim-menu-dd-item[data-action]').forEach(function (item) {
    item.addEventListener('click', function (e) {
      e.stopPropagation();
      handleAimMenuAction(item.getAttribute('data-action'));
    });
  });

  /* ── Away message ── */
  var awayDialog = document.getElementById('aim-away-dialog');
  var awayTextarea = document.getElementById('aim-away-textarea');

  function openAwayDialog() {
    if (!awayDialog) return;
    if (awayTextarea) awayTextarea.value = ns.awayMessage || "brb!! back in a few :-)";
    awayDialog.classList.add('open');
  }

  document.getElementById('aim-away-ok')?.addEventListener('click', function () {
    var msg = awayTextarea ? awayTextarea.value.trim() : '';
    setAway(msg || null);
    awayDialog.classList.remove('open');
  });
  document.getElementById('aim-away-cancel')?.addEventListener('click', function () {
    awayDialog && awayDialog.classList.remove('open');
  });

  function setAway(msg) {
    ns.awayMessage = msg;
    var strip = ns.aimWindow && ns.aimWindow.querySelector('.aim-status-strip');
    var nameEl = ns.aimWindow && ns.aimWindow.querySelector('.aim-status-strip-name');
    if (msg) {
      if (strip) strip.classList.add('aim-status-away');
      if (nameEl) nameEl.textContent = ns.screenName + ' (Away)';
      var titleText = ns.aimWindow && ns.aimWindow.querySelector('.title-text');
      if (titleText) titleText.textContent = ns.screenName + ' (Away)';
    } else {
      if (strip) strip.classList.remove('aim-status-away');
      if (nameEl) nameEl.textContent = ns.screenName;
      var titleText2 = ns.aimWindow && ns.aimWindow.querySelector('.title-text');
      if (titleText2) titleText2.textContent = ns.screenName;
    }
  }

  ns.setAway = setAway;

  /* ── Bottom bar shortcuts ── */
  document.getElementById('aim-im-btn')?.addEventListener('click', function () {
    openChat('zkarpinski');
  });
  document.getElementById('aim-away-btn')?.addEventListener('click', function () {
    openAwayDialog();
  });
  document.getElementById('aim-signoff-btn')?.addEventListener('click', function () {
    if (window.Windows97) window.Windows97.hideApp('aim');
    if (ns.chatWindow) ns.chatWindow.style.display = 'none';
  });
})();
