document.addEventListener('DOMContentLoaded', () => {
    // --------------------------------------------------------
    // Windows 95 Taskbar & Start Menu
    // --------------------------------------------------------
    const startButton = document.getElementById('start-button');
    const startMenu = document.getElementById('start-menu');

    startButton.addEventListener('click', (e) => {
        e.stopPropagation();
        startMenu.classList.toggle('hidden');
        startButton.classList.toggle('active');
    });

    // Start menu item click: special items (shutdown, pinball) or shell app items
    startMenu.addEventListener('click', (e) => {
        const item = e.target.closest('.start-menu-item');
        if (!item || !item.id) return;
        if (item.id === 'start-run') {
            startMenu.classList.add('hidden');
            startButton.classList.remove('active');
            if (window.Run97) window.Run97.open();
            return;
        }
        if (item.id === 'start-windows-update') {
            startMenu.classList.add('hidden');
            startButton.classList.remove('active');
            if (window.WindowsUpdate97) window.WindowsUpdate97.open();
            return;
        }
        if (item.id === 'start-shutdown' || item.id === 'start-pinball') {
            startMenu.classList.add('hidden');
            startButton.classList.remove('active');
            return;
        }
        if (window.Windows97 && window.Windows97.handleStartMenuItem(item.id)) {
            startMenu.classList.add('hidden');
            startButton.classList.remove('active');
        }
    });

    // Close start menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!startMenu.classList.contains('hidden') && !startMenu.contains(e.target) && e.target !== startButton) {
            startMenu.classList.add('hidden');
            startButton.classList.remove('active');
        }
    });

    // Clock update
    const clock = document.getElementById('clock');
    const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    function updateClock() {
        const now = new Date(Date.now() + (window.Win98TimeOffset || 0));
        let hours = now.getHours();
        let minutes = now.getMinutes();

        minutes = minutes < 10 ? '0' + minutes : minutes;

        clock.textContent = hours + ':' + minutes;
        clock.title = DAYS[now.getDay()] + ', ' + MONTHS[now.getMonth()] + ' ' +
            String(now.getDate()).padStart(2, '0') + ', ' + now.getFullYear();
    }
    updateClock();
    setInterval(updateClock, 1000); // update every second

    // Volume icon toggle
    var volIcon = document.getElementById('tray-volume');
    var volPopup = document.getElementById('volume-popup');
    var volSlider = document.getElementById('volume-slider');
    if (volIcon && volPopup) {
        volIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            volPopup.classList.toggle('hidden');
        });
        document.addEventListener('click', function(e) {
            if (!volPopup.contains(e.target) && e.target !== volIcon) {
                volPopup.classList.add('hidden');
            }
        });
        if (volSlider) {
            volSlider.addEventListener('input', function() {
                var v = parseInt(this.value);
                volIcon.textContent = v === 0 ? '🔇' : v < 50 ? '🔉' : '🔊';
            });
        }
    }
});
