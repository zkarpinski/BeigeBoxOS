'use client';

import React, { useEffect, useRef } from 'react';
import { useWindowManager } from '../../context/WindowManagerContext';
import type { AppConfig } from '../../types/app-config';

export interface AppWindowProps {
  /** Window element id (e.g. 'notepad-window'). Required for shell. */
  id: string;
  /** App id that maps to WindowManagerContext state. */
  appId: string;
  /** Class names for the outer div (e.g. 'notepad-window app-window') */
  className: string;
  /** Title bar content; must render .title-bar and data-win-* buttons */
  titleBar: React.ReactNode;
  /** Rest of window content */
  children: React.ReactNode;
  /** If true, appends a bottom-right resize grip. Default false. */
  allowResize?: boolean;
  /** CSS class toggled on maximize. Default 'maximized'. */
  maximizedClass?: string;
  /** Called before hideApp when close button is clicked. */
  onClose?: () => void;
  /** Override drag permission check. Default: blocks drag when maximizedClass is present. */
  getCanDrag?: (el: HTMLElement) => boolean;
}

/** Attach appConfig as a static prop on any app component. */
export type WithAppConfig<T> = T & { appConfig: AppConfig };

const MIN_W = 320;
const MIN_H = 200;

/**
 * App window with full Win98 chrome: drag, resize, min/max/close.
 * Shell state (visible, minimized, zIndex, bounds) lives in WindowManagerContext.
 * Minimize keeps the app on the taskbar; clicking the taskbar restores it.
 * Window positions/sizes are saved to localStorage on drag/resize end.
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
  const { apps, hideApp, focusApp, minimizeApp, setBounds } = useWindowManager();
  const appState = apps[appId];
  const windowRef = useRef<HTMLDivElement>(null);
  const restoredPos = useRef<{ left: string; top: string; width: string; height: string } | null>(
    null,
  );

  // Stable refs so the one-time chrome useEffect can always call the latest callbacks
  const minimizeAppRef = useRef(minimizeApp);
  const setBoundsRef = useRef(setBounds);
  minimizeAppRef.current = minimizeApp;
  setBoundsRef.current = setBounds;

  // ── Visibility: show if visible AND not minimized ─────────────────────────
  useEffect(() => {
    const el = windowRef.current;
    if (!el || !appState) return;
    const show = appState.visible && !appState.minimized;
    el.style.display = show ? 'flex' : 'none';
    el.classList.toggle('app-window-hidden', !show);
  }, [appState?.visible, appState?.minimized]);

  // ── zIndex ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = windowRef.current;
    if (!el || !appState) return;
    el.style.zIndex = String(appState.zIndex);
  }, [appState?.zIndex]);

  // ── Restore saved bounds when window first becomes visible ────────────────
  // Uses a ref so subsequent drag/resize updates to appState.bounds don't fight
  // with the imperative style set by the drag handler.
  const boundsAppliedRef = useRef(false);
  useEffect(() => {
    const el = windowRef.current;
    if (!el || !appState?.bounds || boundsAppliedRef.current) return;
    // Apply once — after this, drag/resize own the element's style
    boundsAppliedRef.current = true;
    if (appState.visible && !appState.minimized) {
      const b = appState.bounds;
      el.style.left = b.left + 'px';
      el.style.top = b.top + 'px';
      el.style.width = b.width + 'px';
      el.style.height = b.height + 'px';
    }
  }, [appState?.bounds]); // appState.visible/minimized deliberately omitted — apply on first bounds appearance

  // ── Chrome: drag, resize, min/max/close ───────────────────────────────────
  // Runs once per appId. Uses refs for callbacks to avoid stale closures.
  useEffect(() => {
    const el = windowRef.current;
    if (!el) return;

    // Bring to front on click or touch inside the window
    const onMouseDown = () => focusApp(appId);
    const onTouchStart = () => focusApp(appId);
    el.addEventListener('mousedown', onMouseDown);
    el.addEventListener('touchstart', onTouchStart, { passive: true });

    // ── Minimize ────────────────────────────────────────────────────────────
    const btnMin = el.querySelector('[data-win-min]') as HTMLElement | null;
    if (btnMin) {
      const onMin = () => {
        if (el.classList.contains('win-minimizing')) return;
        el.classList.add('win-minimizing');
        let done = false;
        const onEnd = () => {
          if (done) return;
          done = true;
          el.removeEventListener('transitionend', onEnd);
          el.classList.remove('win-minimizing');
          // Minimize (keep on taskbar) instead of closing
          minimizeAppRef.current(appId);
        };
        el.addEventListener('transitionend', onEnd);
        setTimeout(onEnd, 320); // fallback if no transition
      };
      btnMin.addEventListener('click', onMin);
    }

    // ── Maximize / Restore ──────────────────────────────────────────────────
    const btnMax = el.querySelector('[data-win-max]') as HTMLElement | null;
    if (btnMax && maximizedClass) {
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
      btnMax.addEventListener('click', onMax);
    }

    // ── Close ───────────────────────────────────────────────────────────────
    const btnClose = el.querySelector('[data-win-close]') as HTMLElement | null;
    if (btnClose) {
      const onClose_ = () => {
        if (onClose) onClose();
        else hideApp(appId);
      };
      btnClose.addEventListener('click', onClose_);
    }

    // ── Drag (mouse + touch for mobile) ──────────────────────────────────────
    // Imperative during drag for perf; saves bounds to context/localStorage on pointer up only.
    const titleBar_ = el.querySelector('.title-bar') as HTMLElement | null;
    let onTitleMouseDown: ((e: MouseEvent) => void) | null = null;
    let onTitleTouchStart: ((e: TouchEvent) => void) | null = null;
    if (titleBar_) {
      const rect = () => el.getBoundingClientRect();
      const maxLeft = () => window.innerWidth - 40;
      const maxTop = () => window.innerHeight - 28 - 22;

      const startDrag = (clientX: number, clientY: number) => {
        const r = rect();
        let startX = clientX;
        let startY = clientY;
        let startLeft = r.left;
        let startTop = r.top;

        const onMove = (x: number, y: number) => {
          let newLeft = startLeft + (x - startX);
          let newTop = startTop + (y - startY);
          const r2 = rect();
          newLeft = Math.max(-r2.width + 40, Math.min(newLeft, maxLeft()));
          newTop = Math.max(0, Math.min(newTop, maxTop()));
          el.style.left = newLeft + 'px';
          el.style.top = newTop + 'px';
        };
        const onUp = () => {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
          document.removeEventListener('touchmove', onTouchMove, { capture: true });
          document.removeEventListener('touchend', onTouchEnd, { capture: true });
          document.removeEventListener('touchcancel', onTouchEnd, { capture: true });
          const r2 = rect();
          setBoundsRef.current(appId, {
            left: r2.left,
            top: r2.top,
            width: r2.width,
            height: r2.height,
          });
        };

        const onMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY);
        const onMouseUp = () => onUp();

        const onTouchMove = (e: TouchEvent) => {
          if (e.touches.length === 0) return;
          e.preventDefault();
          onMove(e.touches[0].clientX, e.touches[0].clientY);
        };
        const onTouchEnd = () => onUp();

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
        document.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
        document.addEventListener('touchend', onTouchEnd, { capture: true });
        document.addEventListener('touchcancel', onTouchEnd, { capture: true });
      };

      onTitleMouseDown = (e: MouseEvent) => {
        if (e.button !== 0) return;
        if ((e.target as HTMLElement).closest('.title-bar-controls')) return;
        const canDrag = getCanDrag ? getCanDrag(el) : !el.classList.contains(maximizedClass);
        if (!canDrag) return;
        e.preventDefault();
        startDrag(e.clientX, e.clientY);
      };
      onTitleTouchStart = (e: TouchEvent) => {
        if ((e.target as HTMLElement).closest('.title-bar-controls')) return;
        const canDrag = getCanDrag ? getCanDrag(el) : !el.classList.contains(maximizedClass);
        if (!canDrag) return;
        if (e.touches.length === 0) return;
        e.preventDefault();
        startDrag(e.touches[0].clientX, e.touches[0].clientY);
      };

      titleBar_.addEventListener('mousedown', onTitleMouseDown as EventListener);
      titleBar_.addEventListener('touchstart', onTitleTouchStart as EventListener, {
        passive: false,
      });
    }

    // ── Resize grip (mouse + touch) ───────────────────────────────────────────
    let gripCleanup: (() => void) | undefined;
    if (allowResize) {
      const grip = el.querySelector('.win-resize-grip') as HTMLElement | null;
      if (grip) {
        const startResize = (clientX: number, clientY: number) => {
          if (el.classList.contains(maximizedClass)) return;
          const startX = clientX;
          const startY = clientY;
          const rect = el.getBoundingClientRect();
          const startW = rect.width;
          const startH = rect.height;

          const onMove = (x: number, y: number) => {
            const maxW = window.innerWidth - rect.left;
            const maxH = window.innerHeight - 28 - rect.top;
            let newW = startW + (x - startX);
            let newH = startH + (y - startY);
            newW = Math.max(MIN_W, Math.min(newW, maxW));
            newH = Math.max(MIN_H, Math.min(newH, maxH));
            el.style.width = newW + 'px';
            el.style.height = newH + 'px';
          };
          const onUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.removeEventListener('touchmove', onTouchMove, { capture: true });
            document.removeEventListener('touchend', onTouchEnd, { capture: true });
            document.removeEventListener('touchcancel', onTouchEnd, { capture: true });
            const r = el.getBoundingClientRect();
            setBoundsRef.current(appId, {
              left: r.left,
              top: r.top,
              width: r.width,
              height: r.height,
            });
          };
          const onMouseMove = (e: MouseEvent) => onMove(e.clientX, e.clientY);
          const onMouseUp = () => onUp();
          const onTouchMove = (e: TouchEvent) => {
            if (e.touches.length === 0) return;
            e.preventDefault();
            onMove(e.touches[0].clientX, e.touches[0].clientY);
          };
          const onTouchEnd = () => onUp();

          document.addEventListener('mousemove', onMouseMove);
          document.addEventListener('mouseup', onMouseUp);
          document.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
          document.addEventListener('touchend', onTouchEnd, { capture: true });
          document.addEventListener('touchcancel', onTouchEnd, { capture: true });
        };

        const onGripMouseDown = (e: MouseEvent) => {
          if (e.button !== 0) return;
          e.preventDefault();
          e.stopPropagation();
          startResize(e.clientX, e.clientY);
        };
        const onGripTouchStart = (e: TouchEvent) => {
          if (el.classList.contains(maximizedClass)) return;
          if (e.touches.length === 0) return;
          e.preventDefault();
          e.stopPropagation();
          startResize(e.touches[0].clientX, e.touches[0].clientY);
        };
        grip.addEventListener('mousedown', onGripMouseDown as EventListener);
        grip.addEventListener('touchstart', onGripTouchStart as EventListener, { passive: false });
        gripCleanup = () => {
          grip.removeEventListener('mousedown', onGripMouseDown as EventListener);
          grip.removeEventListener('touchstart', onGripTouchStart as EventListener);
        };
      }
    }

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('touchstart', onTouchStart);
      if (titleBar_ && onTitleMouseDown && onTitleTouchStart) {
        titleBar_.removeEventListener('mousedown', onTitleMouseDown as EventListener);
        titleBar_.removeEventListener('touchstart', onTitleTouchStart as EventListener);
      }
      gripCleanup?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId, allowResize, maximizedClass, getCanDrag]);

  // ── Initial render ────────────────────────────────────────────────────────
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
      className={`${baseClass}${show ? '' : ' app-window-hidden'}`}
      style={{ display: show ? 'flex' : 'none', zIndex }}
    >
      {titleBar}
      {children}
      {allowResize && <div className="win-resize-grip" aria-label="Resize" />}
    </div>
  );
}
