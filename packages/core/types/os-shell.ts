import type React from 'react';
import type { AppConfig } from './app-config';

/**
 * Contract for OS-specific window shell (title bar, drag, resize).
 * Each OS package implements these with native look & feel (Win98 vs XP Luna, etc.).
 */
export interface TitleBarProps {
  title: string;
  icon?: React.ReactNode;
  showMin?: boolean;
  showMax?: boolean;
  showClose?: boolean;
  className?: string;
}

export interface AppWindowProps {
  id: string;
  appId: string;
  className: string;
  titleBar: React.ReactNode;
  children: React.ReactNode;
  allowResize?: boolean;
  maximizedClass?: string;
  onClose?: () => void;
  getCanDrag?: (el: HTMLElement) => boolean;
}

export type WithAppConfig<T> = T & { appConfig: AppConfig };

/** What each OS passes so shared apps render with native window shell + FS integration. */
export interface OsShellValue {
  AppWindow: React.ComponentType<AppWindowProps>;
  TitleBar: React.ComponentType<TitleBarProps>;
  /** Virtual FS write — each OS uses its own storage key in fileSystem.ts */
  writeFile: (path: string, content: string) => void;
}
