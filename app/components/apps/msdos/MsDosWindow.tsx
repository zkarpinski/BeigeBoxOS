'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AppWindow, TitleBar } from '../../win98';
import type { AppConfig } from '@/app/types/app-config';
import { useWindowManager } from '../../../context/WindowManagerContext';

const ICON = 'apps/msdos/msdos-icon.png';

export const msdosAppConfig: AppConfig = {
  id: 'msdos',
  label: 'MS-DOS Prompt',
  icon: ICON,
  desktop: false,
  startMenu: { path: ['Programs', 'Accessories'] },
  taskbarLabel: 'MS-DOS Prompt',
};

const INITIAL_LINES = ['Microsoft(R) Windows 98', '   (C)Copyright Microsoft Corp 1981-1999.', ''];

export function MsDosWindow() {
  const [lines, setLines] = useState<string[]>(INITIAL_LINES);
  const [workingDir, setWorkingDir] = useState('C:\\WINDOWS');
  const [inputValue, setInputValue] = useState('');
  const consoleRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const ctx = useWindowManager();

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [lines]);

  function append(text: string) {
    setLines((prev) => [...prev, text]);
  }

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
          ' Volume in drive C has no label',
          ' Volume Serial Number is 1337-0000',
          ' Directory of ' + workingDir,
          '',
          '.              <DIR>        03-06-26  7:14p',
          '..             <DIR>        03-06-26  7:14p',
          'SYSTEM         <DIR>        03-06-26  7:14p',
          'COMMAND  COM        93,890  04-23-99 10:22p',
          'CONFIG   SYS            15  03-06-26  7:14p',
          'AUTOEXEC BAT            32  03-06-26  7:14p',
          '         3 file(s)         93,937 bytes',
          '         3 dir(s)     420,690,000 bytes free',
          '',
        );
        break;
      case 'echo':
        newLines.push(parts.slice(1).join(' '));
        break;
      case 'ver':
        newLines.push('', 'Windows 98 [Version 4.10.1998]', '');
        break;
      case 'date': {
        const now = new Date();
        newLines.push(
          'Current date is ' +
            now
              .toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
              })
              .replace(/,/g, ''),
        );
        break;
      }
      case 'time': {
        const t = new Date();
        newLines.push(
          'Current time is ' +
            t.toLocaleTimeString('en-US', {
              hour12: true,
              hour: 'numeric',
              minute: '2-digit',
              second: '2-digit',
            }) +
            '.' +
            Math.floor(t.getMilliseconds() / 10),
        );
        break;
      }
      case 'help':
        newLines.push(
          'Supported commands:',
          '  CLS    Clears the screen.',
          '  DATE   Displays the date.',
          '  DIR    Displays a list of files and subdirectories in a directory.',
          '  ECHO   Displays messages.',
          '  HELP   Provides Help information for Windows commands.',
          '  TIME   Displays the system time.',
          '  VER    Displays the Windows version.',
          '  EXIT   Quits the COMMAND.COM program (command interpreter).',
        );
        break;
      case 'cd':
        if (parts.length > 1) {
          setWorkingDir((prev) => {
            let next = prev;
            if (parts[1] === '..') {
              const p = prev.split('\\');
              if (p.length > 1) {
                p.pop();
                next = p.join('\\');
                if (next === 'C:') next = 'C:\\';
              }
            } else {
              next = prev.endsWith('\\') ? prev + parts[1] : prev + '\\' + parts[1];
            }
            return next;
          });
        }
        newLines.push('');
        break;
      case 'exit':
        ctx?.hideApp('msdos');
        setLines((prev) => [...prev, ...newLines]);
        return;
      default:
        newLines.push('Bad command or file name');
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
          title="MS-DOS Prompt"
          icon={
            <img src={ICON} alt="MS-DOS Prompt" style={{ width: 16, height: 16, marginRight: 4 }} />
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
