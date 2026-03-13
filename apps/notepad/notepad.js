/**
 * Notepad - Windows 98 Logic
 */
(function () {
  'use strict';

  const textarea = document.getElementById('notepad-textarea');
  if (!textarea) return;

  window.Notepad98 = {
    textarea,
    currentFile: 'Untitled',
    hasUnsavedChanges: false,
  };

  const updateTitle = () => {
    const titleText = document.querySelector('#notepad-window .title-text');
    if (titleText) {
      titleText.textContent = `${window.Notepad98.currentFile} - Notepad`;
    }
    const taskbarText = document.querySelector('#taskbar-notepad .task-text');
    if (taskbarText) {
      taskbarText.textContent = `${window.Notepad98.currentFile} - Notepad`;
    }
  };

  textarea.addEventListener('input', () => {
    window.Notepad98.hasUnsavedChanges = true;
  });

  const fileInput = document.getElementById('notepad-file-input');

  const fileNew = document.getElementById('notepad-file-new');
  const fileOpen = document.getElementById('notepad-file-open');
  const fileSave = document.getElementById('notepad-file-save');
  const fileSaveAs = document.getElementById('notepad-file-save-as');
  const fileExit = document.getElementById('notepad-file-exit');

  const editUndo = document.getElementById('notepad-edit-undo');
  const editCut = document.getElementById('notepad-edit-cut');
  const editCopy = document.getElementById('notepad-edit-copy');
  const editPaste = document.getElementById('notepad-edit-paste');
  const editDelete = document.getElementById('notepad-edit-delete');
  const editSelectAll = document.getElementById('notepad-edit-select-all');
  const editTimeDate = document.getElementById('notepad-edit-time-date');
  const editWordWrap = document.getElementById('notepad-edit-word-wrap');

  const checkSave = () => {
    if (window.Notepad98.hasUnsavedChanges) {
      return confirm(`The text in the ${window.Notepad98.currentFile} file has changed.\n\nDo you want to save the changes?`);
    }
    return false;
  };

  if (fileNew) {
    fileNew.addEventListener('click', () => {
      if (checkSave()) {
        saveFile();
      }
      textarea.value = '';
      window.Notepad98.currentFile = 'Untitled';
      window.Notepad98.hasUnsavedChanges = false;
      updateTitle();
    });
  }

  if (fileOpen) {
    fileOpen.addEventListener('click', () => {
      if (checkSave()) {
        saveFile();
      }
      if (fileInput) {
        fileInput.click();
      }
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        textarea.value = e.target.result;
        window.Notepad98.currentFile = file.name;
        window.Notepad98.hasUnsavedChanges = false;
        updateTitle();
      };
      reader.readAsText(file);
      fileInput.value = ''; // Reset
    });
  }

  const saveFile = () => {
    const blob = new Blob([textarea.value], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = window.Notepad98.currentFile === 'Untitled' ? 'Untitled.txt' : window.Notepad98.currentFile;
    a.click();
    URL.revokeObjectURL(url);
    window.Notepad98.hasUnsavedChanges = false;
  };
  window.Notepad98.saveFile = saveFile;

  if (fileSave) fileSave.addEventListener('click', saveFile);
  if (fileSaveAs) fileSaveAs.addEventListener('click', () => {
    const newName = prompt('Save As:', window.Notepad98.currentFile === 'Untitled' ? 'Untitled.txt' : window.Notepad98.currentFile);
    if (newName) {
      window.Notepad98.currentFile = newName;
      saveFile();
      updateTitle();
    }
  });

  if (fileExit) {
    fileExit.addEventListener('click', () => {
      if (checkSave()) saveFile();
      if (window.Windows97) window.Windows97.hideApp('notepad');
    });
  }

  // Edit actions
  if (editUndo) editUndo.addEventListener('click', () => document.execCommand('undo'));
  if (editCut) editCut.addEventListener('click', () => document.execCommand('cut'));
  if (editCopy) editCopy.addEventListener('click', () => document.execCommand('copy'));
  if (editPaste) editPaste.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      textarea.value = textarea.value.substring(0, start) + text + textarea.value.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
    } catch (err) {
      console.warn("Clipboard access denied", err);
    }
  });
  if (editDelete) editDelete.addEventListener('click', () => {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start !== end) {
      textarea.value = textarea.value.substring(0, start) + textarea.value.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start;
    }
  });
  if (editSelectAll) editSelectAll.addEventListener('click', () => textarea.select());
  if (editTimeDate) editTimeDate.addEventListener('click', () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const dateStr = now.toLocaleDateString();
    const insertStr = `${timeStr} ${dateStr}`;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    textarea.value = textarea.value.substring(0, start) + insertStr + textarea.value.substring(end);
    textarea.selectionStart = textarea.selectionEnd = start + insertStr.length;
  });

  if (editWordWrap) {
      let isWordWrap = false;
      editWordWrap.addEventListener('click', () => {
          isWordWrap = !isWordWrap;
          if (isWordWrap) {
              textarea.classList.add('word-wrap');
          } else {
              textarea.classList.remove('word-wrap');
          }
      });
  }
})();
