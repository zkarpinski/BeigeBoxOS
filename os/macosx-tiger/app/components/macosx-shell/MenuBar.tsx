'use client';

import React from 'react';
import { MenuBar as Win98MenuBar } from '@win98/components/win98/MenuBar';
import type { MenuBarProps } from '@retro-web/core/types/os-shell';

export type {
  MenuDropdownItem,
  MenuItemConfig,
  MenuBarProps,
} from '@retro-web/core/types/os-shell';

/**
 * Mac OS X in-window menu bar.
 * Wraps the shared Win98 MenuBar in the Aqua `mac-in-window-menu` strip.
 * CSS in macosx-shell.css handles the Aqua gradient and hover styles.
 */
export function MenuBar(props: MenuBarProps) {
  return (
    <div className="mac-in-window-menu">
      <Win98MenuBar {...props} />
    </div>
  );
}
