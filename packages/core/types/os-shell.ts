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

/** Menu bar item types — shared by all OS `MenuBar` implementations (`packages/core/types/os-shell.ts`). */
export interface MenuDropdownItem {
  id?: string;
  label?: string;
  /** Character to underline in label (e.g. 'N' for "New") */
  shortcutChar?: string;
  shortcut?: string;
  divider?: boolean;
  onClick?: () => void;
}

export interface MenuItemConfig {
  label: string;
  /** Character to underline (e.g. 'F' for "File") */
  shortcutChar?: string;
  dropdown?: MenuDropdownItem[];
}

export interface MenuBarProps {
  items: MenuItemConfig[];
  /** Base class for the menu bar (e.g. 'notepad-menu-bar') */
  className?: string;
  /** Class for each menu item (e.g. 'notepad-menu-item') */
  itemClassName?: string;
  /** Class for dropdown container (e.g. 'notepad-menu-dropdown') */
  dropdownClassName?: string;
  /** Class for dropdown item (e.g. 'notepad-dropdown-item') */
  dropdownItemClassName?: string;
  dividerClassName?: string;
}

/** What each OS passes so shared apps render with native window shell + FS integration. */
export interface OsShellValue {
  AppWindow: React.ComponentType<AppWindowProps>;
  TitleBar: React.ComponentType<TitleBarProps>;
  /** OS-themed menu bar (dropdowns). Each desktop passes its native implementation. */
  MenuBar: React.ComponentType<MenuBarProps>;
  /** Virtual FS write — each OS uses its own storage key in fileSystem.ts */
  writeFile: (path: string, content: string) => void;
}
