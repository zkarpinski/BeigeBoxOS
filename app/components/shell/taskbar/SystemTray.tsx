'use client';

import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { AppConfig } from '../../../types/app-config';
import { useWindowManager } from '../../../context/WindowManagerContext';
import { VolumePopup } from './VolumePopup';
import { TaskbarClock } from './TaskbarClock';

export function SystemTray({
  registry,
  volumeOpen,
  setVolumeOpen,
}: {
  registry: AppConfig[];
  volumeOpen: boolean;
  setVolumeOpen: Dispatch<SetStateAction<boolean>>;
}) {
  const { apps, showApp, minimizeApp } = useWindowManager();

  const handleTrayAppClick = (appId: string) => {
    const state = apps[appId];
    if (state?.visible && !state?.minimized) {
      minimizeApp(appId);
    } else {
      showApp(appId);
    }
  };

  useEffect(() => {
    if (!volumeOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#volume-popup') && !target.closest('#tray-volume')) {
        setVolumeOpen(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [volumeOpen, setVolumeOpen]);

  return (
    <>
      <div className="system-tray">
        {registry
          .filter((a) => a.tray)
          .map((app) => (
            <img
              key={app.id}
              src={app.icon}
              alt={app.label}
              title={app.label}
              width={16}
              height={16}
              className="tray-icon tray-app-icon"
              onClick={(e) => {
                e.stopPropagation();
                handleTrayAppClick(app.id);
              }}
            />
          ))}
        <div
          id="tray-volume"
          className="tray-icon tray-volume-icon"
          title="Volume"
          onClick={(e) => {
            e.stopPropagation();
            setVolumeOpen((v) => !v);
          }}
        >
          🔊
        </div>
        <div className="tray-divider" />
        <TaskbarClock />
      </div>
      <VolumePopup open={volumeOpen} />
    </>
  );
}
