'use client';

import React, { RefObject } from 'react';

const MENU_IDS = [
  'file',
  'edit',
  'view',
  'insert',
  'format',
  'tools',
  'table',
  'window',
  'help',
] as const;
export type ViewMode = 'normal' | 'web' | 'print' | 'outline';

interface WordMenuBarProps {
  openMenuId: string | null;
  menuPosition: { left: number; top: number } | null;
  aboutOpen: boolean;
  setAboutOpen: (open: boolean) => void;
  closeMenus: () => void;
  openMenu: (name: string, anchor: HTMLElement | null) => void;
  handleMenuTrigger: (e: React.MouseEvent, name: string) => void;
  handleNew: () => void;
  handleOpenFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  saveAsDoc: () => void;
  handlePrint: () => void;
  handleExit: () => void;
  handleMenuAction: (itemText: string, dataCmd: string | null) => void;
  exec: (cmd: string, value?: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
}

export function WordMenuBar({
  openMenuId,
  menuPosition,
  aboutOpen,
  setAboutOpen,
  closeMenus,
  openMenu,
  handleMenuTrigger,
  handleNew,
  handleOpenFile,
  saveAsDoc,
  handlePrint,
  handleExit,
  handleMenuAction,
  exec,
  setViewMode,
  fileInputRef,
}: WordMenuBarProps) {
  return (
    <>
      <div className="menu-bar">
        <div className="menu-left">
          <div className="doc-icon-container">
            <span className="doc-icon-w">W</span>
          </div>
          <div className="menu-item" data-menu="file" onClick={(e) => handleMenuTrigger(e, 'file')}>
            <span className="menu-title">
              <u>F</u>ile
            </span>
            <div
              className={`menu-dropdown ${openMenuId === 'file' ? '' : 'hidden'}`}
              id="menu-file"
            >
              <div className="menu-dropdown-item" onClick={handleNew}>
                <u>N</u>ew
              </div>
              <div className="menu-dropdown-item" onClick={() => fileInputRef.current?.click()}>
                <u>O</u>pen...
              </div>
              <div className="menu-dropdown-item" onClick={saveAsDoc}>
                <u>S</u>ave
              </div>
              <div className="menu-dropdown-divider" />
              <div className="menu-dropdown-item" onClick={handlePrint}>
                <u>P</u>rint...
              </div>
              <div className="menu-dropdown-divider" />
              <div className="menu-dropdown-item" onClick={handleExit}>
                E<u>x</u>it
              </div>
            </div>
          </div>
          <input
            ref={fileInputRef as React.RefObject<HTMLInputElement>}
            type="file"
            style={{ display: 'none' }}
            accept=".txt,.html,.doc,.rtf"
            onChange={handleOpenFile}
          />
          {(['edit', 'view', 'insert', 'format', 'tools', 'table', 'window', 'help'] as const).map(
            (name) => (
              <button
                key={name}
                type="button"
                className="menu-item"
                data-menu={name}
                onClick={(e) => handleMenuTrigger(e, name)}
              >
                <span className="menu-title">
                  {name === 'edit' && (
                    <>
                      <u>E</u>dit
                    </>
                  )}
                  {name === 'view' && (
                    <>
                      <u>V</u>iew
                    </>
                  )}
                  {name === 'insert' && (
                    <>
                      <u>I</u>nsert
                    </>
                  )}
                  {name === 'format' && (
                    <>
                      F<u>o</u>rmat
                    </>
                  )}
                  {name === 'tools' && (
                    <>
                      <u>T</u>ools
                    </>
                  )}
                  {name === 'table' && (
                    <>
                      T<u>a</u>ble
                    </>
                  )}
                  {name === 'window' && (
                    <>
                      <u>W</u>indow
                    </>
                  )}
                  {name === 'help' && (
                    <>
                      <u>H</u>elp
                    </>
                  )}
                </span>
              </button>
            ),
          )}
        </div>
        <div className="menu-right">
          <button type="button" className="win-btn doc-close-btn">
            X
          </button>
        </div>
      </div>

      {MENU_IDS.filter((id) => id !== 'file').map((id) => (
        <div
          key={id}
          id={`menu-${id}`}
          className={`menu-dropdown menu-dropdown-fixed ${openMenuId === id ? '' : 'hidden'}`}
          style={
            openMenuId === id && menuPosition
              ? { position: 'fixed', left: menuPosition.left, top: menuPosition.top }
              : undefined
          }
        >
          {id === 'edit' && (
            <>
              <div className="menu-dropdown-item" onClick={() => exec('undo')}>
                Undo
              </div>
              <div className="menu-dropdown-item">Repeat</div>
              <div className="menu-dropdown-divider" />
              <div className="menu-dropdown-item" onClick={() => exec('cut')}>
                Cut
              </div>
              <div className="menu-dropdown-item" onClick={() => exec('copy')}>
                Copy
              </div>
              <div className="menu-dropdown-item" onClick={() => exec('paste')}>
                Paste
              </div>
              <div className="menu-dropdown-item">Paste Special...</div>
              <div className="menu-dropdown-divider" />
              <div className="menu-dropdown-item">Find...</div>
              <div className="menu-dropdown-item">Replace...</div>
            </>
          )}
          {id === 'view' && (
            <>
              <div
                className="menu-dropdown-item"
                onClick={() => {
                  setViewMode('normal');
                  closeMenus();
                }}
              >
                Normal
              </div>
              <div className="menu-dropdown-item">Online Layout</div>
              <div
                className="menu-dropdown-item"
                onClick={() => {
                  setViewMode('print');
                  closeMenus();
                }}
              >
                Page Layout
              </div>
              <div className="menu-dropdown-item">Outline</div>
              <div className="menu-dropdown-divider" />
              <div className="menu-dropdown-item">Toolbars</div>
              <div className="menu-dropdown-item">Ruler</div>
              <div className="menu-dropdown-item">Document Map</div>
              <div className="menu-dropdown-item">Zoom...</div>
            </>
          )}
          {id === 'insert' && (
            <>
              <div className="menu-dropdown-item">Break...</div>
              <div className="menu-dropdown-item">Page Numbers...</div>
              <div className="menu-dropdown-item">Picture</div>
              <div className="menu-dropdown-item">Object...</div>
              <div className="menu-dropdown-divider" />
              <div
                className="menu-dropdown-item"
                data-cmd="hyperlink"
                onClick={() => handleMenuAction('', 'hyperlink')}
              >
                Hyperlink...
              </div>
              <div
                className="menu-dropdown-item"
                data-cmd="table"
                onClick={() => handleMenuAction('', 'table')}
              >
                Table...
              </div>
            </>
          )}
          {id === 'format' && (
            <>
              <div className="menu-dropdown-item">Font...</div>
              <div className="menu-dropdown-item">Paragraph...</div>
              <div className="menu-dropdown-item">Bullets and Numbering...</div>
              <div className="menu-dropdown-divider" />
              <div className="menu-dropdown-item">Columns...</div>
              <div className="menu-dropdown-item">Tabs...</div>
            </>
          )}
          {id === 'tools' && (
            <>
              <div className="menu-dropdown-item">Spelling and Grammar...</div>
              <div className="menu-dropdown-item">Word Count...</div>
              <div className="menu-dropdown-item">Options...</div>
            </>
          )}
          {id === 'table' && (
            <>
              <div className="menu-dropdown-item">Insert Table...</div>
              <div className="menu-dropdown-item">Delete Cells...</div>
              <div className="menu-dropdown-item">Merge Cells</div>
            </>
          )}
          {id === 'window' && (
            <>
              <div className="menu-dropdown-item">New Window</div>
              <div className="menu-dropdown-item">Arrange All</div>
              <div className="menu-dropdown-divider" />
              <div className="menu-dropdown-item">Document1</div>
            </>
          )}
          {id === 'help' && (
            <>
              <div className="menu-dropdown-item">Microsoft Word Help</div>
              <div
                className="menu-dropdown-item"
                id="menu-about-word"
                onClick={() => setAboutOpen(true)}
              >
                About Microsoft Word
              </div>
            </>
          )}
        </div>
      ))}

      <div
        id="about-dialog"
        className="about-dialog"
        hidden={!aboutOpen}
        style={aboutOpen ? {} : { display: 'none' }}
      >
        <div className="about-dialog-inner">
          <div className="about-title">Microsoft Word 97</div>
          <div className="about-version">Copyright © 1983-1996 Microsoft Corp.</div>
          <button type="button" className="about-word-icon" title="Word icon">
            <span className="about-word-icon-w">W</span>
          </button>
          <div className="about-ok-wrap">
            <button type="button" className="about-ok-btn" onClick={() => setAboutOpen(false)}>
              OK
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
