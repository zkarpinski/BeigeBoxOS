import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Itunes8Window } from '../app/components/apps/itunes8/Itunes8Window';
import { WindowManagerProvider, OsShellProvider } from '@retro-web/core/context';
import { TitleBar } from '../app/components/winxp/TitleBar';
import { AppWindow } from '../app/components/winxp/AppWindow';

// Mock OsShellProvider to use WinXP components
const mockOsShell = {
  AppWindow,
  TitleBar,
  MenuBar: () => <div data-testid="mock-menubar" />,
};

describe('Itunes8Window', () => {
  const renderItunes = () => {
    return render(
      <OsShellProvider value={mockOsShell}>
        <WindowManagerProvider
          registry={[{ id: 'itunes8', label: 'iTunes', icon: '', desktop: true }]}
          initialOpenAppId="itunes8"
        >
          <Itunes8Window />
        </WindowManagerProvider>
      </OsShellProvider>,
    );
  };

  test('renders iTunes window with title and library', () => {
    renderItunes();
    expect(screen.getByText('iTunes')).toBeInTheDocument();
    // Check for some static library content (e.g., table headers)
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Artist')).toBeInTheDocument();
    expect(screen.getByText('Genre')).toBeInTheDocument();
  });

  test('search filters the library', async () => {
    renderItunes();
    const searchInput = screen.getByPlaceholderText('Search');
    fireEvent.change(searchInput, { target: { value: 'U2' } });

    // U2 should be visible
    expect(screen.getAllByText(/U2/i).length).toBeGreaterThan(0);

    // Searching for something non-existent
    fireEvent.change(searchInput, { target: { value: 'NonExistentArtistXYZ' } });
    expect(screen.queryByText(/U2/i)).not.toBeInTheDocument();
  });

  test('view modes can be toggled', () => {
    renderItunes();
    const gridBtn = screen.getByText('Grid');
    const coverFlowBtn = screen.getByText('Cover Flow');
    const listBtn = screen.getByText('List');

    fireEvent.click(gridBtn);
    expect(screen.getByText(/Grid view — use List/i)).toBeInTheDocument();

    fireEvent.click(coverFlowBtn);
    expect(screen.getByText(/Cover Flow — use List/i)).toBeInTheDocument();

    fireEvent.click(listBtn);
    expect(screen.queryByText(/Grid view — use List/i)).not.toBeInTheDocument();
  });

  test('transport controls (play/pause) toggle state', () => {
    renderItunes();
    const playBtn = screen.getByLabelText('Play');
    fireEvent.click(playBtn);
    expect(screen.getByLabelText('Pause')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Pause'));
    expect(screen.getByLabelText('Play')).toBeInTheDocument();
  });

  test('double clicking a song selects and plays it', async () => {
    renderItunes();
    // Wait for library to render
    const tracks = await screen.findAllByText(/1\./); // Multiple "1. ..." tracks (one per album)
    fireEvent.doubleClick(tracks[0]);

    // Should be playing now (Pause button visible)
    expect(screen.getByLabelText('Pause')).toBeInTheDocument();
  });
});
