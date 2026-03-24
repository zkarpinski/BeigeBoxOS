'use client';

import React from 'react';
import type { MenuBarProps } from '@retro-web/core/types/os-shell';

export type {
  MenuDropdownItem,
  MenuItemConfig,
  MenuBarProps,
} from '@retro-web/core/types/os-shell';

function formatLabel(label: string, shortcutChar?: string): React.ReactNode {
  if (!shortcutChar) return label;
  const i = label.toLowerCase().indexOf(shortcutChar.toLowerCase());
  if (i === -1) return label;
  return (
    <>
      {label.slice(0, i)}
      <u>{label[i]}</u>
      {label.slice(i + 1)}
    </>
  );
}

/**
 * Generic Win98-style menu bar with dropdowns. Use app-specific class names
 * so existing CSS (e.g. notepad-menu-bar) still applies.
 */
export function MenuBar({
  items,
  className = '',
  itemClassName = 'menu-item',
  dropdownClassName = 'menu-dropdown',
  dropdownItemClassName = 'dropdown-item',
  dividerClassName = 'dropdown-divider',
}: MenuBarProps) {
  return (
    <div className={className}>
      {items.map((item, idx) => (
        <div key={idx} className={itemClassName}>
          {formatLabel(item.label, item.shortcutChar)}
          {item.dropdown && item.dropdown.length > 0 && (
            <div className={dropdownClassName}>
              {item.dropdown.map((d, i) =>
                d.divider ? (
                  <div key={`div-${i}`} className={dividerClassName} />
                ) : (
                  <div key={i} id={d.id} className={dropdownItemClassName} onClick={d.onClick}>
                    <span>
                      {d.label != null && d.shortcutChar != null
                        ? formatLabel(d.label, d.shortcutChar)
                        : d.label}
                    </span>
                    {d.shortcut && <span className="notepad-shortcut">{d.shortcut}</span>}
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
