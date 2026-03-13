/**
 * AIM 97 – Chat window logic.
 * Send messages, auto-reply from zkarpinski, typing indicator, emoji.
 */
(function () {
  'use strict';

  var ns = window.AIM97;
  if (!ns) return;

  var chatLog      = document.getElementById('aim-chat-log');
  var chatInput    = document.getElementById('aim-chat-input');
  var typingEl     = document.getElementById('aim-typing-indicator');
  var sendBtn      = document.getElementById('aim-send-btn');

  ns.chatLog    = chatLog;
  ns.chatInput  = chatInput;

  /* ── Emoji conversion (classic AIM) ── */
  var EMOJIS = {
    ':-)': '🙂', ':)': '🙂', ':-(': '😞', ':(': '😞',
    ':-P': '😛', ':P': '😛', ';-)': '😉', ';)': '😉',
    ':-D': '😄', ':D': '😄', ':-O': '😮', ':O': '😮',
    ':-|': '😐', ':|': '😐', ':-*': '😘',
    '<3': '❤️', '^_^': '😊', 'lol': 'lol',
  };

  function replaceEmojis(text) {
    Object.keys(EMOJIS).forEach(function (key) {
      if (key === 'lol') return; // don't replace text
      text = text.split(key).join(EMOJIS[key]);
    });
    return text;
  }

  /* ── Append message to log ── */
  function appendMsg(type, name, text) {
    if (!chatLog) return;
    var div = document.createElement('div');
    div.className = 'aim-msg ' + type;

    if (type === 'system' || type === 'away-response') {
      div.textContent = text;
    } else {
      var nameSpan = document.createElement('span');
      nameSpan.className = 'aim-msg-name';
      nameSpan.textContent = name + ':';
      var textNode = document.createTextNode(' ' + replaceEmojis(text));
      div.appendChild(nameSpan);
      div.appendChild(textNode);
    }

    chatLog.appendChild(div);
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  /* ── Typing indicator ── */
  function showTyping(name) {
    if (typingEl) typingEl.textContent = name + ' is typing a message...';
  }
  function clearTyping() {
    if (typingEl) typingEl.textContent = '';
  }

  /* ── Send message ── */
  function sendMessage() {
    if (!chatInput) return;
    var text = chatInput.value.trim();
    if (!text) return;

    // Append user's message
    appendMsg('sent', ns.screenName, text);
    chatInput.value = '';

    var buddy = ns.currentBuddy;
    if (!buddy) return;

    // Auto-response from zkarpinski (away)
    if (buddy.status === 'away' && !ns.awayReplySent) {
      ns.awayReplySent = true;
      showTyping(buddy.name);

      setTimeout(function () {
        clearTyping();
        appendMsg('system', '', 'Auto response from ' + buddy.name + ': ' + buddy.away);
      }, 1400);

    } else if (buddy.status === 'away' && ns.awayReplySent) {
      // Already sent auto-response — show subtle reminder once in a while
      // (no further responses from offline/away buddy)
    }
  }

  /* ── Event listeners ── */
  if (chatInput) {
    chatInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  if (sendBtn) {
    sendBtn.addEventListener('click', sendMessage);
  }

  /* ── Action buttons ── */
  document.getElementById('aim-action-warn')?.addEventListener('click', function () {
    alert('Warning!\n\nYou have warned ' + (ns.currentBuddy ? ns.currentBuddy.name : 'this user') + '.\n\nWarning Level: 10%\n\n(Warnings reduce a user\'s ability to send messages.)');
  });

  document.getElementById('aim-action-block')?.addEventListener('click', function () {
    if (!ns.currentBuddy) return;
    alert(ns.currentBuddy.name + ' has been blocked.\n\nThey will not be able to send you messages.');
  });

  document.getElementById('aim-action-addbuddy')?.addEventListener('click', function () {
    alert('Add Buddy\n\nBuddy list management is not fully supported in this version.');
  });

  document.getElementById('aim-action-getinfo')?.addEventListener('click', function () {
    if (!ns.currentBuddy) return;
    var profile = document.getElementById('aim-profile-dialog');
    if (!profile) return;
    var content = document.getElementById('aim-profile-content');
    if (content) {
      content.innerHTML =
        '<b>Screen Name:</b> ' + ns.currentBuddy.name + '<br>' +
        '<b>Member Since:</b> February 1998<br>' +
        '<b>Last On:</b> Today<br><br>' +
        '<hr>' +
        '<i>:: my info ::</i><br>' +
        'hey wats up lol. im just here chillin. add me if u kno me<br><br>' +
        'music: blink-182, linkin park, good charlotte, simple plan<br>' +
        'movies: the matrix, hackers, fight club<br>' +
        'quote: "punk\'s not dead" -- unless ur a poser lol<br><br>' +
        '<font color="#0000ff">~*~ zkarpinski ~*~ AIM since \'98 ~*~</font>';
    }
    profile.classList.add('open');
  });

  // Close profile on click outside
  document.addEventListener('click', function (e) {
    var profile = document.getElementById('aim-profile-dialog');
    if (profile && profile.classList.contains('open')) {
      if (!profile.contains(e.target) && e.target.id !== 'aim-action-getinfo') {
        profile.classList.remove('open');
      }
    }
  });

  /* ── Format bar buttons (cosmetic) ── */
  document.getElementById('aim-fmt-bold')?.addEventListener('click', function () {
    if (chatInput) chatInput.focus();
  });
  document.getElementById('aim-fmt-italic')?.addEventListener('click', function () {
    if (chatInput) chatInput.focus();
  });

  /* ── Sound on new incoming message (visual bell) ── */
  ns.notifyNewMessage = function (buddyName) {
    var buddyEl = document.querySelector('[data-buddy="' + buddyName + '"]');
    if (buddyEl) {
      buddyEl.classList.add('flash');
      setTimeout(function () { buddyEl.classList.remove('flash'); }, 1000);
    }
  };
})();
