'use client';

import React, { useEffect, useRef } from 'react';
import { useWindowManager, Z_FOCUSED } from '@retro-web/core/context';
import { useWindowBehavior } from '@retro-web/core/hooks';
import type { AppWindowProps, WithAppConfig } from '@retro-web/core/types/os-shell';

export type { AppWindowProps, WithAppConfig };

/**
 * Mac OS X Aqua window with drag, resize, min/max/close and active/inactive state.
 * Adds `mac-active` when this window has the highest z-index (Z_FOCUSED).
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

  // ── Visibility ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = windowRef.current;
    if (!el || !appState) return;
    const show = appState.visible && !appState.minimized;
    el.style.display = show ? 'flex' : 'none';
    el.classList.toggle('app-window-hidden', !show);
  }, [appState?.visible, appState?.minimized]);

  // ── zIndex + active class ───────────────────────────────────────────────────
  useEffect(() => {
    const el = windowRef.current;
    if (!el || !appState) return;
    el.style.zIndex = String(appState.zIndex);
    el.classList.toggle('mac-active', appState.zIndex === Z_FOCUSED);
  }, [appState?.zIndex]);

  // ── Restore saved bounds ───────────────────────────────────────────────────
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
  }, [appState?.bounds]);

  // ── Chrome: minimize / maximize / close ───────────────────────────────────
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
  }, [appId, maximizedClass, onClose, hideApp]);

  // ── Render ────────────────────────────────────────────────────────────────
  const show = (appState?.visible ?? false) && !(appState?.minimized ?? false);
  const zIndex = appState?.zIndex ?? 10;
  const isActive = (appState?.zIndex ?? 10) === Z_FOCUSED;
  const baseClass = className
    .replace(/\bapp-window-hidden\b/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return (
    <div
      ref={windowRef}
      id={id}
      className={`mac-app-window ${baseClass}${isActive ? ' mac-active' : ''}${show ? '' : ' app-window-hidden'}`}
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
