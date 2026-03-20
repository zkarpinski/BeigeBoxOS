'use client';

import React, { RefObject } from 'react';
import {
  ToolbarRow,
  Toolbar,
  ToolbarButton,
  ToolbarSeparator,
  ToolbarSelect,
} from '../../win98/toolbar';

const FONT_SIZES: Record<number, number> = {
  8: 1,
  9: 2,
  10: 3,
  11: 3,
  12: 4,
  14: 4,
  16: 5,
  18: 5,
  24: 6,
};

interface WordToolbarsProps {
  exec: (cmd: string, value?: string | null) => void;
  zoom: string;
  setZoom: (v: string) => void;
  formatBold: boolean;
  formatItalic: boolean;
  formatUnderline: boolean;
  handleNew: () => void;
  handleOpenClick: () => void;
  saveAsDoc: () => void;
  handlePrint: () => void;
  handleInsertTable: () => void;
  handleHyperlink: () => void;
  handleFontColor: () => void;
  editorRef: RefObject<HTMLDivElement | null>;
  fileInputRef: RefObject<HTMLInputElement | null>;
}

export function WordToolbars({
  exec,
  zoom,
  setZoom,
  formatBold,
  formatItalic,
  formatUnderline,
  handleNew,
  handleOpenClick,
  saveAsDoc,
  handlePrint,
  handleInsertTable,
  handleHyperlink,
  handleFontColor,
  editorRef,
}: WordToolbarsProps) {
  return (
    <>
      <ToolbarRow>
        <Toolbar className="standard-toolbar">
          <ToolbarButton title="New" onClick={handleNew}>
            <span className="icon">📄</span>
          </ToolbarButton>
          <ToolbarButton title="Open" onClick={handleOpenClick}>
            <span className="icon">📂</span>
          </ToolbarButton>
          <ToolbarButton title="Save" onClick={saveAsDoc}>
            <span className="icon">💾</span>
          </ToolbarButton>
          <ToolbarButton title="Print" onClick={handlePrint}>
            <span className="icon">🖨️</span>
          </ToolbarButton>
          <ToolbarButton title="Print Preview" onClick={handlePrint}>
            <span className="icon">🔍</span>
          </ToolbarButton>
          <ToolbarButton title="Spelling" onClick={() => editorRef.current?.focus()}>
            <span className="icon" style={{ fontSize: '8px' }}>
              abc
              <br />✓
            </span>
          </ToolbarButton>
          <ToolbarSeparator />
          <ToolbarButton title="Cut" onClick={() => exec('cut')}>
            <span className="icon">✂️</span>
          </ToolbarButton>
          <ToolbarButton title="Copy" onClick={() => exec('copy')}>
            <span className="icon">📄</span>
          </ToolbarButton>
          <ToolbarButton title="Paste" onClick={() => exec('paste')}>
            <span className="icon">📋</span>
          </ToolbarButton>
          <ToolbarButton title="Format Painter" onClick={() => exec('copy')}>
            <span className="icon">🖌️</span>
          </ToolbarButton>
          <ToolbarSeparator />
          <ToolbarButton title="Undo" onClick={() => exec('undo')}>
            <span className="icon">↩️</span>
          </ToolbarButton>
          <ToolbarButton title="Redo" onClick={() => exec('redo')}>
            <span className="icon">↪️</span>
          </ToolbarButton>
          <ToolbarSeparator />
          <ToolbarButton title="Insert Hyperlink" onClick={handleHyperlink}>
            <span className="icon">🔗</span>
          </ToolbarButton>
          <ToolbarButton title="Insert Table" onClick={handleInsertTable}>
            <span className="icon">🌐</span>
          </ToolbarButton>
          <ToolbarSeparator />
          <ToolbarButton>
            <span className="icon">▦</span>
          </ToolbarButton>
          <ToolbarButton>
            <span className="icon">⊞</span>
          </ToolbarButton>
          <ToolbarButton>
            <span className="icon">📗</span>
          </ToolbarButton>
          <ToolbarButton>
            <span className="icon" style={{ transform: 'rotate(90deg)' }}>
              ≡
            </span>
          </ToolbarButton>
          <ToolbarSeparator />
          <ToolbarButton>
            <span className="icon">△</span>
          </ToolbarButton>
          <ToolbarButton>
            <span className="icon">🗺️</span>
          </ToolbarButton>
          <ToolbarButton>
            <span className="icon">¶</span>
          </ToolbarButton>
          <ToolbarSeparator />
          <ToolbarSelect
            className="zoom-select"
            title="Zoom"
            value={zoom}
            onChange={(e) => setZoom(e.target.value)}
          >
            <option value="100">100%</option>
            <option value="75">75%</option>
            <option value="50">50%</option>
            <option value="150">150%</option>
            <option value="200">200%</option>
          </ToolbarSelect>
          <ToolbarSeparator />
          <ToolbarButton title="Help" onClick={() => editorRef.current?.focus()}>
            <span className="icon">?</span>
          </ToolbarButton>
        </Toolbar>
      </ToolbarRow>
      <ToolbarRow>
        <Toolbar className="formatting-toolbar">
          <ToolbarSelect
            className="style-select"
            title="Style"
            onChange={(e) => {
              const v = e.target.value;
              if (v === 'Heading 1') exec('formatBlock', 'h1');
              else if (v === 'Heading 2') exec('formatBlock', 'h2');
              else exec('formatBlock', 'p');
            }}
          >
            <option>Normal</option>
            <option>Heading 1</option>
            <option>Heading 2</option>
          </ToolbarSelect>
          <ToolbarSelect
            className="font-select"
            title="Font"
            onChange={(e) => exec('fontName', e.target.value)}
          >
            <option>Times New Roman</option>
            <option>Arial</option>
            <option>Courier New</option>
            <option>Georgia</option>
            <option>Verdana</option>
          </ToolbarSelect>
          <ToolbarSelect
            className="size-select"
            title="Font Size"
            defaultValue="10"
            onChange={(e) => {
              const size = FONT_SIZES[parseInt(e.target.value, 10)] ?? 3;
              exec('fontSize', String(size));
            }}
          >
            <option>8</option>
            <option>9</option>
            <option value="10">10</option>
            <option>11</option>
            <option>12</option>
            <option>14</option>
            <option>16</option>
            <option>18</option>
            <option>24</option>
          </ToolbarSelect>
          <ToolbarSeparator />
          <ToolbarButton
            className="format-btn"
            title="Bold"
            active={formatBold}
            onClick={() => exec('bold')}
            style={{ fontWeight: 900, fontFamily: 'Times New Roman' }}
          >
            B
          </ToolbarButton>
          <ToolbarButton
            className="format-btn"
            title="Italic"
            active={formatItalic}
            onClick={() => exec('italic')}
            style={{ fontStyle: 'italic', fontFamily: 'Times New Roman', fontWeight: 'bold' }}
          >
            I
          </ToolbarButton>
          <ToolbarButton
            className="format-btn"
            title="Underline"
            active={formatUnderline}
            onClick={() => exec('underline')}
            style={{
              textDecoration: 'underline',
              fontFamily: 'Times New Roman',
              fontWeight: 'bold',
            }}
          >
            U
          </ToolbarButton>
          <ToolbarSeparator />
          <ToolbarButton
            className="align-btn"
            title="Align Left"
            onClick={() => exec('justifyLeft')}
          >
            <span className="icon align-icon">≣</span>
          </ToolbarButton>
          <ToolbarButton className="align-btn" title="Center" onClick={() => exec('justifyCenter')}>
            <span className="icon align-icon">≡</span>
          </ToolbarButton>
          <ToolbarButton
            className="align-btn"
            title="Align Right"
            onClick={() => exec('justifyRight')}
          >
            <span className="icon align-icon">≣</span>
          </ToolbarButton>
          <ToolbarButton className="align-btn" title="Justify" onClick={() => exec('justifyFull')}>
            <span className="icon align-icon">≣</span>
          </ToolbarButton>
          <ToolbarSeparator />
          <ToolbarButton title="Numbering" onClick={() => exec('insertOrderedList')}>
            <span className="icon list-icon">1≡</span>
          </ToolbarButton>
          <ToolbarButton title="Bullets" onClick={() => exec('insertUnorderedList')}>
            <span className="icon list-icon">•≡</span>
          </ToolbarButton>
          <ToolbarButton title="Decrease Indent" onClick={() => exec('outdent')}>
            <span className="icon list-icon">←≡</span>
          </ToolbarButton>
          <ToolbarButton title="Increase Indent" onClick={() => exec('indent')}>
            <span className="icon list-icon">→≡</span>
          </ToolbarButton>
          <ToolbarSeparator />
          <ToolbarButton>
            <span className="icon box-icon">□</span>
          </ToolbarButton>
          <ToolbarSeparator />
          <ToolbarButton title="Font Color" onClick={handleFontColor}>
            <span className="icon">🖍️</span>
            <span className="dropdown-arrow">▼</span>
          </ToolbarButton>
          <ToolbarButton>
            <span
              className="icon"
              style={{
                color: 'blue',
                fontWeight: 'bold',
                fontFamily: 'Times New Roman',
                borderBottom: '2px solid blue',
              }}
            >
              A
            </span>
            <span className="dropdown-arrow">▼</span>
          </ToolbarButton>
        </Toolbar>
      </ToolbarRow>
    </>
  );
}
