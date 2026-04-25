/**
 * Unit tests for Karpos DesktopIcons.
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DesktopIcons } from '../app/components/karpos-desktop/desktop-icons';
import { WindowManagerProvider } from '@retro-web/core/context';

// Mock fileSystem
jest.mock('../app/fileSystem', () => ({
  DESKTOP_PATH: '/home/zkarpinski/Desktop',
  listDir: jest.fn().mockReturnValue([
    { name: 'Folder', path: '/home/zkarpinski/Desktop/Folder', type: 'folder' },
    { name: 'File.txt', path: '/home/zkarpinski/Desktop/File.txt', type: 'file' },
  ]),
  openFileByPath: jest.fn(),
  getFileIconPath: jest.fn().mockReturnValue(''),
  getAppIcon: jest.fn().mockReturnValue(''),
  createFolder: jest.fn(),
  writeFile: jest.fn(),
  renamePath: jest.fn(),
  getNode: jest.fn(),
}));

import { listDir, createFolder, writeFile } from '../app/fileSystem';

describe('DesktopIcons', () => {
  const mockRegistry = [{ id: 'test-app', label: 'Test App', icon: '', component: () => null }];

  test('renders icons from file system and links', () => {
    render(
      <WindowManagerProvider registry={mockRegistry}>
        <DesktopIcons registry={mockRegistry} />
      </WindowManagerProvider>,
    );

    expect(screen.getByText('Folder')).toBeInTheDocument();
    expect(screen.getByText('File.txt')).toBeInTheDocument();
    // Also links from karposDesktopLinks
    expect(screen.getByText('GitHub')).toBeInTheDocument();
  });

  test('selects an icon on click', () => {
    render(
      <WindowManagerProvider registry={mockRegistry}>
        <DesktopIcons registry={mockRegistry} />
      </WindowManagerProvider>,
    );

    const folder = screen.getByText('Folder').closest('.desktop-icon');
    fireEvent.click(folder!);
    expect(folder).toHaveClass('selected');
  });

  test('opens context menu on right click', () => {
    render(
      <WindowManagerProvider registry={mockRegistry}>
        <DesktopIcons registry={mockRegistry} />
      </WindowManagerProvider>,
    );

    const folder = screen.getByText('Folder').closest('.desktop-icon');
    fireEvent.contextMenu(folder!);

    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  test('shows desktop context menu', () => {
    render(
      <WindowManagerProvider registry={mockRegistry}>
        <DesktopIcons registry={mockRegistry} />
      </WindowManagerProvider>,
    );

    const desktop = document.getElementById('desktop-icons');
    fireEvent.contextMenu(desktop!);

    expect(screen.getByText('New Folder')).toBeInTheDocument();
    expect(screen.getByText('New File')).toBeInTheDocument();
  });

  test('creates new folder', () => {
    render(
      <WindowManagerProvider registry={mockRegistry}>
        <DesktopIcons registry={mockRegistry} />
      </WindowManagerProvider>,
    );

    const desktop = document.getElementById('desktop-icons');
    fireEvent.contextMenu(desktop!);

    fireEvent.click(screen.getByText('New Folder'));
    expect(createFolder).toHaveBeenCalled();
  });
});
