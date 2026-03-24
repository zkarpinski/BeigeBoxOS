'use client';

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useWindowManager, useOsShell } from '@retro-web/core/context';
import type { AppConfig } from '@/app/types/app-config';
import { sanitizeHTML } from './sanitizer';
import { WORD_PENDING_KEY } from '@/app/fileSystem';
import {
  DEFAULT_RESUME_HTML,
  loadWordState,
  saveWordState,
  hasMeaningfulContent,
} from './resumeContent';
import { getCaretLineAndColumn } from './wordUtils';
import { WordMenuBar } from './WordMenuBar';
import { WordToolbars } from './WordToolbars';
import { WordRuler } from './WordRuler';
import { WordEditorArea } from './WordEditorArea';
import { WordStatusBar, type ViewMode } from './WordStatusBar';

const ICON = 'apps/word/word-icon.png';

export const wordAppConfig: AppConfig = {
  id: 'word',
  label: 'Microsoft Word 97',
  icon: ICON,
  desktop: false,
  startMenu: { path: ['Programs'], label: 'Microsoft Word' },
  taskbarLabel: 'Microsoft Word - Doc...',
};

export function WordWindow() {
  const { hideApp, apps } = useWindowManager();
  const { AppWindow, TitleBar } = useOsShell();
  const wordVisible = apps.word?.visible;

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ left: number; top: number } | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('normal');
  const [statusLine, setStatusLine] = useState(1);
  const [statusCol, setStatusCol] = useState(1);
  const [formatBold, setFormatBold] = useState(false);
  const [formatItalic, setFormatItalic] = useState(false);
  const [formatUnderline, setFormatUnderline] = useState(false);
  const [modeToggles, setModeToggles] = useState<Record<string, boolean>>({});
  const [zoom, setZoom] = useState('100');
  const [documentName, setDocumentName] = useState('Document 1');

  const updateStatusBar = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const { line, col } = getCaretLineAndColumn(editor);
    setStatusLine(line);
    setStatusCol(col);
  }, []);

  const exec = useCallback((cmd: string, value?: string | null) => {
    document.execCommand(cmd, false, value ?? undefined);
    editorRef.current?.focus();
  }, []);

  const persistContent = useCallback(() => {
    const editor = editorRef.current;
    if (editor) saveWordState(editor.innerHTML);
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const openNewDoc =
      typeof sessionStorage !== 'undefined' && sessionStorage.getItem('word-open-new-doc');
    if (openNewDoc) {
      try {
        sessionStorage.removeItem('word-open-new-doc');
      } catch {
        /* ignore */
      }
      editor.innerHTML = '<p><br></p>';
      setDocumentName('Document 1');
    } else {
      const state = loadWordState();
      const html =
        state?.editorContent && hasMeaningfulContent(state.editorContent)
          ? state.editorContent
          : DEFAULT_RESUME_HTML;
      editor.innerHTML = html;
      setDocumentName(hasMeaningfulContent(html) ? 'My Resume.doc' : 'Document 1');
    }
    updateStatusBar();
  }, [updateStatusBar]);

  // When Word is opened from a desktop shortcut (e.g. My Resume.doc), load the requested document.
  useEffect(() => {
    if (!wordVisible) return;
    const editor = editorRef.current;
    if (!editor) return;
    try {
      const raw = sessionStorage.getItem(WORD_PENDING_KEY);
      if (!raw) return;
      const payload = JSON.parse(raw) as { documentKey?: string };
      sessionStorage.removeItem(WORD_PENDING_KEY);
      if (payload.documentKey === 'resume') {
        editor.innerHTML = DEFAULT_RESUME_HTML;
        setDocumentName('My Resume.doc');
        updateStatusBar();
      }
    } catch (_) {
      /* ignore */
    }
  }, [wordVisible, updateStatusBar]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const onInput = () => {
      updateStatusBar();
      persistContent();
    };
    const onSelectionChange = () => {
      setFormatBold(document.queryCommandState('bold'));
      setFormatItalic(document.queryCommandState('italic'));
      setFormatUnderline(document.queryCommandState('underline'));
    };
    editor.addEventListener('input', onInput);
    editor.addEventListener('blur', persistContent);
    editor.addEventListener('keyup', updateStatusBar);
    editor.addEventListener('click', updateStatusBar);
    editor.addEventListener('focus', updateStatusBar);
    editor.addEventListener('keyup', onSelectionChange);
    editor.addEventListener('mouseup', onSelectionChange);
    return () => {
      editor.removeEventListener('input', onInput);
      editor.removeEventListener('blur', persistContent);
      editor.removeEventListener('keyup', updateStatusBar);
      editor.removeEventListener('click', updateStatusBar);
      editor.removeEventListener('focus', updateStatusBar);
      editor.removeEventListener('keyup', onSelectionChange);
      editor.removeEventListener('mouseup', onSelectionChange);
    };
  }, [updateStatusBar, persistContent]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        target &&
        (document.querySelector('.menu-bar')?.contains(target) ||
          document.querySelector('.menu-dropdown')?.contains(target))
      ) {
        return;
      }
      setOpenMenuId(null);
      setMenuPosition(null);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const closeMenus = useCallback(() => {
    setOpenMenuId(null);
    setMenuPosition(null);
  }, []);

  const openMenu = useCallback((name: string, anchor: HTMLElement | null) => {
    setOpenMenuId(name);
    if (anchor && !['file'].includes(name)) {
      const r = anchor.getBoundingClientRect();
      setMenuPosition({ left: r.left, top: r.bottom + 2 });
    } else {
      setMenuPosition(null);
    }
  }, []);

  const handleMenuTrigger = useCallback(
    (e: React.MouseEvent, name: string) => {
      e.stopPropagation();
      const btn = e.currentTarget;
      if (openMenuId === name) {
        closeMenus();
        return;
      }
      closeMenus();
      openMenu(name, btn as HTMLElement);
    },
    [openMenuId, closeMenus, openMenu],
  );

  const handleNew = useCallback(() => {
    const editor = editorRef.current;
    if (editor) {
      editor.innerHTML = '<p><br></p>';
      editor.focus();
    }
    setDocumentName('Document 1');
    updateStatusBar();
    closeMenus();
  }, [updateStatusBar, closeMenus]);

  const handleOpenFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file || !editorRef.current) return;
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        const isHtml = /<(?:\w+|!\s*DOCTYPE|!\s*--)/i.test(text);
        if (editorRef.current) {
          if (isHtml) {
            editorRef.current.innerHTML = sanitizeHTML(text);
          } else {
            editorRef.current.innerText = text;
          }
          updateStatusBar();
          persistContent();
        }
      };
      reader.readAsText(file);
      closeMenus();
    },
    [updateStatusBar, persistContent, closeMenus],
  );

  const saveAsDoc = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const bodyContent = editor.innerHTML;
    const baseName = documentName.replace(/\.doc$/i, '');
    const docHtml = [
      '<!DOCTYPE html>',
      '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">',
      `<head><meta charset="utf-8"><title>${baseName}</title></head>`,
      '<body>',
      bodyContent,
      '</body>',
      '</html>',
    ].join('');
    const blob = new Blob(['\ufeff' + docHtml], {
      type: 'application/msword;charset=utf-8',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = documentName.endsWith('.doc') ? documentName : `${documentName}.doc`;
    a.click();
    URL.revokeObjectURL(a.href);
    closeMenus();
  }, [documentName, closeMenus]);

  const handlePrint = useCallback(() => {
    window.print();
    closeMenus();
  }, [closeMenus]);

  const handleExit = useCallback(() => {
    closeMenus();
    hideApp('word');
  }, [closeMenus, hideApp]);

  const handleMenuAction = useCallback(
    (itemText: string, dataCmd: string | null) => {
      if (dataCmd === 'hyperlink') {
        const url = window.prompt('Enter URL:');
        if (url?.trim()) {
          const trimmed = url.trim();
          if (/^https?:\/\//i.test(trimmed)) exec('createLink', trimmed);
          else window.alert('URL must start with http:// or https://');
        }
      } else if (dataCmd === 'table') {
        const rows = window.prompt('Number of rows:', '3');
        const cols = window.prompt('Number of columns:', '3');
        if (rows && cols) {
          const r = parseInt(rows, 10);
          const c = parseInt(cols, 10);
          let html = '<table border="1" style="border-collapse:collapse;width:100%">';
          for (let i = 0; i < r; i++) {
            html += '<tr>';
            for (let j = 0; j < c; j++) html += '<td>&nbsp;</td>';
            html += '</tr>';
          }
          html += '</table>';
          exec('insertHTML', html);
        }
      } else if (itemText === 'Save' || itemText === 'Exit') {
        if (itemText === 'Exit') handleExit();
        else saveAsDoc();
      } else if (itemText === 'Print...' || itemText === 'Print Preview') {
        handlePrint();
      } else if (itemText === 'Cut') exec('cut');
      else if (itemText === 'Copy') exec('copy');
      else if (itemText === 'Paste') exec('paste');
      else if (itemText === 'Undo') exec('undo');
      else if (itemText === 'Normal') setViewMode('normal');
      else if (itemText === 'Page Layout') setViewMode('print');
      else if (itemText === 'About Microsoft Word') setAboutOpen(true);
      closeMenus();
    },
    [exec, saveAsDoc, handlePrint, handleExit, closeMenus],
  );

  const handleInsertTable = useCallback(() => {
    const rows = window.prompt('Number of rows:', '3');
    const cols = window.prompt('Number of columns:', '3');
    if (rows && cols) {
      const r = parseInt(rows, 10);
      const c = parseInt(cols, 10);
      let html = '<table border="1" style="border-collapse:collapse;width:100%">';
      for (let i = 0; i < r; i++) {
        html += '<tr>';
        for (let j = 0; j < c; j++) html += '<td>&nbsp;</td>';
        html += '</tr>';
      }
      html += '</table>';
      exec('insertHTML', html);
    }
  }, [exec]);

  const handleHyperlink = useCallback(() => {
    const url = window.prompt('Enter URL:');
    if (url?.trim()) {
      const trimmed = url.trim();
      if (/^https?:\/\//i.test(trimmed)) exec('createLink', trimmed);
      else window.alert('URL must start with http:// or https://');
    }
  }, [exec]);

  const handleFontColor = useCallback(() => {
    const color = window.prompt('Color (e.g. #0000ff or red):', '#0000ff');
    if (color) exec('foreColor', color);
  }, [exec]);

  const zoomStyle = useMemo(() => ({ zoom: `${zoom}%` as const }), [zoom]);

  const viewModeClass = useMemo(() => {
    if (viewMode === 'print') return 'view-print';
    if (viewMode === 'web') return 'view-web';
    if (viewMode === 'outline') return 'view-outline';
    return '';
  }, [viewMode]);

  const toggleMode = useCallback((id: string) => {
    setModeToggles((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  return (
    <AppWindow
      id="word-window"
      appId="word"
      maximizedClass="windowed"
      getCanDrag={(el) => el.classList.contains('windowed')}
      className={`app-window ${viewModeClass} windowed`}
      titleBar={
        <TitleBar
          title={`Microsoft Word - ${documentName}`}
          icon={
            <div className="title-logo">
              <span className="w-cyan">W</span>
            </div>
          }
          showMin
          showMax
          showClose
        />
      }
    >
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <WordMenuBar
          openMenuId={openMenuId}
          menuPosition={menuPosition}
          aboutOpen={aboutOpen}
          setAboutOpen={setAboutOpen}
          closeMenus={closeMenus}
          openMenu={openMenu}
          handleMenuTrigger={handleMenuTrigger}
          handleNew={handleNew}
          handleOpenFile={handleOpenFile}
          saveAsDoc={saveAsDoc}
          handlePrint={handlePrint}
          handleExit={handleExit}
          handleMenuAction={handleMenuAction}
          exec={exec}
          setViewMode={setViewMode}
          fileInputRef={fileInputRef}
        />
        <WordToolbars
          exec={exec}
          zoom={zoom}
          setZoom={setZoom}
          formatBold={formatBold}
          formatItalic={formatItalic}
          formatUnderline={formatUnderline}
          handleNew={handleNew}
          handleOpenClick={() => fileInputRef.current?.click()}
          saveAsDoc={saveAsDoc}
          handlePrint={handlePrint}
          handleInsertTable={handleInsertTable}
          handleHyperlink={handleHyperlink}
          handleFontColor={handleFontColor}
          editorRef={editorRef}
          fileInputRef={fileInputRef}
        />
        <WordRuler />
        <WordEditorArea editorRef={editorRef} zoomStyle={zoomStyle} />
        <WordStatusBar
          statusLine={statusLine}
          statusCol={statusCol}
          viewMode={viewMode}
          setViewMode={setViewMode}
          modeToggles={modeToggles}
          toggleMode={toggleMode}
        />
      </div>
    </AppWindow>
  );
}
