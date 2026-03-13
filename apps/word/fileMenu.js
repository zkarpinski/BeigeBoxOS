document.addEventListener('DOMContentLoaded', () => {
    // --------------------------------------------------------
    // File Menu Actions (open/close handled by apps/word/menus.js)
    // --------------------------------------------------------
    const menuNew = document.getElementById('menu-file-new');
    const menuOpen = document.getElementById('menu-file-open');
    const menuSave = document.getElementById('menu-file-save');
    const menuPrint = document.getElementById('menu-file-print');
    const menuExit = document.getElementById('menu-file-exit');
    const fileInput = document.getElementById('file-input');
    const editorEl = document.getElementById('editor');
    const menuFile = document.getElementById('menu-file');

    function closeFileMenu() {
        if (menuFile) menuFile.classList.add('hidden');
    }

    // New
    menuNew.addEventListener('click', () => {
        editorEl.innerHTML = '<p><br></p>';
        closeFileMenu();
    });

    // Open (same logic as toolbar: .txt,.html,.doc,.rtf; HTML vs plain text)
    menuOpen.addEventListener('click', () => {
        fileInput.click();
        closeFileMenu();
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        e.target.value = '';

        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target.result;
            const isHtml = /<(?:\w+|!\s*DOCTYPE|!\s*--)/i.test(text);
            if (isHtml) {
                const sanitizeHTML = window.Word97 && window.Word97.sanitizeHTML;
                editorEl.innerHTML = sanitizeHTML ? sanitizeHTML(text) : text;
            } else {
                editorEl.innerText = text;
            }
            if (window.Word97 && window.Word97.updateStatusBar) window.Word97.updateStatusBar();
        };
        reader.readAsText(file);
    });

    // Save (use Word97 saveAsDoc = .doc when available)
    menuSave.addEventListener('click', () => {
        closeFileMenu();
        if (window.Word97 && window.Word97.saveAsDoc) {
            window.Word97.saveAsDoc();
        } else {
            const content = editorEl.innerHTML;
            const blob = new Blob([content], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'document.html';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    });

    // Print
    menuPrint.addEventListener('click', () => {
        closeFileMenu();
        window.print();
    });

    // File → Exit is handled in windowManager.js (save prompt + close window)
});
