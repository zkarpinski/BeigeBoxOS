/**
 * Napster v2.0 BETA – Tab switching.
 */
(function () {
  'use strict';

  var ns = window.Napster97;
  if (!ns) return;

  function switchTab(tabId) {
    document.querySelectorAll('#napster-window .napster-tab').forEach(function (t) {
      t.classList.toggle('active', t.getAttribute('data-tab') === tabId);
    });
    document.querySelectorAll('#napster-window .napster-panel').forEach(function (p) {
      p.classList.toggle('active', p.getAttribute('data-panel') === tabId);
    });
    ns.activeTab = tabId;
  }

  document.querySelectorAll('#napster-window .napster-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      switchTab(tab.getAttribute('data-tab'));
    });
  });

  ns.switchTab = switchTab;

  // Default: Search tab
  switchTab('search');
})();
