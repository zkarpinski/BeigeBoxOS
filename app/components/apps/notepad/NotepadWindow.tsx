'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AppWindow } from '../../win98/AppWindow';
import { TitleBar } from '../../win98/TitleBar';
import NotepadMenuBar from './NotepadMenuBar';
import type { AppConfig } from '../../../types/app-config';
import { useWindowManager } from '../../../context/WindowManagerContext';
import { NOTEPAD_PENDING_KEY, writeFile } from '../../../fileSystem';

const NOTEPAD_ICON_SRC = 'apps/notepad/notepad-icon.png';

export const notepadAppConfig: AppConfig = {
  id: 'notepad',
  label: 'Notepad',
  icon: NOTEPAD_ICON_SRC,
  desktop: true,
  startMenu: { path: ['Programs', 'Accessories'] },
  taskbarLabel: 'Untitled - Notepad',
};

export function NotepadWindow() {
  const [content, setContent] = useState('');
  const [currentFile, setCurrentFile] = useState('Untitled');
  const [currentFilePath, setCurrentFilePath] = useState<string | null>(null);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [wordWrap, setWordWrap] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ctx = useWindowManager();

  // Open a document from desktop / My Computer — fileSystem sets NOTEPAD_PENDING_KEY with path for save-back
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(NOTEPAD_PENDING_KEY);
      if (!raw) return;
      sessionStorage.removeItem(NOTEPAD_PENDING_KEY);
      const payload = JSON.parse(raw) as { filename?: string; content?: string; path?: string };
      if (payload.filename) setCurrentFile(payload.filename);
      if (payload.content != null) setContent(payload.content);
      setCurrentFilePath(payload.path ?? null);
      setHasUnsaved(false);
    } catch (_) {}
  }, [ctx.apps.notepad?.visible]);

  const title = `${currentFile} - Notepad`;

  function checkSave(): boolean {
    if (hasUnsaved) {
      return window.confirm(
        `The text in the ${currentFile} file has changed.\n\nDo you want to save the changes?`,
      );
    }
    return false;
  }

  function saveFile(name: string = currentFile) {
    if (currentFilePath) {
      writeFile(currentFilePath, content);
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
    ctx?.hideApp('notepad');
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
    <AppWindow
      id="notepad-window"
      appId="notepad"
      className="notepad-window app-window app-window-hidden"
      titleBar={
        <TitleBar
          title={title}
          icon={
            <img
              src={NOTEPAD_ICON_SRC}
              alt="Notepad"
              style={{ width: 16, height: 16, marginRight: 4 }}
            />
          }
          showMin
          showMax
          showClose
        />
      }
    >
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
    </AppWindow>
  );
}
