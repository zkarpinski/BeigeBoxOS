/**
 * Internet Explorer 5 Logic
 */
(function () {
    'use strict';

    const ie5Window = document.getElementById('ie5-window');
    const iframe = document.getElementById('ie5-iframe');
    const urlInput = document.getElementById('ie5-url-input');
    const statusText = document.getElementById('ie5-status-text');
    const favorites = document.querySelectorAll('.ie5-favorite-item');

    // Dialogs/Menus
    const aboutMenu = document.getElementById('ie5-menu-help-about');
    const aboutDialog = document.getElementById('ie5-about-dialog');
    const aboutCloseBtn = document.querySelector('.ie5-about-close');
    const aboutOkBtn = document.querySelector('.ie5-about-ok');

    const helpMenu = document.querySelector('.ie5-menu-item[data-menu="ie5-menu-help"]');
    const helpDropdown = document.getElementById('ie5-menu-help');

    // Favorites Sidebar Close Button
    const sidebarCloseBtn = document.querySelector('.ie5-sidebar-close');
    const sidebar = document.querySelector('.ie5-sidebar');

    const DEFAULT_URL = 'https://web.archive.org/web/19990221081643/http://www.msn.com/';

    window.IE597 = {
        ie5Window,
        iframe,
        urlInput,
        statusText,
        onShow: function () {
            if (!iframe) return;
            var src = iframe.getAttribute('src') || '';
            if (src === 'about:blank' || src === '') {
                var defaultSrc = iframe.getAttribute('data-default-src') || DEFAULT_URL;
                iframe.src = defaultSrc;
                if (urlInput) urlInput.value = 'http://www.msn.com/';
                if (statusText) statusText.textContent = 'Opening page http://www.msn.com/...';
            }
        }
    };

    if (!ie5Window) return;

    // Handle Favorites Click
    favorites.forEach(item => {
        item.addEventListener('click', () => {
            const url = item.getAttribute('data-url');
            if (url) {
                iframe.src = url;
                // Update Address Bar (visually readonly to match spec)
                urlInput.value = url.replace('https://web.archive.org/web/19990221081643/', '')
                                    .replace('https://web.archive.org/web/19990422115127/', '')
                                    .replace('https://web.archive.org/web/19990508164724/', '')
                                    .replace('https://web.archive.org/web/19990422071007/', '');

                if(url.includes('msn.com')) {
                    urlInput.value = 'http://www.msn.com/';
                } else if(url.includes('askjeeves.com')) {
                    urlInput.value = 'http://www.askjeeves.com/';
                } else if(url.includes('aol.com')) {
                    urlInput.value = 'http://www.aol.com/';
                } else if(url.includes('ebay.com')) {
                    urlInput.value = 'http://www.ebay.com/';
                }

                statusText.textContent = "Opening page " + urlInput.value + "...";

                // Simulate loading
                setTimeout(() => {
                    statusText.textContent = "Done";
                }, 1000);
            }
        });
    });

    // Handle Help Menu
    if (helpMenu && helpDropdown) {
        helpMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            helpDropdown.classList.toggle('hidden');
        });

        // Hide dropdown on click outside
        document.addEventListener('click', (e) => {
            if (!helpMenu.contains(e.target) && !helpDropdown.contains(e.target)) {
                helpDropdown.classList.add('hidden');
            }
        });
    }

    // Handle About Dialog
    if (aboutMenu && aboutDialog) {
        aboutMenu.addEventListener('click', () => {
            aboutDialog.classList.remove('hidden');
            if (helpDropdown) helpDropdown.classList.add('hidden');
        });

        const closeAbout = () => {
            aboutDialog.classList.add('hidden');
        };

        if (aboutCloseBtn) aboutCloseBtn.addEventListener('click', closeAbout);
        if (aboutOkBtn) aboutOkBtn.addEventListener('click', closeAbout);
    }

    // Favorites Sidebar Close
    if (sidebarCloseBtn && sidebar) {
        sidebarCloseBtn.addEventListener('click', () => {
            sidebar.style.display = 'none'; // Basic close for now
        });
    }

})();