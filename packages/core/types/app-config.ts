export interface AppConfig {
  /** Unique app id. Drives all derived IDs. */
  id: string;
  /**
   * Primary label (the "app_label").
   * Default text for desktop icon, start menu item, and taskbar button.
   */
  label: string;
  /** Icon path or URL — single source of truth used everywhere. */
  icon: string;
  /** Open on startup. Default: false. */
  openByDefault?: boolean;
  /**
   * Desktop icon config.
   * true → show with label.
   * { label } → show with override label.
   * false/omitted → no desktop icon.
   */
  desktop?: boolean | { label?: string };
  /**
   * Start menu placement.
   * false/omitted → not in start menu.
   * path: folder hierarchy, e.g. ['Programs', 'Accessories'].
   * label → override display label.
   */
  startMenu?: false | { path: string[]; label?: string };
  /** Override label shown on taskbar button. Defaults to label. */
  taskbarLabel?: string;
  /** Show a tray icon in the system tray next to the clock. Clicking toggles the window. */
  tray?: boolean;
}
