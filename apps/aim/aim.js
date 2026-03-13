/**
 * AIM 97 – AOL Instant Messenger replica.
 * Namespace initialization.
 */
(function () {
  'use strict';

  window.AIM97 = {
    screenName: 'F4$tRunn3r200',
    awayMessage: null,       // null = not away; string = away message text
    awayReplySent: false,    // only auto-reply once per chat session
    chatOpen: false,

    buddies: [
      { name: 'zkarpinski', status: 'away',    group: 'Buddies',
        away: "omg brb!!! listening 2 blink-182 ~all the small things~ n doin sum hw. ttyl!!! :-)" },
      { name: 'sk8erBoi99',       status: 'offline', group: 'Offline' },
      { name: 'xXDarkAngelXx',    status: 'offline', group: 'Offline' },
      { name: 'NSync4ever_gurl',  status: 'offline', group: 'Offline' },
      { name: 'TRL_addict_2003',  status: 'offline', group: 'Offline' },
    ],

    // DOM refs set after DOMContentLoaded
    aimWindow: null,
    chatWindow: null,
    chatLog: null,
    chatInput: null,
    typingIndicator: null,
    statusStrip: null,
  };
})();
