/**
 * Unit and functional tests for WordWindow.
 */
import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WordWindow, wordAppConfig } from './WordWindow';
import { WindowManagerProvider } from '@retro-web/core/context';

function renderWord() {
  const config = { ...wordAppConfig, openByDefault: true };
  return render(
    <WindowManagerProvider registry={[config]}>
      <WordWindow />
    </WindowManagerProvider>,
  );
}

function getWordWindow(): HTMLElement | null {
  const candidates = document.querySelectorAll('#word-window');
  for (let i = 0; i < candidates.length; i++) {
    const el = candidates[i] as HTMLElement;
    if (el.querySelector('.menu-bar')) return el;
  }
  return document.getElementById('word-window');
}

function getEditor(): HTMLDivElement | null {
  const win = getWordWindow();
  return win?.querySelector('#editor') as HTMLDivElement | null;
}

describe('WordWindow', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('rendering', () => {
    test('renders without crashing', () => {
      renderWord();
      expect(getWordWindow()).toBeInTheDocument();
    });

    test('has title bar with document name (My Resume.doc when resume loaded, Document 1 when new)', () => {
      renderWord();
      const title = screen.getByText(/Microsoft Word - /);
      expect(title).toBeInTheDocument();
      expect(title.textContent).toMatch(/Microsoft Word - (My Resume\.doc|Resume\.doc|Document 1)/);
    });

    test('has menu bar with File, Edit, View, Insert, Format, Tools, Table, Window, Help', () => {
      renderWord();
      const win = getWordWindow();
      expect(win?.textContent).toMatch(/File/);
      expect(win?.textContent).toMatch(/Edit/);
      expect(win?.textContent).toMatch(/View/);
      expect(win?.textContent).toMatch(/Insert/);
      expect(win?.textContent).toMatch(/Format/);
      expect(win?.textContent).toMatch(/Tools/);
      expect(win?.textContent).toMatch(/Table/);
      expect(win?.textContent).toMatch(/Window/);
      expect(win?.textContent).toMatch(/Help/);
    });

    test('has contentEditable editor', () => {
      renderWord();
      const editor = getEditor();
      expect(editor).toBeInTheDocument();
      expect(editor?.getAttribute('contenteditable')).toBe('true');
    });

    test('has status bar with Ln and Col', () => {
      renderWord();
      const win = getWordWindow();
      expect(win?.querySelector('.status-bar')).toBeInTheDocument();
      expect(win?.textContent).toMatch(/Ln \d+/);
      expect(win?.textContent).toMatch(/Col \d+/);
    });

    test('has view buttons (Normal, Online Layout, Page Layout, Outline)', () => {
      renderWord();
      const win = getWordWindow();
      expect(win?.querySelector('.view-buttons')).toBeInTheDocument();
      expect(win?.textContent).toMatch(/Normal|Page Layout|Outline/);
    });
  });

  describe('File menu', () => {
    test('clicking File opens dropdown with New, Open, Save, Print, Exit', async () => {
      const user = userEvent.setup();
      renderWord();
      const win = getWordWindow();
      const fileMenu = win?.querySelector('[data-menu="file"]') as HTMLElement;
      await user.click(fileMenu!);
      const menuFile = win?.querySelector('#menu-file');
      expect(menuFile).toBeInTheDocument();
      expect(menuFile).toHaveTextContent(/New/);
      expect(menuFile).toHaveTextContent(/Open/);
      expect(menuFile).toHaveTextContent(/Save/);
      expect(menuFile).toHaveTextContent(/Print/);
      expect(menuFile).toHaveTextContent(/Exit/);
    });

    test('New clears editor without prompting to save', async () => {
      const user = userEvent.setup();
      renderWord();
      const editor = getEditor();
      if (editor) editor.innerHTML = '<p>Some content</p>';
      const win = getWordWindow();
      await user.click(win!.querySelector('[data-menu="file"]') as HTMLElement);
      const newItem = win!.querySelector('#menu-file .menu-dropdown-item') as HTMLElement;
      await user.click(newItem);
      expect(editor?.innerHTML).toContain('<p>');
      expect(editor?.innerHTML).not.toContain('Some content');
    });

    test('About Microsoft Word opens about dialog', async () => {
      const user = userEvent.setup();
      renderWord();
      const win = getWordWindow();
      await user.click(win!.querySelector('[data-menu="help"]') as HTMLElement);
      const aboutItem = screen.getByText('About Microsoft Word');
      await user.click(aboutItem);
      const dialogEl =
        getWordWindow()?.querySelector('#about-dialog') ?? document.getElementById('about-dialog');
      expect(dialogEl).toBeInTheDocument();
      expect(dialogEl?.getAttribute('hidden')).toBeFalsy();
      expect(dialogEl?.textContent).toMatch(/Microsoft Word 97/);
    });

    test('About dialog OK closes dialog', async () => {
      const user = userEvent.setup();
      renderWord();
      const win = getWordWindow();
      await user.click(win!.querySelector('[data-menu="help"]') as HTMLElement);
      await user.click(screen.getByText('About Microsoft Word'));
      const okBtn = screen.getByRole('button', { name: /ok/i });
      await user.click(okBtn);
      const dialogEl = document.querySelector('[id="about-dialog"]') as HTMLElement | null;
      expect(dialogEl?.hasAttribute('hidden') || dialogEl?.style?.display === 'none').toBeTruthy();
    });
  });

  describe('toolbar', () => {
    test('Standard toolbar has New, Open, Save, Print, Cut, Copy, Paste', () => {
      renderWord();
      const win = getWordWindow();
      const stdToolbar = win?.querySelector('.standard-toolbar');
      expect(stdToolbar).toBeInTheDocument();
      expect(stdToolbar?.querySelector('[title="New"]')).toBeInTheDocument();
      expect(stdToolbar?.querySelector('[title="Open"]')).toBeInTheDocument();
      expect(stdToolbar?.querySelector('[title="Save"]')).toBeInTheDocument();
      expect(stdToolbar?.querySelector('[title="Print"]')).toBeInTheDocument();
      expect(stdToolbar?.querySelector('[title="Cut"]')).toBeInTheDocument();
      expect(stdToolbar?.querySelector('[title="Copy"]')).toBeInTheDocument();
      expect(stdToolbar?.querySelector('[title="Paste"]')).toBeInTheDocument();
    });

    test('Formatting toolbar has Bold, Italic, Underline', () => {
      renderWord();
      const win = getWordWindow();
      const fmtToolbar = win?.querySelector('.formatting-toolbar');
      expect(fmtToolbar?.querySelector('[title="Bold"]')).toBeInTheDocument();
      expect(fmtToolbar?.querySelector('[title="Italic"]')).toBeInTheDocument();
      expect(fmtToolbar?.querySelector('[title="Underline"]')).toBeInTheDocument();
    });

    test('Bold button is present and clickable', async () => {
      const user = userEvent.setup();
      renderWord();
      const win = getWordWindow();
      const boldBtn = win?.querySelector('[title="Bold"]') as HTMLElement;
      expect(boldBtn).toBeInTheDocument();
      await user.click(boldBtn);
      expect(boldBtn).toHaveClass('format-btn');
    });
  });

  describe('persistence', () => {
    test('editor content is persisted to localStorage on input', async () => {
      renderWord();
      const editor = getEditor();
      expect(editor).toBeInTheDocument();
      await act(async () => {
        editor!.innerHTML = '<p>Persisted text</p>';
        editor!.dispatchEvent(new Event('input', { bubbles: true }));
      });
      expect(localStorage.getItem('word97-state')).toBeTruthy();
      const state = JSON.parse(localStorage.getItem('word97-state')!);
      expect(state.editorContent).toContain('Persisted text');
      expect(state.stateVersion).toBe(2);
    });
  });

  describe('wordAppConfig', () => {
    test('exports correct app config', () => {
      expect(wordAppConfig.id).toBe('word');
      expect(wordAppConfig.label).toBe('Microsoft Word 97');
      expect(wordAppConfig.icon).toBe('apps/word/word-icon.png');
      expect(wordAppConfig.startMenu).toEqual({ path: ['Programs'], label: 'Microsoft Word' });
      expect(wordAppConfig.desktop).toBe(false);
    });
  });
});
