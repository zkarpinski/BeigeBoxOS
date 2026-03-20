import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MenuBar, MenuItemConfig } from './MenuBar';

describe('MenuBar', () => {
  const defaultItems: MenuItemConfig[] = [
    {
      label: 'File',
      shortcutChar: 'F',
      dropdown: [
        { id: 'menu-new', label: 'New', shortcutChar: 'N', shortcut: 'Ctrl+N', onClick: jest.fn() },
        { divider: true },
        { id: 'menu-exit', label: 'Exit', shortcutChar: 'x', onClick: jest.fn() },
      ],
    },
    {
      label: 'Edit',
      shortcutChar: 'E',
      dropdown: [{ id: 'menu-undo', label: 'Undo', shortcutChar: 'U', shortcut: 'Ctrl+Z' }],
    },
    {
      label: 'Help',
      shortcutChar: 'H',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders top-level menu items', () => {
    const { container } = render(<MenuBar items={defaultItems} />);

    // Check if the top level menus are rendered.
    // The text is split due to the <u> tag for shortcuts, so we can verify by textContent
    const items = container.querySelectorAll('.menu-item');
    expect(items.length).toBe(3);

    // Check textContent ignoring child elements
    expect(items[0].textContent).toContain('File');
    expect(items[1].textContent).toContain('Edit');
    expect(items[2].textContent).toContain('Help');
  });

  test('formats shortcut characters with <u> tag', () => {
    const { container } = render(<MenuBar items={defaultItems} />);

    // The "F" in "File" should be underlined
    const fileU = container.querySelector('.menu-item u');
    expect(fileU).toBeInTheDocument();
    expect(fileU?.textContent).toBe('F');
  });

  test('renders dropdown items', () => {
    const { container } = render(<MenuBar items={defaultItems} />);

    // Check dropdown item text content (regex due to split text from <u> tags)
    const dropdownItems = container.querySelectorAll('.dropdown-item');
    expect(dropdownItems.length).toBe(3);

    expect(dropdownItems[0].textContent).toContain('New');
    expect(dropdownItems[1].textContent).toContain('Exit');
    expect(dropdownItems[2].textContent).toContain('Undo');

    // Check shortcut strings are rendered
    expect(screen.getByText('Ctrl+N')).toBeInTheDocument();
    expect(screen.getByText('Ctrl+Z')).toBeInTheDocument();
  });

  test('renders dividers in dropdown', () => {
    const { container } = render(<MenuBar items={defaultItems} />);

    // The default dividerClassName is 'dropdown-divider'
    const dividers = container.querySelectorAll('.dropdown-divider');
    expect(dividers.length).toBe(1);
  });

  test('calls onClick handler when dropdown item is clicked', () => {
    const { container } = render(<MenuBar items={defaultItems} />);

    // Find the Exit dropdown item by its ID
    const exitItem = container.querySelector('#menu-exit');
    expect(exitItem).toBeInTheDocument();

    fireEvent.click(exitItem!);

    // Get the onClick mock function we passed
    const exitOnClick = defaultItems[0].dropdown![2].onClick;
    expect(exitOnClick).toHaveBeenCalledTimes(1);
  });

  test('applies custom class names correctly', () => {
    const customProps = {
      className: 'custom-bar',
      itemClassName: 'custom-item',
      dropdownClassName: 'custom-dropdown',
      dropdownItemClassName: 'custom-dropdown-item',
      dividerClassName: 'custom-divider',
    };

    const { container } = render(<MenuBar items={defaultItems} {...customProps} />);

    expect(container.querySelector('.custom-bar')).toBeInTheDocument();
    expect(container.querySelectorAll('.custom-item').length).toBe(3); // 3 top-level items
    expect(container.querySelectorAll('.custom-dropdown').length).toBe(2); // 2 top-level items have dropdowns
    expect(container.querySelectorAll('.custom-dropdown-item').length).toBe(3); // 3 non-divider dropdown items
    expect(container.querySelectorAll('.custom-divider').length).toBe(1); // 1 divider
  });

  test('does not throw when shortcutChar is not found in label', () => {
    const items: MenuItemConfig[] = [
      {
        label: 'View',
        shortcutChar: 'Z', // Not in "View"
      },
    ];

    const { container } = render(<MenuBar items={items} />);
    // The label should still render without a <u> tag
    expect(screen.getByText('View')).toBeInTheDocument();
    expect(container.querySelector('u')).not.toBeInTheDocument();
  });
});
