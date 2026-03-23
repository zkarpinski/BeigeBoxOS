'use client';

// ── Notepad inner UI ───────────────────────────────────────────────────────────
// This component contains the Notepad logic and UI without any window chrome
// (no AppWindow wrapper, no shell-specific imports).
//
// File system integration is decoupled via props:
//   - initialContent / initialFileName / initialFilePath: pre-populate editor
//   - onSaveToPath: called when saving to a known path (os-specific write-back)
//   - onExit: called when user clicks Exit (os should hide the window)
//
// Wrap this in an AppWindow in the os-specific layer.

import React, { useState, useRef, useEffect } from 'react';
import './notepad.css';

export interface NotepadMenuBarProps {
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onExit: () => void;
  onUndo: () => void;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDelete: () => void;
  onSelectAll: () => void;
  onTimeDate: () => void;
  onWordWrap: () => void;
}

export function NotepadMenuBar({
  onNew,
  onOpen,
  onSave,
  onSaveAs,
  onExit,
  onUndo,
  onCut,
  onCopy,
  onPaste,
  onDelete,
  onSelectAll,
  onTimeDate,
  onWordWrap,
}: NotepadMenuBarProps) {
  return (
    <div className="notepad-menu-bar">
      <div className="notepad-menu-item" tabIndex={0}>
        <u>F</u>ile
        <div className="notepad-menu-dropdown">
          <div className="notepad-menu-dd-item" onClick={onNew}>
            <u>N</u>ew
          </div>
          <div className="notepad-menu-dd-item" onClick={onOpen}>
            <u>O</u>pen...
          </div>
          <div className="notepad-menu-dd-item" onClick={onSave}>
            <u>S</u>ave
          </div>
          <div className="notepad-menu-dd-item" onClick={onSaveAs}>
            Save <u>A</u>s...
          </div>
          <div className="notepad-menu-dd-divider" />
          <div className="notepad-menu-dd-item" onClick={onExit}>
            E<u>x</u>it
          </div>
        </div>
      </div>
      <div className="notepad-menu-item" tabIndex={0}>
        <u>E</u>dit
        <div className="notepad-menu-dropdown">
          <div className="notepad-menu-dd-item" onClick={onUndo}>
            <u>U</u>ndo
          </div>
          <div className="notepad-menu-dd-divider" />
          <div className="notepad-menu-dd-item" onClick={onCut}>
            Cu<u>t</u>
          </div>
          <div className="notepad-menu-dd-item" onClick={onCopy}>
            <u>C</u>opy
          </div>
          <div className="notepad-menu-dd-item" onClick={onPaste}>
            <u>P</u>aste
          </div>
          <div className="notepad-menu-dd-item" onClick={onDelete}>
            <u>D</u>elete
          </div>
          <div className="notepad-menu-dd-divider" />
          <div className="notepad-menu-dd-item" onClick={onSelectAll}>
            Select <u>A</u>ll
          </div>
          <div className="notepad-menu-dd-item" onClick={onTimeDate}>
            Time/<u>D</u>ate
          </div>
        </div>
      </div>
      <div className="notepad-menu-item" tabIndex={0}>
        <u>S</u>earch
        <div className="notepad-menu-dropdown">
          <div className="notepad-menu-dd-item disabled">
            <u>F</u>ind...
          </div>
        </div>
      </div>
      <div className="notepad-menu-item" tabIndex={0}>
        <u>F</u>ormat
        <div className="notepad-menu-dropdown">
          <div className="notepad-menu-dd-item" onClick={onWordWrap}>
            <u>W</u>ord Wrap
          </div>
        </div>
      </div>
      <div className="notepad-menu-item" tabIndex={0}>
        <u>H</u>elp
        <div className="notepad-menu-dropdown">
          <div className="notepad-menu-dd-item disabled">Help Topics</div>
          <div className="notepad-menu-dd-divider" />
          <div className="notepad-menu-dd-item disabled">About Notepad</div>
        </div>
      </div>
    </div>
  );
}

export interface NotepadContentProps {
  /** Pre-populate filename (e.g. from fileSystem open). */
  initialFileName?: string;
  /** Pre-populate content (e.g. from fileSystem open). */
  initialContent?: string;
  /** Known file path for save-back (os-specific). */
  initialFilePath?: string | null;
  /** Called when saving to a known path. The os layer should write the content back. */
  onSaveToPath?: (path: string, content: string) => void;
  /** Called when user clicks Exit. The os layer should hide the window. */
  onExit?: () => void;
  /** Title bar title for display — managed externally so AppWindow can show it. */
  onTitleChange?: (title: string) => void;
}

export function NotepadContent({
  initialFileName = 'Untitled',
  initialContent = '',
  initialFilePath = null,
  onSaveToPath,
  onExit,
  onTitleChange,
}: NotepadContentProps) {
  const [content, setContent] = useState(initialContent);
  const [currentFile, setCurrentFile] = useState(initialFileName);
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(initialFilePath);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [wordWrap, setWordWrap] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Re-apply when OS layer passes new initial document (e.g. open from Desktop / My Computer).
  useEffect(() => {
    setContent(initialContent);
    setCurrentFile(initialFileName);
    setCurrentFilePath(initialFilePath);
    setHasUnsaved(false);
  }, [initialFileName, initialContent, initialFilePath]);

  // Notify parent of title changes
  useEffect(() => {
    onTitleChange?.(`${currentFile} - Notepad`);
  }, [currentFile, onTitleChange]);

  function checkSave(): boolean {
    if (hasUnsaved) {
      return window.confirm(
        `The text in the ${currentFile} file has changed.\n\nDo you want to save the changes?`,
      );
    }
    return false;
  }

  function saveFile(name: string = currentFile) {
    if (currentFilePath && onSaveToPath) {
      onSaveToPath(currentFilePath, content);
      setHasUnsaved(false);
      return;
    }
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name === 'Untitled' ? 'Untitled.txt' : name;
    a.click();
    URL.revokeObjectURL(url);
    setHasUnsaved(false);
  }

  function handleNew() {
    if (checkSave()) saveFile();
    setContent('');
    setCurrentFile('Untitled');
    setCurrentFilePath(null);
    setHasUnsaved(false);
  }

  function handleOpen() {
    if (checkSave()) saveFile();
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setContent(ev.target!.result as string);
      setCurrentFile(file.name);
      setHasUnsaved(false);
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function handleSave() {
    saveFile();
  }

  function handleSaveAs() {
    const newName = window.prompt(
      'Save As:',
      currentFile === 'Untitled' ? 'Untitled.txt' : currentFile,
    );
    if (newName) {
      setCurrentFile(newName);
      setCurrentFilePath(null);
      saveFile(newName);
    }
  }

  function handleExit() {
    if (checkSave()) saveFile();
    onExit?.();
  }

  function handleUndo() {
    document.execCommand('undo');
  }

  function handleCut() {
    document.execCommand('cut');
  }

  function handleCopy() {
    document.execCommand('copy');
  }

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const next = content.substring(0, start) + text + content.substring(end);
      setContent(next);
      setHasUnsaved(true);
      setTimeout(() => {
        if (ta) {
          ta.selectionStart = ta.selectionEnd = start + text.length;
        }
      }, 0);
    } catch (err) {
      console.warn('Clipboard access denied', err);
    }
  }

  function handleDelete() {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    if (start !== end) {
      const next = content.substring(0, start) + content.substring(end);
      setContent(next);
      setHasUnsaved(true);
      setTimeout(() => {
        if (ta) ta.selectionStart = ta.selectionEnd = start;
      }, 0);
    }
  }

  function handleSelectAll() {
    textareaRef.current?.select();
  }

  function handleTimeDate() {
    const ta = textareaRef.current;
    if (!ta) return;
    const now = new Date();
    const str = `${now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} ${now.toLocaleDateString()}`;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const next = content.substring(0, start) + str + content.substring(end);
    setContent(next);
    setHasUnsaved(true);
    setTimeout(() => {
      if (ta) ta.selectionStart = ta.selectionEnd = start + str.length;
    }, 0);
  }

  function handleWordWrap() {
    setWordWrap((w) => !w);
  }

  return (
    <>
      <NotepadMenuBar
        onNew={handleNew}
        onOpen={handleOpen}
        onSave={handleSave}
        onSaveAs={handleSaveAs}
        onExit={handleExit}
        onUndo={handleUndo}
        onCut={handleCut}
        onCopy={handleCopy}
        onPaste={handlePaste}
        onDelete={handleDelete}
        onSelectAll={handleSelectAll}
        onTimeDate={handleTimeDate}
        onWordWrap={handleWordWrap}
      />
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        accept=".txt"
        aria-hidden
        onChange={handleFileChange}
      />
      <div className="notepad-textarea-container">
        <textarea
          ref={textareaRef}
          className={`notepad-textarea${wordWrap ? ' word-wrap' : ''}`}
          spellCheck={false}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setHasUnsaved(true);
          }}
        />
      </div>
    </>
  );
}
