'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useWindowManager } from '@retro-web/core/context';
import { escapeHtml } from '@retro-web/core';
import type { BsodState, FatalErrorState } from '@retro-web/core/context';
import { DIALOG_ICONS } from './dialogIcons';

const DEFAULT_BSOD_MSG =
  'A fatal exception 0E has occurred at F000:E2C3 in VXD VMM(01) +\n' +
  '00010E36. The current application will be terminated.\n\n' +
  '*  Press any key to terminate the current application.\n' +
  '*  Press CTRL+ALT+DEL to restart your computer. You will\n' +
  '   lose any unsaved information in all applications.';

export function BsodOverlay({ state }: { state: BsodState | FatalErrorState }) {
  const { clearBsod } = useWindowManager();

  const dismiss = () => {
    const opts =
      state.type === 'bsod' ? (state as BsodState).options : (state as FatalErrorState).options;
    if (opts.clearStorage) {
      try {
        localStorage.clear();
      } catch (_) {}
      try {
        sessionStorage.clear();
      } catch (_) {}
    }
    clearBsod();
    if (opts.reload) {
      location.reload();
    }
  };

  useEffect(() => {
    const onKey = () => dismiss();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [state]);

  if (state.type === 'bsod') {
    const opts = (state as BsodState).options;
    const msg = opts.message ?? DEFAULT_BSOD_MSG;
    const safeMsg = escapeHtml(msg).replace(/\n/g, '<br>');
    return (
      <div className="w97-bsod" onClick={dismiss}>
        <div className="w97-bsod-inner">
          <div className="w97-bsod-header">Windows</div>
          <p className="w97-bsod-msg" dangerouslySetInnerHTML={{ __html: safeMsg }} />
          <p className="w97-bsod-prompt">
            Press any key to continue <span className="w97-bsod-cursor">_</span>
          </p>
        </div>
      </div>
    );
  }

  const opts = (state as FatalErrorState).options;
  const program = opts.program ?? 'Application';
  const detailsText =
    opts.details ??
    `${program.toUpperCase().replace(/\s/g, '')} caused an invalid page fault\nin module UNKNOWN.DLL at 0177:00401a3f.\n\nRegisters:\nEAX=00000000 CS=0177 EIP=00401a3f EFLGS=00010202\nEBX=00000000 SS=017f ESP=009ef800 EBP=00000000\nECX=00000000 DS=017f ESI=00000000 FS=3eaf\nEDX=00000000 ES=017f EDI=00000000 GS=0000\n\nBytes at CS:EIP:\nf0 a0 ac 00 f0 ce ad 00 f0 00 00 c5 09 28 00 08`;

  return <FatalErrorDialog program={program} detailsText={detailsText} onClose={dismiss} />;
}

function FatalErrorDialog({
  program,
  detailsText,
  onClose,
}: {
  program: string;
  detailsText: string;
  onClose: () => void;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const dlgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
  }, []);

  return (
    <div className="w97dlg-overlay">
      <div ref={dlgRef} className="w97dlg w97fe-dlg" role="dialog" aria-modal="true">
        <div className="w97dlg-titlebar">
          <span className="w97dlg-title">{program}</span>
          <div className="w97dlg-titlebtns">
            <button className="w97dlg-titlebtn w97fe-xbtn" aria-label="Close" onClick={onClose}>
              &#x2715;
            </button>
          </div>
        </div>
        <div className="w97fe-upper">
          <div className="w97dlg-icon" dangerouslySetInnerHTML={{ __html: DIALOG_ICONS.error }} />
          <div className="w97fe-msg">
            <p className="w97fe-line1">
              This program has performed an illegal operation and will be shut down.
            </p>
            <p className="w97fe-line2">If the problem persists, contact the program vendor.</p>
          </div>
          <div className="w97fe-btncol">
            <button className="w97dlg-btn w97dlg-btn-default" autoFocus onClick={onClose}>
              Close
            </button>
            <button className="w97dlg-btn" onClick={() => setDetailsOpen((v) => !v)}>
              Details {detailsOpen ? '«' : '»'}
            </button>
          </div>
        </div>
        {detailsOpen && (
          <div className="w97fe-details">
            <textarea className="w97fe-textarea" readOnly value={detailsText} />
          </div>
        )}
      </div>
    </div>
  );
}
