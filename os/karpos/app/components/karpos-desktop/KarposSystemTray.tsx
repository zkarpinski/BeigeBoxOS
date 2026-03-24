'use client';

/**
 * KarpOS-only system tray: tray apps + clock; some tray apps filtered via {@link trayAppFilter}.
 * Win98’s {@link SystemTray} is unchanged; this component duplicates the layout with KarpOS behavior.
 */
import type { AppConfig } from '@retro-web/core/types/app-config';
import { useWindowManager } from '@retro-web/core/context';
import { TaskbarClock } from '@win98/components/shell/taskbar/TaskbarClock';

export function KarposSystemTray({
  registry,
  trayAppFilter = () => true,
}: {
  registry: AppConfig[];
  /** After registry `tray` flag — e.g. hide ZoneAlarm / AIM on KarpOS. */
  trayAppFilter?: (app: AppConfig) => boolean;
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

  return (
    <div className="system-tray">
      {registry
        .filter((a) => a.tray && trayAppFilter(a))
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
      <div className="tray-divider" />
      <TaskbarClock />
    </div>
  );
}
