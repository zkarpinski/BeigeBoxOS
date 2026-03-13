document.addEventListener('DOMContentLoaded', () => {
    // When Windows 97 shell is present, apps/word/window.js handles close, taskbar, Start menu
    if (window.Windows97) return;

    // --------------------------------------------------------
    // Fallback: Window Management when shell not loaded
    // --------------------------------------------------------
    const wordWindow = document.getElementById('word-window');
    const btnMin = document.querySelector('.icon-min')?.closest('.win-btn');
    const btnMax = document.querySelector('.icon-max')?.closest('.win-btn');
    const btnClose = document.querySelector('.icon-close')?.closest('.win-btn');
    const docCloseBtn = document.querySelector('.doc-close-btn');
    const taskbarTask = document.querySelector('.taskbar-task');
    const startMenuWord = document.getElementById('start-menu-word');
    const startMenu = document.getElementById('start-menu');
    const startButton = document.getElementById('start-button');
    const menuExit = document.getElementById('menu-file-exit');
    const menuFile = document.getElementById('menu-file');

    function closeWordWindow() {
        if (confirm('Do you want to save changes to Document1?')) {
            if (window.Word97 && typeof window.Word97.saveAsDoc === 'function') {
                window.Word97.saveAsDoc();
            }
        }
        if (wordWindow) wordWindow.style.display = 'none';
        if (taskbarTask) {
            taskbarTask.style.display = 'none';
            taskbarTask.classList.remove('active');
        }
    }
    window.closeWordWindow = closeWordWindow;

    // File → Exit
    if (menuExit) {
        menuExit.addEventListener('click', () => {
            if (menuFile) menuFile.classList.add('hidden');
            closeWordWindow();
        });
    }

    // Title bar Close
    if (btnClose) btnClose.addEventListener('click', closeWordWindow);

    // Menu bar doc close (X)
    if (docCloseBtn) docCloseBtn.addEventListener('click', closeWordWindow);

    // Minimize
    if (btnMin) {
        btnMin.addEventListener('click', () => {
            if (wordWindow) wordWindow.style.display = 'none';
            if (taskbarTask) taskbarTask.classList.remove('active');
        });
    }

    // Maximize/Restore
    if (btnMax) {
        btnMax.addEventListener('click', () => {
            if (wordWindow) wordWindow.classList.toggle('windowed');
        });
    }

    // Taskbar Click
    if (taskbarTask) {
        taskbarTask.addEventListener('click', () => {
            if (wordWindow) {
                if (wordWindow.style.display === 'none') {
                    wordWindow.style.display = 'flex';
                    taskbarTask.classList.add('active');
                } else if (taskbarTask.classList.contains('active')) {
                    wordWindow.style.display = 'none';
                    taskbarTask.classList.remove('active');
                } else {
                    wordWindow.style.display = 'flex';
                    taskbarTask.classList.add('active');
                }
            }
        });
    }

    // Start Menu Word Click
    if (startMenuWord) {
        startMenuWord.addEventListener('click', (e) => {
            e.stopPropagation();
            if (wordWindow) wordWindow.style.display = 'flex';
            if (taskbarTask) {
                taskbarTask.style.display = 'flex';
                taskbarTask.classList.add('active');
            }
            if (startMenu) startMenu.classList.add('hidden');
            if (startButton) startButton.classList.remove('active');
        });
    }
});
