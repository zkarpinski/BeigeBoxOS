'use client';

import { useRef, useEffect } from 'react';

const MIN_W = 320;
const MIN_H = 200;

/** Win98 taskbar ~28px; KarpOS dock ~52px — keeps resize below the bar */
function taskbarReservePx(): number {
  if (typeof document === 'undefined') return 28;
  return document.body.classList.contains('karpos-desktop') ? 52 : 28;
}

interface Bounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface UseWindowBehaviorOptions {
  appId: string;
  /** Bring this app to front. Provided by the OS WindowManagerContext. */
  focusApp: (appId: string) => void;
  /** Persist window bounds. Provided by the OS WindowManagerContext. */
  setBounds: (appId: string, bounds: Bounds) => void;
  /** Determines whether drag is permitted on the current element state. */
  getCanDrag?: (el: HTMLElement) => boolean;
  /** The CSS class applied when maximized. Default: 'maximized'. */
  maximizedClass?: string;
  /** Whether the resize grip is active. */
  allowResize?: boolean;
}

export interface UseWindowBehaviorResult {
  /** Attach to the window root div. */
  windowRef: React.RefObject<HTMLDivElement>;
  /** Call on window mousedown/touchstart to bring to front. */
  handleFocus: () => void;
  /**
   * Returns a mousedown handler for a given resize edge.
   * Currently 'se' is wired via the .win-resize-grip element in the useEffect.
   * Other edges are no-ops until implemented.
   */
  getResizeHandler: (
    edge: 'se' | 'e' | 's' | 'sw' | 'w' | 'n' | 'ne' | 'nw',
  ) => (e: React.MouseEvent) => void;
}

/**
 * Core window drag/resize/focus behavior — OS-agnostic.
 *
 * Does NOT import any context. Callers pass focusApp and setBounds from
 * their OS-specific WindowManagerContext so this hook works with any OS.
 *
 * Provides:
 * - windowRef: attach to the window root element
 * - handleFocus: call on mousedown/touchstart to bring the window to front
 * - getResizeHandler(edge): React mousedown handler for a resize grip
 *
 * Drag is wired via querySelector('.title-bar') on the windowRef element.
 * Resize is wired via querySelector('.win-resize-grip').
 * Bounds are persisted via setBounds on pointer up.
 */
export function useWindowBehavior({
  appId,
  focusApp,
  setBounds,
  getCanDrag,
  maximizedClass = 'maximized',
  allowResize = false,
}: UseWindowBehaviorOptions): UseWindowBehaviorResult {
  const windowRef = useRef<HTMLDivElement>(null);
  const setBoundsRef = useRef(setBounds);
  setBoundsRef.current = setBounds;

  // ── Focus on click ────────────────────────────────────────────────────────
  const handleFocus = () => focusApp(appId);

  // ── Drag (mouse + touch) ──────────────────────────────────────────────────
  useEffect(() => {
    const el = windowRef.current;
    if (!el) return;

    const titleBarEl = el.querySelector('.title-bar') as HTMLElement | null;
    if (!titleBarEl) return;

    const rect = () => el.getBoundingClientRect();
    const maxLeft = () => window.innerWidth - 40;
    const maxTop = () => window.innerHeight - 28 - 22;

    const startDrag = (clientX: number, clientY: number) => {
      const r = rect();
      const startX = clientX;
      const startY = clientY;
      const startLeft = r.left;
      const startTop = r.top;

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

    const onTitleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if ((e.target as HTMLElement).closest('.title-bar-controls')) return;
      const canDrag = getCanDrag ? getCanDrag(el) : !el.classList.contains(maximizedClass);
      if (!canDrag) return;
      e.preventDefault();
      startDrag(e.clientX, e.clientY);
    };

    const onTitleTouchStart = (e: TouchEvent) => {
      if ((e.target as HTMLElement).closest('.title-bar-controls')) return;
      const canDrag = getCanDrag ? getCanDrag(el) : !el.classList.contains(maximizedClass);
      if (!canDrag) return;
      if (e.touches.length === 0) return;
      e.preventDefault();
      startDrag(e.touches[0].clientX, e.touches[0].clientY);
    };

    titleBarEl.addEventListener('mousedown', onTitleMouseDown as EventListener);
    titleBarEl.addEventListener('touchstart', onTitleTouchStart as EventListener, {
      passive: false,
    });

    return () => {
      titleBarEl.removeEventListener('mousedown', onTitleMouseDown as EventListener);
      titleBarEl.removeEventListener('touchstart', onTitleTouchStart as EventListener);
    };
  }, [appId, getCanDrag, maximizedClass]);

  // ── Resize grip ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!allowResize) return;
    const el = windowRef.current;
    if (!el) return;

    const grip = el.querySelector('.win-resize-grip') as HTMLElement | null;
    if (!grip) return;

    const startResize = (clientX: number, clientY: number) => {
      if (el.classList.contains(maximizedClass)) return;
      const startX = clientX;
      const startY = clientY;
      const rect = el.getBoundingClientRect();
      const startW = rect.width;
      const startH = rect.height;

      const onMove = (x: number, y: number) => {
        const maxW = window.innerWidth - rect.left;
        const maxH = window.innerHeight - taskbarReservePx() - rect.top;
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

    return () => {
      grip.removeEventListener('mousedown', onGripMouseDown as EventListener);
      grip.removeEventListener('touchstart', onGripTouchStart as EventListener);
    };
  }, [appId, allowResize, maximizedClass]);

  // ── getResizeHandler (React synthetic event API) ──────────────────────────
  // Returns a React.MouseEvent handler for a named edge. Currently only 'se'
  // maps to the bottom-right corner resize (the grip element). Other edges are
  // provided for API completeness but are no-ops until implemented.
  const getResizeHandler =
    (_edge: 'se' | 'e' | 's' | 'sw' | 'w' | 'n' | 'ne' | 'nw') => (_e: React.MouseEvent) => {
      // TODO: implement per-edge resize if needed.
      // The 'se' resize is already handled via the .win-resize-grip element in the useEffect above.
    };

  return { windowRef, handleFocus, getResizeHandler };
}
