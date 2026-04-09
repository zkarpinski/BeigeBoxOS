'use client';

/**
 * Exposes `window.MacOSX` for helpers — must render inside WindowManagerProvider.
 */
import { useEffect } from 'react';
import type { AppConfig } from '@retro-web/core/types/app-config';
import { useWindowManager, Z_FOCUSED, type DialogType } from '@retro-web/core/context';

export function MacGlobalShim({ registry }: { registry: AppConfig[] }) {
  const { apps, showApp, hideApp, focusApp, minimizeApp, isAppVisible, isMinimized, openDialog } =
    useWindowManager();

  useEffect(() => {
    const w = window as unknown as Record<string, unknown>;
    w['MacOSX'] = {
      apps,
      showApp,
      hideApp,
      focusApp,
      minimizeApp,
      isAppVisible,
      isMinimized,
      get activeAppId() {
        const focused = Object.entries(apps).find(
          ([, s]) => s.visible && !s.minimized && s.zIndex === Z_FOCUSED,
        );
        return focused ? focused[0] : null;
      },
      alert: (title: string, msg: string, type?: DialogType) =>
        openDialog({ type: type ?? 'info', title, message: msg, buttons: ['OK'] }),
      confirm: (title: string, msg: string, type?: DialogType) =>
        openDialog({
          type: type ?? 'question',
          title,
          message: msg,
          buttons: ['OK', 'Cancel'],
        }).then((btn) => btn === 'OK'),
      dialog: openDialog,
    };
  }, [
    apps,
    showApp,
    hideApp,
    focusApp,
    minimizeApp,
    isAppVisible,
    isMinimized,
    openDialog,
    registry,
  ]);

  return null;
}
