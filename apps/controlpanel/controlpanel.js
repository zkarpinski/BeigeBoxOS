/**
 * Control Panel – App namespace and Display Properties logic.
 */
(function () {
  'use strict';

  window.ControlPanel97 = {
    cpWindow: null,
    displayDialog: null,
    // Wallpapers: id → { label, src (null = none) }
    wallpapers: [
      { id: 'none',  label: '(None)',  src: null },
      { id: 'clouds', label: 'Clouds', src: 'shell/images/clouds.png' },
    ],
    // Currently pending (not yet applied) selection
    pendingWallpaper: null,
    // Currently applied wallpaper id
    appliedWallpaper: 'none',
  };
})();
