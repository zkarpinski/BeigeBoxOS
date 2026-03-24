'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { AppConfig } from '@retro-web/core/types/app-config';
import { useWindowManager, useOsShell } from '@retro-web/core/context';
import { PDF_READER_PENDING_KEY } from '@retro-web/core/apps/pdf-reader/constants';

export const PDF_READER_ICON_SRC = 'shell/icons/adobe-pdf-modern-icon.png';

export const pdfReaderAppConfig: AppConfig = {
  id: 'pdf-reader',
  label: 'PDF Reader',
  icon: PDF_READER_ICON_SRC,
  desktop: false,
  startMenu: { path: ['Programs', 'Accessories'], label: 'PDF Reader' },
  taskbarLabel: 'PDF Reader',
};

export function PdfReaderWindow() {
  const ctx = useWindowManager();
  const { AppWindow, TitleBar } = useOsShell();
  const [title, setTitle] = useState('PDF Reader');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const prevShowWindowRef = useRef(false);

  const pdfApp = ctx.apps['pdf-reader'];
  const showWindow = !!(pdfApp?.visible && !pdfApp?.minimized);

  useEffect(() => {
    if (!pdfApp?.visible) return;
    try {
      const raw = sessionStorage.getItem(PDF_READER_PENDING_KEY);
      if (!raw) return;
      sessionStorage.removeItem(PDF_READER_PENDING_KEY);
      const payload = JSON.parse(raw) as {
        filename?: string;
        pdfUrl?: string;
      };
      setTitle('PDF Reader');
      setPdfUrl(payload.pdfUrl ?? null);
    } catch (_) {
      /* ignore */
    }
  }, [pdfApp?.visible]);

  /** Default to maximized whenever the window becomes shown (incl. restore from minimize). */
  useEffect(() => {
    if (!showWindow) {
      prevShowWindowRef.current = false;
      return;
    }
    const justShown = !prevShowWindowRef.current;
    prevShowWindowRef.current = true;
    if (!justShown) return;

    let cancelled = false;
    const t = window.setTimeout(() => {
      if (cancelled) return;
      const win = document.getElementById('pdf-reader-window');
      const btn = win?.querySelector('[data-win-max]') as HTMLButtonElement | null;
      if (win && btn && !win.classList.contains('maximized')) {
        btn.click();
      }
    }, 50);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
      prevShowWindowRef.current = false;
    };
  }, [showWindow]);

  return (
    <AppWindow
      id="pdf-reader-window"
      appId="pdf-reader"
      className="pdf-reader-window app-window app-window-hidden windowed"
      allowResize
      titleBar={
        <TitleBar
          title={title}
          icon={
            <img
              src={PDF_READER_ICON_SRC}
              alt=""
              style={{ width: 16, height: 16, marginRight: 4 }}
            />
          }
          showMin
          showMax
          showClose
        />
      }
    >
      <div className="pdf-reader-root">
        <div className="pdf-reader-toolbar" role="toolbar" aria-label="Toolbar">
          <button type="button" className="pdf-reader-tb-btn" disabled>
            Page 1 of 1
          </button>
          <span className="pdf-reader-tb-sep" aria-hidden="true" />
          <button type="button" className="pdf-reader-tb-btn" disabled title="Zoom (mock)">
            100%
          </button>
        </div>
        <div className="pdf-reader-body">
          {pdfUrl ? (
            <iframe title={title} src={pdfUrl} className="pdf-reader-frame" />
          ) : (
            <div className="pdf-reader-fallback">
              <p>No document loaded.</p>
              <p>Open a PDF from the desktop or My Computer.</p>
            </div>
          )}
        </div>
      </div>
    </AppWindow>
  );
}
