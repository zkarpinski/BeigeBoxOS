'use client';

import React, { RefObject } from 'react';

interface WordEditorAreaProps {
  editorRef: RefObject<HTMLDivElement | null>;
  zoomStyle: React.CSSProperties;
}

export function WordEditorArea({ editorRef, zoomStyle }: WordEditorAreaProps) {
  return (
    <div className="workspace-area" style={zoomStyle}>
      <div className="editor-container">
        <div
          ref={editorRef as React.RefObject<HTMLDivElement>}
          id="editor"
          contentEditable
          suppressContentEditableWarning
        />
      </div>
      <div className="scrollbar-v">
        <button className="scroll-btn up">▲</button>
        <div className="scroll-track-v">
          <div className="scroll-thumb-v" />
        </div>
        <button className="scroll-btn down">▼</button>
        <button className="scroll-btn double-up">⇞</button>
        <button className="scroll-btn circle">⚪</button>
        <button className="scroll-btn double-down">⇟</button>
      </div>
    </div>
  );
}
