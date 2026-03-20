'use client';

import React, { useEffect } from 'react';

/** Makes an absolutely positioned window draggable by its title bar, constrained to container. */
export function useAolDraggable(
  windowRef: React.RefObject<HTMLElement | null>,
  containerRef: React.RefObject<HTMLElement | null>,
  titleBarSelector: string,
  deps: React.DependencyList = [],
) {
  useEffect(() => {
    const win = windowRef.current;
    const container = containerRef.current;
    if (!win || !container) return;
    const titleBar = win.querySelector(titleBarSelector) as HTMLElement | null;
    if (!titleBar) return;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if ((e.target as HTMLElement).closest('button')) return;
      e.preventDefault();
      const cr = container.getBoundingClientRect();
      const wr = win.getBoundingClientRect();
      let offsetX = wr.left - cr.left;
      let offsetY = wr.top - cr.top;
      let startX = e.clientX;
      let startY = e.clientY;

      const onMove = (e: MouseEvent) => {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        offsetX += dx;
        offsetY += dy;
        startX = e.clientX;
        startY = e.clientY;
        const maxLeft = cr.width - wr.width;
        const maxTop = cr.height - wr.height;
        offsetX = Math.max(0, Math.min(offsetX, maxLeft));
        offsetY = Math.max(0, Math.min(offsetY, maxTop));
        win.style.left = offsetX + 'px';
        win.style.top = offsetY + 'px';
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    };

    titleBar.addEventListener('mousedown', onMouseDown);
    return () => titleBar.removeEventListener('mousedown', onMouseDown);
  }, [windowRef, containerRef, titleBarSelector, ...deps]);
}
