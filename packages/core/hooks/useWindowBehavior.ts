'use client';

import { useRef, useEffect } from 'react';

const MIN_W = 320;
const MIN_H = 200;

/** Win98 taskbar ~28px; KarpOS/macOSX dock ~52px — keeps resize below the bar */
function taskbarReservePx(): number {
  if (typeof document === 'undefined') return 28;
  const cl = document.body.classList;
  return cl.contains('karpos-desktop') || cl.contains('macosx-desktop') ? 52 : 28;
}

// ── Window snap (KarpOS only) ────────────────────────────────────────────────

/** Pixels from viewport edge that trigger a snap zone. */
const SNAP_EDGE = 20;

type SnapZone = 'left' | 'right' | 'maximize';

function isKarpOS(): boolean {
  return typeof document !== 'undefined' && document.body.classList.contains('karpos-desktop');
}

function getSnapZone(x: number, y: number): SnapZone | null {
  if (!isKarpOS()) return null;
  if (y < SNAP_EDGE) return 'maximize';
  if (x < SNAP_EDGE) return 'left';
  if (x > window.innerWidth - SNAP_EDGE) return 'right';
  return null;
}

// ── Window snap (KarpOS only) ────────────────────────────────────────────────

/** Pixels from viewport edge that trigger a snap zone. */
const SNAP_EDGE = 20;

type SnapZone = 'left' | 'right' | 'maximize';

function isKarpOS(): boolean {
  return typeof document !== 'undefined' && document.body.classList.contains('karpos-desktop');
}

function getSnapZone(x: number, y: number): SnapZone | null {
  if (!isKarpOS()) return null;
  if (y < SNAP_EDGE) return 'maximize';
  if (x < SNAP_EDGE) return 'left';
  if (x > window.innerWidth - SNAP_EDGE) return 'right';
  return null;
}

interface Bounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

function getSnapBounds(zone: SnapZone): Bounds {
  const taskbar = taskbarReservePx();
  const vw = window.innerWidth;
  const vh = window.innerHeight - taskbar;
  switch (zone) {
    case 'left':
      return { left: 0, top: 0, width: Math.floor(vw / 2), height: vh };
    case 'right':
      return { left: Math.floor(vw / 2), top: 0, width: Math.ceil(vw / 2), height: vh };
    case 'maximize':
      return { left: 0, top: 0, width: vw, height: vh };
  }
}

/** Module-level singleton preview element — only one snap preview at a time. */
let _snapPreviewEl: HTMLDivElement | null = null;

function getSnapPreviewEl(): HTMLDivElement {
  if (!_snapPreviewEl) {
    _snapPreviewEl = document.createElement('div');
    _snapPreviewEl.className = 'karp-snap-preview';
    _snapPreviewEl.style.display = 'none';
    document.body.appendChild(_snapPreviewEl);
  }
  return _snapPreviewEl;
}

function showSnapPreview(zone: SnapZone) {
  const el = getSnapPreviewEl();
  const b = getSnapBounds(zone);
  el.style.left = b.left + 'px';
  el.style.top = b.top + 'px';
  el.style.width = b.width + 'px';
  el.style.height = b.height + 'px';
  el.style.display = 'block';
}

function hideSnapPreview() {
  if (_snapPreviewEl) _snapPreviewEl.style.display = 'none';
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
      let currentSnapZone: SnapZone | null = null;

      const onMove = (x: number, y: number) => {
        const zone = getSnapZone(x, y);
        if (zone) {
          showSnapPreview(zone);
          currentSnapZone = zone;
          return; // Freeze window position while previewing snap
        }
        hideSnapPreview();
        currentSnapZone = null;
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
        hideSnapPreview();
        if (currentSnapZone) {
          const b = getSnapBounds(currentSnapZone);
          el.style.left = b.left + 'px';
          el.style.top = b.top + 'px';
          el.style.width = b.width + 'px';
          el.style.height = b.height + 'px';
          setBoundsRef.current(appId, b);
          return;
        }
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
