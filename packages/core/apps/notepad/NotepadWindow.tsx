'use client';

import React, { useState, useEffect } from 'react';
import { NotepadContent } from './NotepadContent';
import type { AppConfig } from '../../types/app-config';
import { useWindowManager, useOsShell } from '../../context';
import { NOTEPAD_PENDING_KEY } from './constants';

const NOTEPAD_ICON_SRC = 'apps/notepad/notepad-icon.png';

export const notepadAppConfig: AppConfig = {
  id: 'notepad',
  label: 'Notepad',
  icon: NOTEPAD_ICON_SRC,
  desktop: true,
  startMenu: { path: ['Programs', 'Accessories'] },
  taskbarLabel: 'Untitled - Notepad',
};

/**
 * Notepad with OS-native window shell from {@link OsShellProvider}.
 * Inner UI is theme-token driven (see each OS `style.css` / `:root`).
 */
export function NotepadWindow() {
  const ctx = useWindowManager();
  const { AppWindow, TitleBar, writeFile } = useOsShell();
  const [title, setTitle] = useState('Untitled - Notepad');
  const [initialFileName, setInitialFileName] = useState('Untitled');
  const [initialContent, setInitialContent] = useState('');
  const [initialFilePath, setInitialFilePath] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(NOTEPAD_PENDING_KEY);
      if (!raw) return;
      sessionStorage.removeItem(NOTEPAD_PENDING_KEY);
      const payload = JSON.parse(raw) as { filename?: string; content?: string; path?: string };
      setInitialFileName(payload.filename ?? 'Untitled');
      setInitialContent(payload.content ?? '');
      setInitialFilePath(payload.path ?? null);
    } catch (_) {
      /* ignore */
    }
  }, [ctx.apps.notepad?.visible]);

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
      <NotepadContent
        initialFileName={initialFileName}
        initialContent={initialContent}
        initialFilePath={initialFilePath}
        onSaveToPath={(path, text) => writeFile(path, text)}
        onExit={() => ctx?.hideApp('notepad')}
        onTitleChange={setTitle}
      />
    </AppWindow>
  );
}
