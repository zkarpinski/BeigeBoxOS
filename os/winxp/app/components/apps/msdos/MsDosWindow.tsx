'use client';

import React, { useState, useRef, useEffect } from 'react';
import type { AppConfig } from '@/app/types/app-config';
import { useWindowManager, useOsShell } from '@retro-web/core/context';
import { USER_PROFILE_PATH } from '../../../fileSystem';

const ICON = 'apps/msdos/msdos-icon.png';

export const msdosAppConfig: AppConfig = {
  id: 'msdos',
  label: 'Command Prompt',
  icon: ICON,
  desktop: false,
  startMenu: { path: ['Programs', 'Accessories'] },
  taskbarLabel: 'Command Prompt',
};

// Also export as cmdAppConfig for registry compatibility
export const cmdAppConfig = msdosAppConfig;

const INITIAL_LINES = [
  'Microsoft Windows XP [Version 5.1.2600]',
  '(C) Copyright 1985-2001 Microsoft Corp.',
  '',
];

export function MsDosWindow() {
  const { AppWindow, TitleBar } = useOsShell();
  const [lines, setLines] = useState<string[]>(INITIAL_LINES);
  const [workingDir, setWorkingDir] = useState(USER_PROFILE_PATH);
  const [inputValue, setInputValue] = useState('');
  const consoleRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const ctx = useWindowManager();

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [lines]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return;
    e.preventDefault();

    const val = inputValue;
    setInputValue('');

    const cmdLine = `${workingDir}>${val}`;
    const trimmed = val.trim();

    if (trimmed === '') {
      setLines((prev) => [...prev, cmdLine]);
      return;
    }

    const parts = trimmed.split(' ');
    const cmd = parts[0].toLowerCase();

    const newLines: string[] = [cmdLine];

    switch (cmd) {
      case 'cls':
        setLines([]);
        return;
      case 'dir':
        newLines.push(
          ' Volume in drive C is Windows XP',
          ' Volume Serial Number is ABCD-1234',
          ' Directory of ' + workingDir,
          '',
          '.              <DIR>        03-06-26  7:14p',
          '..             <DIR>        03-06-26  7:14p',
          'Desktop        <DIR>        03-06-26  7:14p',
          'My Documents   <DIR>        03-06-26  7:14p',
          'Start Menu     <DIR>        03-06-26  7:14p',
          '               3 Dir(s)   4,095,234,048 bytes free',
          '',
        );
        break;
      case 'echo':
        newLines.push(parts.slice(1).join(' '));
        break;
      case 'ver':
        newLines.push('', 'Microsoft Windows XP [Version 5.1.2600]', '');
        break;
      case 'date': {
        const now = new Date();
        newLines.push(
          'Current date is ' +
            now.toLocaleDateString('en-US', {
              weekday: 'short',
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            }),
        );
        break;
      }
      case 'time': {
        const t = new Date();
        newLines.push('Current time is ' + t.toLocaleTimeString('en-US'));
        break;
      }
      case 'help':
        newLines.push(
          'For more information on a specific command, type HELP command-name',
          '  CLS      Clears the screen.',
          '  DATE     Displays or sets the date.',
          '  DIR      Displays a list of files and subdirectories.',
          '  ECHO     Displays messages.',
          '  HELP     Provides Help information for Windows commands.',
          '  TIME     Displays or sets the system time.',
          '  VER      Displays the Windows version.',
          '  EXIT     Quits the CMD.EXE program (command interpreter).',
        );
        break;
      case 'cd':
        if (parts.length > 1) {
          setWorkingDir((prev) => {
            if (parts[1] === '..') {
              const p = prev.split('\\');
              if (p.length > 1) {
                p.pop();
                const next = p.join('\\');
                return next === 'C:' ? 'C:\\' : next;
              }
            } else {
              return prev.endsWith('\\') ? prev + parts[1] : prev + '\\' + parts[1];
            }
            return prev;
          });
        }
        newLines.push('');
        break;
      case 'exit':
        ctx?.hideApp('msdos');
        setLines((prev) => [...prev, ...newLines]);
        return;
      default:
        newLines.push(`'${parts[0]}' is not recognized as an internal or external command,`);
        newLines.push('operable program or batch file.');
        break;
    }

    setLines((prev) => [...prev, ...newLines]);
  }

  return (
    <AppWindow
      id="msdos-window"
      appId="msdos"
      allowResize
      className="msdos-window app-window app-window-hidden"
      titleBar={
        <TitleBar
          title="Command Prompt"
          icon={
            <img
              src={ICON}
              alt="Command Prompt"
              style={{ width: 16, height: 16, marginRight: 4 }}
            />
          }
          showMin
          showMax
          showClose
        />
      }
    >
      <div className="msdos-console" ref={consoleRef} onClick={() => inputRef.current?.focus()}>
        <div className="msdos-history">
          {lines.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
        <div className="msdos-input-line">
          <span className="msdos-prompt">
            {workingDir}
            {'>'}
          </span>
          <input
            ref={inputRef}
            type="text"
            className="msdos-input"
            spellCheck={false}
            autoComplete="off"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
      </div>
    </AppWindow>
  );
}
