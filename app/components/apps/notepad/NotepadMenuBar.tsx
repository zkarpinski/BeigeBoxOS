'use client';

import React from 'react';
import { MenuBar } from '@/app/components/win98/MenuBar';

interface NotepadMenuBarProps {
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

export default function NotepadMenuBar({
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
  const items = [
    {
      label: 'File',
      shortcutChar: 'F',
      dropdown: [
        { label: 'New', shortcutChar: 'N', onClick: onNew },
        { label: 'Open...', shortcutChar: 'O', onClick: onOpen },
        { label: 'Save', shortcutChar: 'S', onClick: onSave },
        { label: 'Save As...', shortcutChar: 'A', onClick: onSaveAs },
        { divider: true },
        { label: 'Exit', shortcutChar: 'x', onClick: onExit },
      ],
    },
    {
      label: 'Edit',
      shortcutChar: 'E',
      dropdown: [
        { label: 'Undo', shortcutChar: 'U', shortcut: 'Ctrl+Z', onClick: onUndo },
        { divider: true },
        { label: 'Cut', shortcutChar: 't', shortcut: 'Ctrl+X', onClick: onCut },
        { label: 'Copy', shortcutChar: 'C', shortcut: 'Ctrl+C', onClick: onCopy },
        { label: 'Paste', shortcutChar: 'P', shortcut: 'Ctrl+V', onClick: onPaste },
        { label: 'Delete', shortcutChar: 'l', shortcut: 'Del', onClick: onDelete },
        { divider: true },
        { label: 'Select All', shortcutChar: 'A', onClick: onSelectAll },
        { label: 'Time/Date', shortcutChar: 'D', shortcut: 'F5', onClick: onTimeDate },
        { divider: true },
        { label: 'Word Wrap', shortcutChar: 'W', onClick: onWordWrap },
      ],
    },
    { label: 'Search', shortcutChar: 'S' },
    { label: 'Help', shortcutChar: 'H' },
  ];

  return (
    <MenuBar
      items={items}
      className="notepad-menu-bar"
      itemClassName="notepad-menu-item"
      dropdownClassName="notepad-menu-dropdown"
      dropdownItemClassName="notepad-dropdown-item"
      dividerClassName="notepad-dropdown-divider"
    />
  );
}
