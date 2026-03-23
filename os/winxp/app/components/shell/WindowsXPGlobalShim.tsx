'use client';

/** Exposes `window.WindowsXP` — must render inside WindowManagerProvider. */
import { useEffect } from 'react';
import type { AppConfig } from '@retro-web/core/types/app-config';
import { useWindowManager, Z_FOCUSED, type DialogType } from '@retro-web/core/context';

export function WindowsXPGlobalShim({ registry }: { registry: AppConfig[] }) {
  const {
    apps,
    showApp,
    hideApp,
    focusApp,
    minimizeApp,
    isAppVisible,
    isMinimized,
    openDialog,
    openBsod,
    openFatalError,
    clearBsod,
  } = useWindowManager();

  useEffect(() => {
    const w = window as unknown as Record<string, unknown>;
    w['WindowsXP'] = {
      apps,
      registerApp: () => {},
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
      handleStartMenuItem: (clickedId: string) => {
        const app = registry.find(
          (a) => `start-menu-${a.id}` === clickedId || `start-${a.id}` === clickedId,
        );
        if (app) {
          if (isAppVisible(app.id) && !isMinimized(app.id)) focusApp(app.id);
          else showApp(app.id);
          return true;
        }
        return false;
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
      bsod: openBsod,
      fatalError: openFatalError,
      _clearBsod: clearBsod,
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
    openBsod,
    openFatalError,
    clearBsod,
    registry,
  ]);

  return null;
}
