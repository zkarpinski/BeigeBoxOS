'use client';

import type { AppConfig } from '../../../types/app-config';
import { useWindowManager } from '@retro-web/core/context';

export function TaskbarTasks({ registry }: { registry: AppConfig[] }) {
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

  return (
    <div className="taskbar-tasks">
      {registry.map((app) => {
        const visible = apps[app.id]?.visible ?? false;
        const focused = visible && (apps[app.id]?.zIndex ?? 10) > 10;
        return (
          <div
            key={app.id}
            className={`taskbar-task${visible ? '' : ' app-taskbar-hidden'}${focused ? ' active' : ''}`}
            id={`taskbar-${app.id}`}
            onClick={() => handleTaskClick(app.id)}
          >
            <img src={app.icon} alt="" width={16} height={16} style={{ marginRight: 4 }} />
            <span className="task-text">{app.taskbarLabel ?? app.label}</span>
          </div>
        );
      })}
    </div>
  );
}
