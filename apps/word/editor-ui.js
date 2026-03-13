document.addEventListener('DOMContentLoaded', () => {
    // --------------------------------------------------------
    // Word 97 Editor - focus, toolbar active state, view buttons
    // (Toolbar actions are in apps/word/toolbar.js)
    // --------------------------------------------------------
    const editor = document.getElementById('editor');
    if (!editor) return;

    editor.focus();

    const btnBold = document.getElementById('cmd-bold');
    const btnItalic = document.getElementById('cmd-italic');
    const btnUnderline = document.getElementById('cmd-underline');

    function updateToolbarState() {
        if (btnBold) btnBold.classList.toggle('active', document.queryCommandState('bold'));
        if (btnItalic) btnItalic.classList.toggle('active', document.queryCommandState('italic'));
        if (btnUnderline) btnUnderline.classList.toggle('active', document.queryCommandState('underline'));
    }

    editor.addEventListener('keyup', updateToolbarState);
    editor.addEventListener('mouseup', updateToolbarState);

    // View buttons (active state + wordWindow view class) are in apps/word/statusBar.js
});
