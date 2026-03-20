'use client';

import React, { useEffect, useRef } from 'react';
import { useWindowManager } from '../../../context/WindowManagerContext';
import { DIALOG_ICONS } from './dialogIcons';

export function DialogModal() {
  const { dialogState } = useWindowManager();
  const dlgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dialogState) return;
    const dlg = dlgRef.current;
    if (!dlg) return;
    const titlebar = dlg.querySelector('.w97dlg-titlebar') as HTMLElement | null;
    if (!titlebar) return;
    let dragging = false,
      ox = 0,
      oy = 0;
    const onDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('.w97dlg-titlebtn')) return;
      dragging = true;
      const r = dlg.getBoundingClientRect();
      ox = e.clientX - r.left;
      oy = e.clientY - r.top;
      dlg.style.position = 'fixed';
      dlg.style.top = r.top + 'px';
      dlg.style.left = r.left + 'px';
      dlg.style.transform = 'none';
      dlg.style.margin = '0';
      e.preventDefault();
    };
    const onMove = (e: MouseEvent) => {
      if (!dragging) return;
      dlg.style.left = e.clientX - ox + 'px';
      dlg.style.top = e.clientY - oy + 'px';
    };
    const onUp = () => {
      dragging = false;
    };
    titlebar.addEventListener('mousedown', onDown);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      titlebar.removeEventListener('mousedown', onDown);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [dialogState]);

  if (!dialogState) return null;

  const { type, title, message, buttons, resolve } = dialogState;

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      resolve(buttons[0]);
    }
    if (e.key === 'Escape') {
      resolve(buttons[buttons.length - 1]);
    }
  };

  const safeMsg = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');

  return (
    <div className="w97dlg-overlay" onKeyDown={handleKey} tabIndex={-1}>
      <div ref={dlgRef} className="w97dlg" role="dialog" aria-modal="true">
        <div className="w97dlg-titlebar">
          <span className="w97dlg-title">{title}</span>
          <div className="w97dlg-titlebtns">
            {type === 'question' && (
              <button className="w97dlg-titlebtn" aria-label="Help">
                ?
              </button>
            )}
            <button
              className="w97dlg-titlebtn"
              aria-label="Close"
              onClick={() => resolve(buttons[buttons.length - 1])}
            >
              &#x2715;
            </button>
          </div>
        </div>
        <div className="w97dlg-body">
          <div
            className="w97dlg-icon"
            dangerouslySetInnerHTML={{ __html: DIALOG_ICONS[type] ?? DIALOG_ICONS.info }}
          />
          <div className="w97dlg-message" dangerouslySetInnerHTML={{ __html: safeMsg }} />
        </div>
        <div className="w97dlg-btnrow">
          {buttons.map((label, i) => (
            <button
              key={label}
              className={`w97dlg-btn${i === 0 ? ' w97dlg-btn-default' : ''}`}
              onClick={() => resolve(label)}
              autoFocus={i === 0}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
