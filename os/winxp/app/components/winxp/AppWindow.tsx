'use client';

import React, { useEffect, useRef } from 'react';
import { useWindowManager } from '@retro-web/core/context';
import type { AppWindowProps, WithAppConfig } from '@retro-web/core/types/os-shell';
// TODO(Phase 3.2): Refactor AppWindow to use useWindowBehavior from @retro-web/core/hooks.
// The drag/resize logic is currently duplicated in packages/core/hooks/useWindowBehavior.ts.
// A clean migration requires careful testing since AppWindow uses imperative DOM events.

export type { AppWindowProps, WithAppConfig };

const MIN_W = 320;
const MIN_H = 200;
const TASKBAR_H = 40;

type ResizeEdge = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

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
  const focusAppRef = useRef(focusApp);
  minimizeAppRef.current = minimizeApp;
  setBoundsRef.current = setBounds;
  focusAppRef.current = focusApp;

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

    // ── Edge + corner resize (mouse + touch), capture phase —────────────────
    let resizeCleanup: (() => void) | undefined;
    if (allowResize) {
      const startResizeEdge = (edge: ResizeEdge, clientX: number, clientY: number) => {
        if (el.classList.contains(maximizedClass)) return;
        const startX = clientX;
        const startY = clientY;
        const rect = el.getBoundingClientRect();
        const startLeft = rect.left;
        const startTop = rect.top;
        const startW = rect.width;
        const startH = rect.height;

        const hasE = edge === 'e' || edge === 'ne' || edge === 'se';
        const hasW = edge === 'w' || edge === 'nw' || edge === 'sw';
        const hasS = edge === 's' || edge === 'se' || edge === 'sw';
        const hasN = edge === 'n' || edge === 'ne' || edge === 'nw';

        const onMove = (x: number, y: number) => {
          const dx = x - startX;
          const dy = y - startY;
          let nl = startLeft;
          let nt = startTop;
          let nw = startW;
          let nh = startH;

          if (hasE) nw = startW + dx;
          if (hasW) {
            nw = startW - dx;
            nl = startLeft + dx;
          }
          if (hasS) nh = startH + dy;
          if (hasN) {
            nh = startH - dy;
            nt = startTop + dy;
          }

          if (nw < MIN_W) {
            if (hasW) nl = startLeft + startW - MIN_W;
            nw = MIN_W;
          }
          if (nh < MIN_H) {
            if (hasN) nt = startTop + startH - MIN_H;
            nh = MIN_H;
          }

          if (!hasW) nl = startLeft;
          if (!hasN) nt = startTop;

          nw = Math.min(nw, window.innerWidth - nl);
          nh = Math.min(nh, window.innerHeight - TASKBAR_H - nt);
          nw = Math.max(MIN_W, nw);
          nh = Math.max(MIN_H, nh);

          if (hasW) nl = Math.max(-nw + 40, Math.min(nl, window.innerWidth - 40));
          if (hasN) nt = Math.max(0, Math.min(nt, window.innerHeight - TASKBAR_H - nh));

          el.style.left = `${nl}px`;
          el.style.top = `${nt}px`;
          el.style.width = `${nw}px`;
          el.style.height = `${nh}px`;
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

      const onResizeMouseDown = (e: MouseEvent) => {
        if (e.button !== 0) return;
        const t = e.target as HTMLElement | null;
        const hit = t?.closest?.('.win-resize-hit') as HTMLElement | null;
        if (!hit || !el.contains(hit)) return;
        const raw = hit.getAttribute('data-win-resize');
        if (!raw) return;
        if (el.classList.contains(maximizedClass)) return;
        e.preventDefault();
        e.stopPropagation();
        focusAppRef.current(appId);
        startResizeEdge(raw as ResizeEdge, e.clientX, e.clientY);
      };

      const onResizeTouchStart = (e: TouchEvent) => {
        const t = e.target as HTMLElement | null;
        const hit = t?.closest?.('.win-resize-hit') as HTMLElement | null;
        if (!hit || !el.contains(hit)) return;
        const raw = hit.getAttribute('data-win-resize');
        if (!raw) return;
        if (el.classList.contains(maximizedClass)) return;
        if (e.touches.length === 0) return;
        e.preventDefault();
        e.stopPropagation();
        focusAppRef.current(appId);
        startResizeEdge(raw as ResizeEdge, e.touches[0].clientX, e.touches[0].clientY);
      };

      el.addEventListener('mousedown', onResizeMouseDown, true);
      el.addEventListener('touchstart', onResizeTouchStart, { passive: false, capture: true });
      resizeCleanup = () => {
        el.removeEventListener('mousedown', onResizeMouseDown, true);
        el.removeEventListener('touchstart', onResizeTouchStart, { capture: true });
      };
    }

    return () => {
      el.removeEventListener('mousedown', onMouseDown);
      el.removeEventListener('touchstart', onTouchStart);
      if (titleBar_ && onTitleMouseDown && onTitleTouchStart) {
        titleBar_.removeEventListener('mousedown', onTitleMouseDown as EventListener);
        titleBar_.removeEventListener('touchstart', onTitleTouchStart as EventListener);
      }
      resizeCleanup?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId, allowResize, maximizedClass, getCanDrag]);

  // ── Initial render ────────────────────────────────────────────────────────
  const show = (appState?.visible ?? false) && !(appState?.minimized ?? false);
  const zIndex = appState?.zIndex ?? 10;
  const maxZIndex = Object.values(apps)
    .filter((a) => a?.visible && !a?.minimized)
    .reduce((max, a) => Math.max(max, a?.zIndex ?? 0), 0);
  const isActive = zIndex >= maxZIndex;
  const baseClass = className
    .replace(/\bapp-window-hidden\b/g, '')
    .replace(/\bapp-window-active\b/g, '')
    .replace(/\bapp-window-inactive\b/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return (
    <div
      ref={windowRef}
      id={id}
      className={`${baseClass}${show ? '' : ' app-window-hidden'} ${isActive ? 'app-window-active' : 'app-window-inactive'}`}
      style={{ display: show ? 'flex' : 'none', zIndex }}
    >
      {titleBar}
      {children}
      {allowResize && (
        <div className="win-resize-frame" role="presentation">
          <div className="win-resize-hit win-resize-n" data-win-resize="n" />
          <div className="win-resize-hit win-resize-s" data-win-resize="s" />
          <div className="win-resize-hit win-resize-e" data-win-resize="e" />
          <div className="win-resize-hit win-resize-w" data-win-resize="w" />
          <div className="win-resize-hit win-resize-ne" data-win-resize="ne" />
          <div className="win-resize-hit win-resize-nw" data-win-resize="nw" />
          <div className="win-resize-hit win-resize-se" data-win-resize="se" aria-label="Resize" />
          <div className="win-resize-hit win-resize-sw" data-win-resize="sw" />
        </div>
      )}
    </div>
  );
}
