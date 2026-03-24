'use client';

/**
 * KarpOS taskbar: one neo-brutalist icon chip per **open** window (no titles).
 * Win98’s {@link TaskbarTasks} is unchanged.
 */
import type { AppConfig } from '@retro-web/core/types/app-config';
import { useWindowManager } from '@retro-web/core/context';
import { karposNeoTileColor } from './karposNeoTileColors';

export function KarposTaskbarTasks({ registry }: { registry: AppConfig[] }) {
  const { apps, showApp, focusApp, minimizeApp } = useWindowManager();

  const handleTaskClick = (appId: string) => {
    const state = apps[appId];
    if (!state?.visible) return;
    if (state.minimized) {
      showApp(appId);
    } else if (state.zIndex > 10) {
      minimizeApp(appId);
    } else {
      focusApp(appId);
    }
  };

  const openApps = registry.filter((app) => apps[app.id]?.visible);

  return (
    <div className="karpos-taskbar-tasks">
      {openApps.map((app) => {
        const focused = (apps[app.id]?.zIndex ?? 10) > 10;
        const label = app.taskbarLabel ?? app.label;
        return (
          <button
            key={app.id}
            type="button"
            className={`karpos-taskbar-chip${focused ? ' karpos-taskbar-chip--focused' : ''}`}
            id={`taskbar-${app.id}`}
            style={{ backgroundColor: karposNeoTileColor(app.id) }}
            onClick={() => handleTaskClick(app.id)}
            title={label}
            aria-label={label}
          >
            <span className="karpos-taskbar-chip__inner" aria-hidden>
              <img src={app.icon} alt="" width={20} height={20} draggable={false} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
