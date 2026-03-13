/**
 * Netscape Navigator 97 - Namespace initialization.
 * Creates window.Navigator97 with shared element references.
 */
(function () {
  'use strict';

  const navWindow = document.getElementById('navigator-window');
  const navIframe = document.getElementById('nav-iframe');
  const navUrlInput = document.getElementById('nav-url-input');
  const navStatusText = document.getElementById('nav-status-text');
  const navProgressBar = document.getElementById('nav-progress-bar');
  const navThrobber = document.getElementById('nav-throbber');
  const navSecurityIcon = document.getElementById('nav-security-icon');
  const navBtnBack = document.getElementById('nav-btn-back');
  const navBtnForward = document.getElementById('nav-btn-forward');
  const navBtnStop = document.getElementById('nav-btn-stop');

  window.Navigator97 = {
    navWindow,
    navIframe,
    navUrlInput,
    navStatusText,
    navProgressBar,
    navThrobber,
    navSecurityIcon,
    navBtnBack,
    navBtnForward,
    navBtnStop,
  };
})();
