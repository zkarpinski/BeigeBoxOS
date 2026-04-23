'use client';

import React, { useEffect, useRef } from 'react';
import { useWindowManager } from '@retro-web/core/context';
import { useWindowBehavior } from '@retro-web/core/hooks';
import type { AppWindowProps, WithAppConfig } from '@retro-web/core/types/os-shell';

export type { AppWindowProps, WithAppConfig };

/**
 * App window with neo-brutalist chrome; behavior matches Win98 AppWindow.
 */
export function AppWindow({
  id,
  appId,
  className,
  titleBar,
  children,
  allowResize = false,
  maximizedClass = 'maximized',
  onClose,
  getCanDrag,
}: AppWindowProps) {
  const { apps, hideApp, minimizeApp, focusApp, setBounds } = useWindowManager();
  const appState = apps[appId];

  const { windowRef, handleFocus } = useWindowBehavior({
    appId,
    focusApp,
    setBounds,
    getCanDrag,
    maximizedClass,
    allowResize,
  });

  const minimizeAppRef = useRef(minimizeApp);
  minimizeAppRef.current = minimizeApp;

  const restoredPos = useRef<{ left: string; top: string; width: string; height: string } | null>(
    null,
  );

  useEffect(() => {
    const el = windowRef.current;
    if (!el || !appState) return;
    const show = appState.visible && !appState.minimized;
    el.style.display = show ? 'flex' : 'none';
    el.classList.toggle('app-window-hidden', !show);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState?.visible, appState?.minimized, windowRef]);

  useEffect(() => {
    const el = windowRef.current;
    if (!el || !appState) return;
    el.style.zIndex = String(appState.zIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState?.zIndex, windowRef]);

  const boundsAppliedRef = useRef(false);
  useEffect(() => {
    const el = windowRef.current;
    if (!el || !appState?.bounds || boundsAppliedRef.current) return;
    boundsAppliedRef.current = true;
    if (appState.visible && !appState.minimized) {
      const b = appState.bounds;
      el.style.left = b.left + 'px';
      el.style.top = b.top + 'px';
      el.style.width = b.width + 'px';
      el.style.height = b.height + 'px';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appState?.bounds, windowRef]);

  useEffect(() => {
    const el = windowRef.current;
    if (!el) return;

    const btnMin = el.querySelector('[data-win-min]') as HTMLElement | null;
    const onMin = () => {
      if (el.classList.contains('win-minimizing')) return;
      el.classList.add('win-minimizing');
      let done = false;
      const onEnd = () => {
        if (done) return;
        done = true;
        el.removeEventListener('transitionend', onEnd);
        el.classList.remove('win-minimizing');
        minimizeAppRef.current(appId);
      };
      el.addEventListener('transitionend', onEnd);
      setTimeout(onEnd, 320);
    };
    btnMin?.addEventListener('click', onMin);

    const btnMax = el.querySelector('[data-win-max]') as HTMLElement | null;
    const onMax = () => {
      const isMax = el.classList.contains(maximizedClass);
      if (isMax) {
        el.classList.remove(maximizedClass);
        if (restoredPos.current) {
          el.style.left = restoredPos.current.left;
          el.style.top = restoredPos.current.top;
          el.style.width = restoredPos.current.width;
          el.style.height = restoredPos.current.height;
        }
      } else {
        restoredPos.current = {
          left: el.style.left,
          top: el.style.top,
          width: el.style.width,
          height: el.style.height,
        };
        el.classList.add(maximizedClass);
        el.style.left = '';
        el.style.top = '';
        el.style.width = '';
        el.style.height = '';
      }
    };
    if (btnMax && maximizedClass) btnMax.addEventListener('click', onMax);

    const btnClose = el.querySelector('[data-win-close]') as HTMLElement | null;
    const onClose_ = () => {
      if (onClose) onClose();
      else hideApp(appId);
    };
    btnClose?.addEventListener('click', onClose_);

    return () => {
      btnMin?.removeEventListener('click', onMin);
      if (btnMax && maximizedClass) btnMax.removeEventListener('click', onMax);
      btnClose?.removeEventListener('click', onClose_);
    };
  }, [appId, maximizedClass, onClose, hideApp, windowRef]);

  const show = (appState?.visible ?? false) && !(appState?.minimized ?? false);
  const zIndex = appState?.zIndex ?? 10;
  const baseClass = className
    .replace(/\bapp-window-hidden\b/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return (
    <div
      ref={windowRef}
      id={id}
      className={`karp-app-window ${baseClass}${show ? '' : ' app-window-hidden'}`}
      style={{ display: show ? 'flex' : 'none', zIndex }}
      onMouseDown={handleFocus}
      onTouchStart={handleFocus}
    >
      {titleBar}
      {children}
      {allowResize && <div className="win-resize-grip" aria-label="Resize" />}
    </div>
  );
}
