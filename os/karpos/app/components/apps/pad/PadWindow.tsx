'use client';

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import type { AppConfig } from '@retro-web/core/types/app-config';
import { useOsShell, useWindowManager } from '@retro-web/core/context';
import { PAD_PENDING_KEY, writeFile } from '@/app/virtual-fs';
import styles from './PadWindow.module.css';

const PAD_ICON = 'shell/icons/notepad_with_pencil.png';

type MarkdownBlock =
  | { type: 'h1'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'p'; text: string }
  | { type: 'check'; text: string; done: boolean; lineIndex: number };

export const padAppConfig: AppConfig = {
  id: 'pad',
  label: 'Pad',
  icon: PAD_ICON,
  desktop: false,
  startMenu: false,
  taskbarLabel: 'Pad',
};

function parseMarkdown(md: string): MarkdownBlock[] {
  const lines = md.split(/\r?\n/);
  const blocks: MarkdownBlock[] = [];
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const rawLine = lines[lineIndex] ?? '';
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith('# ')) {
      blocks.push({ type: 'h1', text: line.slice(2).trim() });
      continue;
    }
    if (line.startsWith('## ')) {
      blocks.push({ type: 'h2', text: line.slice(3).trim() });
      continue;
    }
    const check = line.match(/^- \[(x| )\]\s+(.+)$/i);
    if (check) {
      blocks.push({
        type: 'check',
        done: check[1].toLowerCase() === 'x',
        text: check[2].trim(),
        lineIndex,
      });
      continue;
    }
    blocks.push({ type: 'p', text: line });
  }
  return blocks;
}

function renderInline(text: string) {
  const tokens = text.split(/(\*\*[^*]+\*\*|~~[^~]+~~)/g).filter(Boolean);
  return tokens.map((token, idx) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      return (
        <strong key={idx} className={styles.mdStrong}>
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith('~~') && token.endsWith('~~')) {
      return (
        <span key={idx} className={styles.mdStrike}>
          {token.slice(2, -2)}
        </span>
      );
    }
    return <Fragment key={idx}>{token}</Fragment>;
  });
}

function PadHeader({
  isEditing,
  today,
  onToggleEdit,
}: {
  isEditing: boolean;
  today: string;
  onToggleEdit: () => void;
}) {
  return (
    <header className={styles.padHeader}>
      <span className={styles.padIcon}>✓=</span>
      <div className={styles.padHeaderActions}>
        <button
          type="button"
          className={styles.padActionBtn}
          onClick={onToggleEdit}
          title={isEditing ? 'Preview markdown' : 'Edit markdown'}
          aria-label={isEditing ? 'Preview markdown' : 'Edit markdown'}
        >
          {isEditing ? '✓' : '✎'}
        </button>
        <span className={styles.padDate}>{today}</span>
      </div>
    </header>
  );
}

function PadEditor({
  markdown,
  onChange,
}: {
  markdown: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className={styles.editorWrap}>
      <textarea
        className={styles.editor}
        value={markdown}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        aria-label="Markdown editor"
      />
    </div>
  );
}

function MarkdownPreview({
  blocks,
  onToggleChecklistLine,
}: {
  blocks: MarkdownBlock[];
  onToggleChecklistLine: (lineIndex: number) => void;
}) {
  return (
    <>
      {blocks.map((block, idx) => {
        if (block.type === 'h1') {
          return (
            <h1 key={idx} className={styles.mdH1}>
              {renderInline(block.text)}
            </h1>
          );
        }
        if (block.type === 'h2') {
          return (
            <h2 key={idx} className={styles.mdH2}>
              {renderInline(block.text)}
            </h2>
          );
        }
        if (block.type === 'check') {
          return (
            <ul key={idx} className={styles.mdList}>
              <li className={styles.mdItem}>
                <button
                  type="button"
                  onClick={() => onToggleChecklistLine(block.lineIndex)}
                  className={`${styles.mdCheckboxBtn} ${block.done ? styles.mdCheckboxDone : ''}`.trim()}
                  aria-label={`Toggle ${block.text}`}
                  title="Toggle task"
                />
                <span className={block.done ? styles.mdDoneText : ''}>
                  {renderInline(block.text)}
                </span>
              </li>
            </ul>
          );
        }
        return (
          <p key={idx} className={styles.mdP}>
            {renderInline(block.text)}
          </p>
        );
      })}
    </>
  );
}

export function PadWindow() {
  const { apps } = useWindowManager();
  const { AppWindow, TitleBar } = useOsShell();
  const [title, setTitle] = useState('Pad');
  const [markdown, setMarkdown] = useState<string>('No markdown loaded.');
  const [filePath, setFilePath] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const prevShowRef = useRef(false);

  const appState = apps.pad;
  const showWindow = !!(appState?.visible && !appState?.minimized);

  useEffect(() => {
    if (!appState?.visible) return;
    try {
      const raw = sessionStorage.getItem(PAD_PENDING_KEY);
      if (!raw) return;
      sessionStorage.removeItem(PAD_PENDING_KEY);
      const payload = JSON.parse(raw) as { filename?: string; content?: string; path?: string };
      setTitle(payload.filename ?? 'Pad');
      setMarkdown(payload.content ?? '');
      setFilePath(payload.path ?? null);
      setIsEditing(false);
    } catch (_) {
      /* ignore */
    }
  }, [appState?.visible]);

  const persistMarkdown = (nextMarkdown: string) => {
    setMarkdown(nextMarkdown);
    if (!filePath) return;
    writeFile(filePath, nextMarkdown);
  };

  const toggleChecklistLine = (lineIndex: number) => {
    const lines = markdown.split(/\r?\n/);
    const raw = lines[lineIndex];
    if (!raw) return;
    const match = raw.trim().match(/^- \[(x| )\]\s+(.+)$/i);
    if (!match) return;
    const nextDone = match[1].toLowerCase() !== 'x';
    const currentText = match[2].trim();
    const unstruckText = currentText.replace(/^~~([\s\S]+)~~$/, '$1').trim();
    const nextText = nextDone ? `~~${unstruckText}~~` : unstruckText;
    const nextLine = `- [${nextDone ? 'x' : ' '}] ${nextText}`;
    lines[lineIndex] = nextLine;
    persistMarkdown(lines.join('\n'));
  };

  const toggleEditMode = () => {
    if (isEditing) {
      persistMarkdown(markdown);
    }
    setIsEditing(!isEditing);
  };

  useEffect(() => {
    if (!showWindow) {
      prevShowRef.current = false;
      return;
    }
    const justShown = !prevShowRef.current;
    prevShowRef.current = true;
    if (!justShown) return;
    if (appState?.bounds) return;

    const t = window.setTimeout(() => {
      const win = document.getElementById('pad-window');
      if (!win || win.classList.contains('maximized')) return;
      const rect = win.getBoundingClientRect();
      const width = rect.width || 520;
      const height = rect.height || 560;
      const taskbarReserve = document.body.classList.contains('karpos-desktop') ? 52 : 28;
      const availableHeight = Math.max(0, window.innerHeight - taskbarReserve);
      const left = Math.max(8, Math.round((window.innerWidth - width) / 2));
      const top = Math.max(8, Math.round((availableHeight - height) / 2));
      win.style.left = `${left}px`;
      win.style.top = `${top}px`;
    }, 0);
    return () => window.clearTimeout(t);
  }, [appState?.bounds, showWindow]);

  const blocks = useMemo(() => parseMarkdown(markdown), [markdown]);
  const today = useMemo(() => {
    const d = new Date();
    return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }).toUpperCase();
  }, []);

  return (
    <AppWindow
      id="pad-window"
      appId="pad"
      className={`${styles.padWindow} app-window app-window-hidden`}
      allowResize
      titleBar={
        <TitleBar
          title={title}
          icon={<img src={PAD_ICON} alt="" style={{ width: 16, height: 16, marginRight: 4 }} />}
          showMin
          showMax
          showClose
        />
      }
    >
      <div className={styles.padRoot}>
        <article className={styles.padCard}>
          <PadHeader isEditing={isEditing} today={today} onToggleEdit={toggleEditMode} />
          {isEditing ? (
            <PadEditor markdown={markdown} onChange={setMarkdown} />
          ) : (
            <MarkdownPreview blocks={blocks} onToggleChecklistLine={toggleChecklistLine} />
          )}
        </article>
      </div>
    </AppWindow>
  );
}
